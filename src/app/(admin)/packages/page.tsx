import Link from "next/link";
import type { Metadata } from "next";
import { api, can, currentUser } from "@/lib/api";
import { formatAmount, formatDate, humanize } from "@/lib/format";
import { PackageActions } from "@/components/package-actions";
import { Badge, ButtonLink, EmptyState, PageHeader, Pagination, STATUS_TONE, Table, Thumb, buttonStyles, inputStyles } from "@/components/ui";

export const metadata: Metadata = { title: "Packages" };

interface PackageRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  branch: { id: string; name: string };
  destination: { id: string; name: string };
  durationDays: number;
  durationNights: number;
  startingPrice: Record<string, number>;
  heroImage: { url: string } | null;
  updatedAt: string;
}

const param = (value: string | string[] | undefined) => (typeof value === "string" && value ? value : undefined);

export default async function PackagesPage({ searchParams }: PageProps<"/packages">) {
  const query = await searchParams;
  const filters = { q: param(query.q), status: param(query.status), branchId: param(query.branchId), destinationId: param(query.destinationId) };
  const page = Number(query.page) || 1;
  const search = new URLSearchParams({ page: String(page), pageSize: "20", ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) as Record<string, string> });

  const [user, { data: rows, meta }, branches, destinations] = await Promise.all([
    currentUser(),
    api<PackageRow[]>(`/admin/packages?${search}`),
    api<{ id: string; name: string }[]>("/admin/branches?pageSize=100"),
    api<{ id: string; name: string }[]>("/admin/destinations?pageSize=100"),
  ]);

  return (
    <>
      <PageHeader
        title="Packages"
        description="Every trip on the website. Drafts stay private until published; editors can edit, admins publish."
        actions={<ButtonLink href="/packages/new">New package</ButtonLink>}
      />

      <form role="search" className="mb-4 grid gap-2 sm:grid-cols-2 lg:flex">
        <input type="search" name="q" defaultValue={filters.q} placeholder="Title, slug, destination or branch" aria-label="Search packages" className={`${inputStyles} lg:max-w-xs`} />
        <select name="status" defaultValue={filters.status ?? ""} aria-label="Status" className={`${inputStyles} lg:w-40`}>
          <option value="">Any status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select name="branchId" defaultValue={filters.branchId ?? ""} aria-label="Branch" className={`${inputStyles} lg:w-40`}>
          <option value="">All branches</option>
          {branches.data.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <select name="destinationId" defaultValue={filters.destinationId ?? ""} aria-label="Destination" className={`${inputStyles} lg:w-44`}>
          <option value="">All destinations</option>
          {destinations.data.map((destination) => (
            <option key={destination.id} value={destination.id}>
              {destination.name}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonStyles.secondary}>
          Filter
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No packages match">Clear the filters or create a new package.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <th scope="col" className="w-16" />
              <th scope="col">Package</th>
              <th scope="col">Destination</th>
              <th scope="col">Branch</th>
              <th scope="col">Duration</th>
              <th scope="col">Starting price</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((pkg) => (
              <tr key={pkg.id}>
                <td>
                  <Thumb src={pkg.heroImage?.url} />
                </td>
                <td>
                  <Link href={`/packages/${pkg.id}`} className="font-semibold text-navy hover:text-cobalt hover:underline">
                    {pkg.title}
                  </Link>
                  <span className="block text-xs text-muted">/{pkg.slug}</span>
                </td>
                <td>{pkg.destination.name}</td>
                <td>{pkg.branch.name}</td>
                <td className="whitespace-nowrap">
                  {pkg.durationNights}N / {pkg.durationDays}D
                </td>
                <td className="whitespace-nowrap">
                  {Object.entries(pkg.startingPrice).length
                    ? Object.entries(pkg.startingPrice).map(([code, amount]) => <span key={code} className="block">{formatAmount(amount, code)}</span>)
                    : <Badge tone="warning">No prices</Badge>}
                </td>
                <td>
                  <Badge tone={STATUS_TONE[pkg.status]}>{humanize(pkg.status)}</Badge>
                </td>
                <td className="whitespace-nowrap">{formatDate(pkg.updatedAt)}</td>
                <td>
                  <PackageActions id={pkg.id} status={pkg.status} canPublish={can(user, "ADMIN")} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} params={filters} />}
    </>
  );
}
