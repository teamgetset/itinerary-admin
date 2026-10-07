import Link from "next/link";
import { notFound } from "next/navigation";
import { api, can, currentUser } from "@/lib/api";
import { formatAmount, formatDate, humanize } from "@/lib/format";
import { RESOURCES, type ColumnConfig } from "@/lib/resources";
import { ReorderButtons } from "@/components/row-actions";
import { Badge, ButtonLink, EmptyState, PageHeader, Pagination, Table, Thumb, inputStyles, buttonStyles } from "@/components/ui";

type Row = Record<string, unknown> & { id: string };

function Cell({ row, column }: { row: Row; column: ColumnConfig }) {
  const value = row[column.key];
  switch (column.kind) {
    case "image":
      return <Thumb src={(value as { url?: string } | null)?.url} />;
    case "active":
      return value ? <Badge tone="success">Active</Badge> : <Badge>Switched off</Badge>;
    case "published":
      return value ? <Badge tone="success">Published</Badge> : <Badge tone="warning">Unpublished</Badge>;
    case "date":
      return <>{formatDate(value as string | null)}</>;
    case "stars":
      return <>{value ? `${"★".repeat(Number(value))}` : "—"}</>;
    case "role":
      return <Badge tone={value === "SUPER_ADMIN" ? "info" : "neutral"}>{humanize(String(value))}</Badge>;
    case "prices": {
      const prices = Object.entries((value as Record<string, number>) ?? {});
      return <>{prices.length ? prices.map(([code, amount]) => formatAmount(amount, code)).join(" · ") : "—"}</>;
    }
    default:
      return <>{value === null || value === undefined || value === "" ? "—" : String(value)}</>;
  }
}

export async function generateMetadata({ params }: PageProps<"/[resource]">) {
  return { title: RESOURCES[(await params).resource]?.title };
}

export default async function ResourceListPage({ params, searchParams }: PageProps<"/[resource]">) {
  const config = RESOURCES[(await params).resource];
  if (!config) notFound();
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  const page = Number(query.page) || 1;
  const filters = Object.fromEntries((config.filters ?? []).flatMap((f) => (typeof query[f.name] === "string" && query[f.name] ? [[f.name, query[f.name] as string]] : [])));
  const reordering = config.orderable && !q && !Object.keys(filters).length;

  const search = new URLSearchParams({ page: String(page), pageSize: reordering ? "100" : "25", ...(q && { q }), ...filters });
  const [user, { data: rows, meta }] = await Promise.all([currentUser(), api<Row[]>(`/admin/${config.apiPath}?${search}`)]);
  const ids = rows.map((row) => row.id);
  const nameKey = config.columns.find((c) => !c.kind)?.key ?? "id";

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={can(user, config.write) && <ButtonLink href={`/${config.key}/new`}>New {config.singular}</ButtonLink>}
      />

      <form className="mb-4 flex flex-col gap-2 sm:flex-row" role="search">
        <input type="search" name="q" defaultValue={q} placeholder={`Search ${config.title.toLowerCase()}`} aria-label="Search" className={`${inputStyles} sm:max-w-xs`} />
        {(config.filters ?? []).map((filter) => (
          <select key={filter.name} name={filter.name} defaultValue={filters[filter.name] ?? ""} aria-label={filter.label} className={`${inputStyles} sm:w-44`}>
            <option value="">{filter.label}: all</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
        <button type="submit" className={buttonStyles.secondary}>
          Filter
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title={`No ${config.title.toLowerCase()} found`}>{q ? "Try another search." : null}</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              {config.columns.map((column) => (
                <th key={column.key} scope="col">
                  {column.label}
                </th>
              ))}
              {reordering && can(user, config.write) && <th scope="col">Order</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                {config.columns.map((column) => (
                  <td key={column.key} className={column.kind === "image" ? "w-16" : undefined}>
                    {column.key === nameKey ? (
                      <Link href={`/${config.key}/${row.id}`} className="font-semibold text-navy hover:text-cobalt hover:underline">
                        <Cell row={row} column={column} />
                      </Link>
                    ) : (
                      <Cell row={row} column={column} />
                    )}
                  </td>
                ))}
                {reordering && can(user, config.write) && (
                  <td className="w-24">
                    <ReorderButtons resource={config.key} ids={ids} index={index} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} params={{ q, ...filters }} />}
    </>
  );
}
