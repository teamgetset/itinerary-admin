import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { formatAmount, formatDate, formatDateTime, humanize } from "@/lib/format";
import { ENQUIRY_STATUSES as STATUSES, type Enquiry } from "@/lib/enquiries";
import { Badge, EmptyState, PageHeader, Pagination, STATUS_TONE, Table, buttonStyles, inputStyles } from "@/components/ui";
import { FilterForm } from "@/components/filter-form";

export const metadata: Metadata = { title: "Enquiries" };

const param = (value: string | string[] | undefined) => (typeof value === "string" && value ? value : undefined);

export default async function EnquiriesPage({ searchParams }: PageProps<"/enquiries">) {
  const query = await searchParams;
  const filters = { q: param(query.q), status: param(query.status), branchId: param(query.branchId) };
  const page = Number(query.page) || 1;
  const search = new URLSearchParams({ page: String(page), pageSize: "25", ...(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) as Record<string, string>) });
  const [{ data: rows, meta }, branches] = await Promise.all([
    api<Enquiry[]>(`/admin/enquiries?${search}`),
    api<{ id: string; name: string }[]>("/admin/branches?pageSize=100"),
  ]);

  return (
    <>
      <PageHeader title="Enquiries" description="Requests from the website's enquiry form, newest first. WhatsApp chats go straight to the branch and are not listed here." />
      <FilterForm className="mb-4 grid gap-2 sm:grid-cols-2 lg:flex" clearHref="/enquiries" active={Object.values(filters).some(Boolean)}>
        <input type="search" name="q" defaultValue={filters.q} placeholder="Name, phone, email or package" aria-label="Search enquiries" className={`${inputStyles} lg:max-w-xs`} />
        <select name="status" defaultValue={filters.status ?? ""} aria-label="Status" className={`${inputStyles} lg:w-44`}>
          <option value="">Any status</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {humanize(status)}
            </option>
          ))}
        </select>
        <select name="branchId" defaultValue={filters.branchId ?? ""} aria-label="Branch" className={`${inputStyles} lg:w-40`}>
          <option value="">All branches</option>
          {branches.data.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonStyles.secondary}>
          Filter
        </button>
      </FilterForm>

      {rows.length === 0 ? (
        <EmptyState title="No enquiries match" />
      ) : (
        <Table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Package</th>
              <th scope="col">Branch</th>
              <th scope="col">Travellers</th>
              <th scope="col">Travel date</th>
              <th scope="col">Estimate</th>
              <th scope="col">Status</th>
              <th scope="col">Received</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((enquiry) => (
              <tr key={enquiry.id}>
                <td>
                  <Link href={`/enquiries/${enquiry.id}`} className="font-semibold text-navy hover:text-cobalt hover:underline">
                    {enquiry.name}
                  </Link>
                  <span className="block text-xs text-muted">{enquiry.phone ?? enquiry.whatsapp ?? enquiry.email}</span>
                </td>
                <td>{enquiry.package?.title ?? "General"}</td>
                <td>{enquiry.branch?.name ?? "—"}</td>
                <td className="whitespace-nowrap">
                  {enquiry.adults}A {enquiry.children}C {enquiry.infants}I
                </td>
                <td className="whitespace-nowrap">{formatDate(enquiry.travelDate)}</td>
                <td className="whitespace-nowrap">{enquiry.estimatedTotal !== null && enquiry.currencyCode ? formatAmount(enquiry.estimatedTotal, enquiry.currencyCode) : "—"}</td>
                <td>
                  <Badge tone={STATUS_TONE[enquiry.status]}>{humanize(enquiry.status)}</Badge>
                </td>
                <td className="whitespace-nowrap">{formatDateTime(enquiry.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} params={filters} />}
    </>
  );
}
