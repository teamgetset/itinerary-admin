"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { runPackageCommand, type PackageCommand } from "@/app/(admin)/packages/actions";
import { buttonStyles } from "./ui";

const CONFIRM: Partial<Record<PackageCommand, string>> = {
  unpublish: "Unpublish this package? It disappears from the website straight away.",
  archive: "Archive this package? It disappears from the website and moves to the archive.",
  delete: "Delete this package? It is removed from the admin and there is no undo; enquiries that mention it keep their history.",
};
/** Deleting a live package also takes it off the website, so its question says so. */
const CONFIRM_DELETE_LIVE =
  "Delete this live package? It disappears from the website straight away and is removed from the admin, and there is no undo; enquiries that mention it keep their history.";

/**
 * Lifecycle buttons for a package: preview, publish or unpublish, duplicate, archive, delete.
 * Which ones show depends on the status and the user's role (the API enforces both again).
 */
export function PackageActions({
  id,
  status,
  canPublish,
  compact = false,
  onDone,
}: {
  id: string;
  status: string;
  canPublish: boolean;
  compact?: boolean;
  onDone?: (message: string, ok: boolean) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<PackageCommand | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const run = (command: PackageCommand) => {
    const question = command === "delete" && status === "PUBLISHED" ? CONFIRM_DELETE_LIVE : CONFIRM[command];
    if (question && !confirm(question)) return;
    // Open the preview tab now, inside the click, so pop-up blockers allow it; the URL arrives after.
    const previewTab = command === "preview" ? window.open("about:blank", "_blank") : null;
    setBusy(command);
    start(async () => {
      const result = await runPackageCommand(id, command);
      setBusy(null);
      const text = result.ok ? (result.message ?? "Done.") : result.message;
      setMessage({ text, ok: result.ok });
      onDone?.(text, result.ok);
      if (!result.ok) {
        previewTab?.close();
        return;
      }
      if (command === "preview" && previewTab) previewTab.location.href = String(result.data.url);
      else if (command === "duplicate") router.push(`/packages/${result.data.id}`);
      else if (command === "delete") router.push("/packages");
      else router.refresh();
    });
  };

  const button = (command: PackageCommand, label: string, variant: keyof typeof buttonStyles = "secondary") => (
    <button type="button" disabled={pending} onClick={() => run(command)} className={`${buttonStyles[variant]} ${compact ? "h-8 px-2.5 text-xs" : ""}`}>
      {busy === command ? "Working…" : label}
    </button>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {button("preview", "Preview")}
        {canPublish && status !== "PUBLISHED" && button("publish", "Publish", "primary")}
        {canPublish && status === "PUBLISHED" && button("unpublish", "Unpublish")}
        {button("duplicate", "Duplicate")}
        {canPublish && status !== "ARCHIVED" && button("archive", "Archive")}
        {canPublish && button("delete", "Delete", "danger")}
      </div>
      {!onDone && message && (
        <p role={message.ok ? "status" : "alert"} className={`text-xs ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
