import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { formatBytes, formatDateTime, humanize } from "@/lib/format";
import { Badge, PageHeader, Pagination, STATUS_TONE, Table } from "@/components/ui";

export const metadata: Metadata = { title: "Itinerary PDFs" };

interface PdfSummary {
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
}

interface Row {
  id: string;
  title: string;
  status: string;
  itineraryPdf: PdfSummary | null;
  /** Missing from an API older than the second version. */
  itineraryPdfWithoutLogo?: PdfSummary | null;
}

/** One version's file: name (opens the preview), size and upload date. */
function PdfCell({ pdf, href }: { pdf: PdfSummary; href: string }) {
  return (
    <>
      <a href={href} target="_blank" rel="noreferrer" className="font-semibold break-all text-cobalt hover:underline">
        {pdf.fileName}
      </a>
      <span className="block text-xs text-muted">
        {formatBytes(pdf.sizeBytes)} · {formatDateTime(pdf.uploadedAt)}
      </span>
    </>
  );
}

export default async function PdfsPage({ searchParams }: PageProps<"/pdfs">) {
  const page = Number((await searchParams).page) || 1;
  const { data: packages, meta } = await api<Row[]>(`/admin/packages?pageSize=20&page=${page}`);

  return (
    <>
      <PageHeader
        title="Itinerary PDFs"
        description="Each package has its itinerary PDF in two versions, prepared outside GETSET and uploaded in its PDF & publish tab (PDF only, up to 4 MB): with the GETSET logo, required to publish, and optionally without it. Customers choose which one to download on the package page."
      />
      <Table>
        <thead>
          <tr>
            <th scope="col">Package</th>
            <th scope="col">Status</th>
            <th scope="col">With logo</th>
            <th scope="col">Without logo</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.id}>
              <td>
                <Link href={`/packages/${pkg.id}?tab=publish`} className="font-semibold text-navy hover:text-cobalt hover:underline">
                  {pkg.title}
                </Link>
              </td>
              <td>
                <Badge tone={STATUS_TONE[pkg.status]}>{humanize(pkg.status)}</Badge>
              </td>
              <td>
                {pkg.itineraryPdf ? (
                  <PdfCell pdf={pkg.itineraryPdf} href={`/pdf/${pkg.id}`} />
                ) : (
                  <Badge tone={pkg.status === "PUBLISHED" ? "danger" : "warning"}>Missing</Badge>
                )}
              </td>
              <td>
                {pkg.itineraryPdfWithoutLogo ? (
                  <PdfCell pdf={pkg.itineraryPdfWithoutLogo} href={`/pdf/${pkg.id}?version=without-logo`} />
                ) : (
                  <span className="text-muted">Not uploaded</span>
                )}
              </td>
              <td className="whitespace-nowrap">
                <Link href={`/packages/${pkg.id}?tab=publish`} className="text-cobalt hover:underline">
                  {pkg.itineraryPdf && pkg.itineraryPdfWithoutLogo ? "Replace" : "Upload"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} params={{}} />}
    </>
  );
}
