import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { formatBytes, formatDateTime, humanize } from "@/lib/format";
import { Badge, PageHeader, Pagination, STATUS_TONE, Table } from "@/components/ui";

export const metadata: Metadata = { title: "Itinerary PDFs" };

interface Pdf {
  version: number;
  generatedAt: string;
  withLogo: { sizeBytes: number };
  withoutLogo: { sizeBytes: number };
}

export default async function PdfsPage({ searchParams }: PageProps<"/pdfs">) {
  const page = Number((await searchParams).page) || 1;
  const { data: packages, meta } = await api<{ id: string; title: string; status: string }[]>(`/admin/packages?pageSize=20&page=${page}`);
  const statuses = await Promise.all(
    packages.map((pkg) => api<{ current: Pdf | null; versions: Pdf[] }>(`/admin/packages/${pkg.id}/pdf`).then((r) => r.data)),
  );

  return (
    <>
      <PageHeader
        title="Itinerary PDFs"
        description="PDFs are generated from each package's data, in two prints (with and without the GETSET logo). When a package changes, its next download builds a new version automatically, so the website never offers an out-of-date itinerary."
      />
      <Table>
        <thead>
          <tr>
            <th scope="col">Package</th>
            <th scope="col">Status</th>
            <th scope="col">PDF</th>
            <th scope="col">Latest version</th>
            <th scope="col">Preview</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg, index) => {
            const status = statuses[index]!;
            const latest = status.versions[0];
            return (
              <tr key={pkg.id}>
                <td>
                  <Link href={`/packages/${pkg.id}?tab=publish`} className="font-semibold text-navy hover:text-cobalt hover:underline">
                    {pkg.title}
                  </Link>
                </td>
                <td>
                  <Badge tone={STATUS_TONE[pkg.status]}>{humanize(pkg.status)}</Badge>
                </td>
                <td>{status.current ? <Badge tone="success">Matches the package</Badge> : <Badge tone="warning">Needs generating</Badge>}</td>
                <td className="whitespace-nowrap">{latest ? `v${latest.version}, ${formatDateTime(latest.generatedAt)}` : "—"}</td>
                <td className="whitespace-nowrap">
                  {latest ? (
                    <>
                      <a href={`/pdf/${pkg.id}/${latest.version}/with-logo`} target="_blank" rel="noreferrer" className="font-semibold text-cobalt hover:underline">
                        With logo
                      </a>{" "}
                      <span className="text-muted">({formatBytes(latest.withLogo.sizeBytes)})</span> ·{" "}
                      <a href={`/pdf/${pkg.id}/${latest.version}/without-logo`} target="_blank" rel="noreferrer" className="font-semibold text-cobalt hover:underline">
                        Without logo
                      </a>
                    </>
                  ) : (
                    <Link href={`/packages/${pkg.id}?tab=publish`} className="text-cobalt hover:underline">
                      Generate
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} params={{}} />}
    </>
  );
}
