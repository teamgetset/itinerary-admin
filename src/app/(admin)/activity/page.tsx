import type { Metadata } from "next";
import { api } from "@/lib/api";
import { formatDateTime, humanize } from "@/lib/format";
import { PageHeader, Pagination, Table } from "@/components/ui";

export const metadata: Metadata = { title: "Activity log" };

interface Entry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  admin: string | null;
}

export default async function ActivityPage({ searchParams }: PageProps<"/activity">) {
  const page = Number((await searchParams).page) || 1;
  const { data: entries, meta } = await api<Entry[]>(`/admin/audit-logs?pageSize=50&page=${page}`);
  return (
    <>
      <PageHeader title="Activity log" description="Who changed what, and when: sign-ins, edits, publishing, itinerary PDF uploads. Kept for accountability; passwords and tokens are never recorded." />
      <Table>
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Who</th>
            <th scope="col">What</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
              <td>{entry.admin ?? "System"}</td>
              <td>{humanize(entry.action)}</td>
              <td className="max-w-md truncate text-xs text-muted" title={JSON.stringify(entry.metadata)}>
                {Object.entries(entry.metadata)
                  .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
                  .join(" · ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} params={{}} />}
    </>
  );
}
