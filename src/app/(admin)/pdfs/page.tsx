import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { formatBytes, formatDateTime, humanize } from "@/lib/format";
import { Badge, PageHeader, Pagination, STATUS_TONE, Table } from "@/components/ui";

export const metadata: Metadata = { title: "Itinerary PDFs" };

interface Row {
  id: string;
  title: string;
  status: string;
  itineraryPdf: { fileName: string; sizeBytes: number; uploadedAt: string } | null;
}

export default async function PdfsPage({ searchParams }: PageProps<"/pdfs">) {
  const page = Number((await searchParams).page) || 1;
  const { data: packages, meta } = await api<Row[]>(`/admin/packages?pageSize=20&page=${page}`);

  return (
    <>
      <PageHeader
        title="Itinerary PDFs"
        description="Each package has one itinerary PDF, prepared outside GETSET and uploaded in its PDF & publish tab (PDF only, up to 4 MB). Customers download it from the package page. A package cannot be published without one."
      />
      <Table>
        <thead>
          <tr>
            <th scope="col">Package</th>
            <th scope="col">Status</th>
            <th scope="col">Itinerary PDF</th>
            <th scope="col">Uploaded</th>
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
                  <>
                    <span className="break-all">{pkg.itineraryPdf.fileName}</span> <span className="text-muted">({formatBytes(pkg.itineraryPdf.sizeBytes)})</span>
                  </>
                ) : (
                  <Badge tone={pkg.status === "PUBLISHED" ? "danger" : "warning"}>Missing</Badge>
                )}
              </td>
              <td className="whitespace-nowrap">{pkg.itineraryPdf ? formatDateTime(pkg.itineraryPdf.uploadedAt) : "—"}</td>
              <td className="whitespace-nowrap">
                {pkg.itineraryPdf && (
                  <>
                    <a href={`/pdf/${pkg.id}`} target="_blank" rel="noreferrer" className="font-semibold text-cobalt hover:underline">
                      Preview
                    </a>
                    {" · "}
                  </>
                )}
                <Link href={`/packages/${pkg.id}?tab=publish`} className="text-cobalt hover:underline">
                  {pkg.itineraryPdf ? "Replace" : "Upload"}
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
