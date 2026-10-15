"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { CheckCircle, FilePdf, XCircle } from "@phosphor-icons/react";
import { removeItineraryPdf, uploadItineraryPdf } from "@/app/(admin)/packages/actions";
import { formatBytes, formatDateTime } from "@/lib/format";
import { pdfFileProblem } from "@/lib/pdf-file.mjs";
import { PackageActions } from "../package-actions";
import { FormMessage } from "../resource-form";
import { Badge, buttonStyles } from "../ui";

export interface ItineraryPdf {
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string | null;
}

type Version = "with-logo" | "without-logo";

/** What each version's block says. Only the version with the logo is required to publish. */
const VERSION_TEXT: Record<Version, { title: string; empty: string; emptyLive?: string; confirmRemove: string }> = {
  "with-logo": {
    title: "Itinerary PDF with logo",
    empty: "Upload the prepared itinerary with the GETSET logo. It is required to publish.",
    emptyLive: "This live package has no itinerary PDF: customers see it as not available. Upload one.",
    confirmRemove: "Remove the itinerary PDF with logo? Its file is deleted, and the package cannot be published again until a new one is uploaded.",
  },
  "without-logo": {
    title: "Itinerary PDF without logo",
    empty: "Optional: the same itinerary without the GETSET logo. Once uploaded, customers can choose it on the package page.",
    confirmRemove: "Remove the itinerary PDF without logo? Its file is deleted, and customers can no longer download that version.",
  },
};

/**
 * Edit -> Preview -> upload the itinerary PDFs -> Publish, on one screen.
 * Every checklist item, including the PDF with logo, must pass before Publish (the API enforces it again).
 */
export function PublishPanel({
  packageId,
  status,
  checklist,
  itineraryPdf,
  itineraryPdfWithoutLogo,
  canPublish,
  canRemovePdf,
}: {
  packageId: string;
  status: string;
  checklist: { key: string; label: string; ok: boolean; message?: string }[];
  itineraryPdf: ItineraryPdf | null;
  itineraryPdfWithoutLogo: ItineraryPdf | null;
  canPublish: boolean;
  canRemovePdf: boolean;
}) {
  const ready = checklist.every((item) => item.ok);
  const missing = checklist.filter((item) => !item.ok);
  const live = status === "PUBLISHED";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h3 className="mb-3 font-semibold text-navy">Ready to publish?</h3>
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li key={item.key} className="flex items-start gap-2 text-sm">
              {item.ok ? <CheckCircle aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0 text-success" /> : <XCircle aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0 text-danger" />}
              <span>
                <span className="font-semibold">{item.label}</span>
                <span className="sr-only">{item.ok ? ": done" : ": missing"}</span>
                {item.message && <span className="block text-muted">{item.message}</span>}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          {live
            ? "This package is live. Saved edits show on the website within a minute."
            : ready
              ? canPublish
                ? "Everything is in place. Preview it, then publish."
                : "Everything is in place. Ask an admin to publish it."
              : missing.length === 1 && missing[0]!.key === "itineraryPdf"
                ? "Upload the itinerary PDF with logo to publish this package."
                : "Complete the checklist to publish. Drafts may be incomplete; published packages may not."}
        </p>
        <div className="mt-4">
          <PackageActions id={packageId} status={status} canPublish={canPublish && (ready || live)} />
        </div>
      </section>

      <div className="space-y-8">
        <ItineraryPdfSection packageId={packageId} version="with-logo" live={live} pdf={itineraryPdf} canRemove={canRemovePdf} />
        <ItineraryPdfSection packageId={packageId} version="without-logo" live={live} pdf={itineraryPdfWithoutLogo} canRemove={canRemovePdf} />
      </div>
    </div>
  );
}

