"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle, FilePdf, XCircle } from "@phosphor-icons/react";
import { runPackageCommand } from "@/app/(admin)/packages/actions";
import { formatBytes, formatDateTime } from "@/lib/format";
import { PackageActions } from "../package-actions";
import { FormMessage } from "../resource-form";
import { Badge, buttonStyles } from "../ui";

export interface PdfFile {
  sizeBytes: number;
}

export interface PdfVersion {
  version: number;
  generatedAt: string;
  withLogo: PdfFile;
  withoutLogo: PdfFile;
}

/**
 * Edit -> Preview -> Generate PDF -> Preview PDF -> Publish, on one screen.
 * The checklist must pass before Publish; publishing also builds the PDF if this content has none yet.
 */
export function PublishPanel({
  packageId,
  status,
  checklist,
  pdf,
  canPublish,
}: {
  packageId: string;
  status: string;
  checklist: { key: string; label: string; ok: boolean; message?: string }[];
  pdf: { current: PdfVersion | null; upToDate: boolean; versions: PdfVersion[] };
  canPublish: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const ready = checklist.every((item) => item.ok);

  const generate = () =>
    start(async () => {
      const done = await runPackageCommand(packageId, "pdf");
      setResult(done);
      if (done.ok) router.refresh();
    });

  const link = (version: number, branding: "with-logo" | "without-logo") => `/pdf/${packageId}/${version}/${branding}`;

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
          {status === "PUBLISHED"
            ? "This package is live. Saved edits show on the website within a minute, and its PDF is rebuilt automatically."
            : ready
              ? canPublish
                ? "Everything is in place. Preview it, then publish."
                : "Everything is in place. Ask an admin to publish it."
              : "Drafts may be incomplete; published packages may not."}
        </p>
        <div className="mt-4">
          <PackageActions id={packageId} status={status} canPublish={canPublish && (ready || status === "PUBLISHED")} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-navy">
          <FilePdf aria-hidden className="size-5" /> Itinerary PDF
        </h3>
        {pdf.current ? (
          <p className="text-sm">
            Version {pdf.current.version}, generated {formatDateTime(pdf.current.generatedAt)} <Badge tone="success">Matches the package</Badge>
          </p>
        ) : (
          <p className="text-sm">
            <Badge tone="warning">Needs generating</Badge>{" "}
            <span className="text-muted">The content changed since the last PDF{status === "PUBLISHED" ? "; it is being rebuilt, or generate it now." : "."}</span>
          </p>
        )}
        <p className="mt-2 text-sm text-muted">Both prints come from the same data: one with the GETSET logo, one without.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={generate} disabled={pending || !!pdf.current} className={buttonStyles.secondary}>
            {pending ? "Generating…" : pdf.current ? "PDF is current" : "Generate PDF"}
          </button>
          <FormMessage result={result} />
        </div>

        {pdf.versions.length > 0 && (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted uppercase">
                <th scope="col" className="py-1.5">Version</th>
                <th scope="col" className="py-1.5">Generated</th>
                <th scope="col" className="py-1.5">Preview</th>
              </tr>
            </thead>
            <tbody>
              {pdf.versions.slice(0, 6).map((version) => (
                <tr key={version.version} className="border-t border-line">
                  <td className="py-2 font-semibold">v{version.version}</td>
                  <td className="py-2">{formatDateTime(version.generatedAt)}</td>
                  <td className="py-2">
                    <a href={link(version.version, "with-logo")} target="_blank" rel="noreferrer" className="font-semibold text-cobalt hover:underline">
                      With logo
                    </a>{" "}
                    <span className="text-muted">({formatBytes(version.withLogo.sizeBytes)})</span>
                    {" · "}
                    <a href={link(version.version, "without-logo")} target="_blank" rel="noreferrer" className="font-semibold text-cobalt hover:underline">
                      Without logo
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
