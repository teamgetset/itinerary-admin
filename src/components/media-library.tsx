"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UploadSimple } from "@phosphor-icons/react";
import { archiveMedia, updateMedia, uploadMedia, type MediaItem } from "@/app/(admin)/actions";
import { formatBytes, formatDate } from "@/lib/format";
import { buttonStyles, inputStyles } from "./ui";

/** Upload several images at once; each is checked by the API (type from its bytes, 10 MB limit). */
export function UploadButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [messages, setMessages] = useState<string[]>([]);
  return (
    <div className="flex flex-col items-end gap-1">
      <label className={`${buttonStyles.primary} cursor-pointer`}>
        <UploadSimple aria-hidden className="size-4" />
        {pending ? "Uploading…" : "Upload images"}
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          disabled={pending}
          onChange={(event) => {
            const files = [...(event.target.files ?? [])];
            event.target.value = "";
            start(async () => {
              const problems: string[] = [];
              for (const file of files) {
                const form = new FormData();
                form.append("file", file);
                form.append("alt", file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
                const result = await uploadMedia(form);
                if (!result.ok) problems.push(`${file.name}: ${result.message}`);
              }
              setMessages(problems.length ? problems : [`Uploaded ${files.length} image${files.length === 1 ? "" : "s"}. Add alt text below.`]);
              router.refresh();
            });
          }}
        />
      </label>
      {messages.map((message) => (
        <p key={message} role="status" className="text-xs text-muted">
          {message}
        </p>
      ))}
    </div>
  );
}

/** One library item: preview, alt text and focal point editing, archive. */
export function MediaCard({ item, canArchive }: { item: MediaItem; canArchive: boolean }) {
  const router = useRouter();
  const [alt, setAlt] = useState(item.alt);
  const [focalPoint, setFocalPoint] = useState(item.focalPoint ?? "");
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const changed = alt !== item.alt || focalPoint !== (item.focalPoint ?? "");

  return (
    <li className="overflow-hidden rounded-card border border-line bg-white">
      <img src={item.url ?? ""} alt={item.alt} className="aspect-[4/3] w-full object-cover" style={{ objectPosition: focalPoint || undefined }} loading="lazy" />
      <form
        className="space-y-2 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          start(async () => {
            const result = await updateMedia(item.id, { alt, focalPoint: focalPoint || null });
            setMessage({ ok: result.ok, text: result.ok ? "Saved." : (Object.values(result.fieldErrors)[0] ?? result.message) });
            if (result.ok) router.refresh();
          });
        }}
      >
        <p className="truncate text-xs text-muted" title={item.fileName}>
          {item.fileName} · {formatBytes(item.sizeBytes)} · {formatDate(item.createdAt)}
        </p>
        <label className="block text-xs font-semibold">
          Alt text
          <input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Describe the photo" className={`${inputStyles} mt-1 font-normal`} />
        </label>
        <label className="block text-xs font-semibold">
          Focal point
          <input value={focalPoint} onChange={(event) => setFocalPoint(event.target.value)} placeholder="center 25%" className={`${inputStyles} mt-1 font-normal`} />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={!changed || pending} className={`${buttonStyles.secondary} h-8 px-3 text-xs`}>
            Save
          </button>
          {canArchive && (
            <button
              type="button"
              disabled={pending}
              className={`${buttonStyles.ghost} h-8 px-3 text-xs text-danger`}
              onClick={() => {
                if (!confirm("Archive this image? It stays where it is already used, but leaves the library.")) return;
                start(async () => {
                  const result = await archiveMedia(item.id);
                  if (result.ok) router.refresh();
                  else setMessage({ ok: false, text: result.message });
                });
              }}
            >
              Archive
            </button>
          )}
          {message && (
            <span role={message.ok ? "status" : "alert"} className={`text-xs ${message.ok ? "text-success" : "text-danger"}`}>
              {message.text}
            </span>
          )}
        </div>
      </form>
    </li>
  );
}