function ItineraryPdfSection({
  packageId,
  version,
  live,
  pdf,
  canRemove,
}: {
  packageId: string;
  version: Version;
  live: boolean;
  pdf: ItineraryPdf | null;
  canRemove: boolean;
}) {
  const text = VERSION_TEXT[version];
  // The version with the logo is required, so a live package keeps it; the one without can always be removed.
  const required = version === "with-logo";
  const helpId = `itinerary-pdf-help-${version}`;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setProblem(file ? pdfFileProblem(file) : null);
    setResult(null);
  };

  const run = (action: "upload" | "remove", call: () => Promise<{ ok: boolean; message?: string; data?: { warning?: string } }>, after?: () => void) => {
    setBusy(action);
    setResult(null);
    setWarning(null);
    start(async () => {
      try {
        const done = await call();
        setResult({ ok: done.ok, message: done.message });
        setWarning(done.ok ? (done.data?.warning ?? null) : null);
        if (done.ok) {
          after?.();
          router.refresh();
        }
      } catch {
        setResult({ ok: false, message: "That did not go through. Check your connection and that the PDF is under 4 MB, then try again." });
      } finally {
        setBusy(null);
      }
    });
  };

  const upload = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];
    const issue = file ? pdfFileProblem(file) : "Choose a PDF file.";
    if (issue || !file) return setResult({ ok: false, message: issue ?? "Choose a PDF file." });
    const data = new FormData();
    data.append("file", file);
    run("upload", () => uploadItineraryPdf(packageId, version, data), () => form.reset());
  };

  const remove = () => {
    if (!confirm(text.confirmRemove)) return;
    run("remove", () => removeItineraryPdf(packageId, version));
  };

  return (
    <section aria-label={text.title}>
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-navy">
        <FilePdf aria-hidden className="size-5" /> {text.title}
        {!required && <Badge>Optional</Badge>}
      </h3>
      {pdf ? (
        <div className="rounded-lg border border-line p-3 text-sm">
          <p className="font-semibold break-all text-ink">{pdf.fileName}</p>
          <p className="text-muted">
            {formatBytes(pdf.sizeBytes)} · uploaded {formatDateTime(pdf.uploadedAt)}
            {pdf.uploadedBy ? ` by ${pdf.uploadedBy}` : ""}
          </p>
          <a href={`/pdf/${packageId}${required ? "" : "?version=without-logo"}`} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-cobalt hover:underline">
            Preview PDF
          </a>
        </div>
      ) : (
        <p className="text-sm">
          {required && (
            <>
              <Badge tone="warning">No PDF yet</Badge>{" "}
            </>
          )}
          <span className="text-muted">{(live && text.emptyLive) || text.empty}</span>
        </p>
      )}

      <form onSubmit={upload} className="mt-4 space-y-2">
        <label className="block text-sm font-semibold">
          {pdf ? "Replace with a new PDF" : `Upload the ${text.title.charAt(0).toLowerCase()}${text.title.slice(1)}`}
          <input
            type="file"
            name="file"
            accept="application/pdf,.pdf"
            onChange={choose}
            aria-invalid={!!problem}
            aria-describedby={helpId}
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-white file:px-3 file:py-1.5 file:font-semibold file:text-navy hover:file:border-cobalt"
          />
        </label>
        <p id={helpId} className="text-xs text-muted">
          PDF only, up to 4 MB. Customers download it from the package page.
        </p>
        {problem && (
          <p role="alert" className="text-xs font-medium text-danger">
            {problem}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={pending || !!problem} className={buttonStyles.primary}>
            {busy === "upload" ? "Uploading…" : pdf ? "Replace PDF" : "Upload PDF"}
          </button>
          {pdf && canRemove && (!live || !required) && (
            <button type="button" onClick={remove} disabled={pending} className={buttonStyles.danger}>
              {busy === "remove" ? "Removing…" : "Remove PDF"}
            </button>
          )}
        </div>
        {pdf && live && required && <p className="text-xs text-muted">A live package must keep its PDF with logo: upload a replacement, or unpublish the package to remove it.</p>}
        <FormMessage result={result} />
        {warning && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {warning}
          </p>
        )}
      </form>
    </section>
  );
}
