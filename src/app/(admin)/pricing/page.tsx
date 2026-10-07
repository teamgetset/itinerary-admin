import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { formatAmount } from "@/lib/format";
import { Badge, PageHeader, Pagination, Table } from "@/components/ui";

export const metadata: Metadata = { title: "Pricing" };

type PriceTable = Record<"ADULT" | "CHILD" | "INFANT", Record<string, number>>;
const TYPES = [
  ["ADULT", "Adult"],
  ["CHILD", "Child"],
  ["INFANT", "Infant"],
] as const;

export default async function PricingPage({ searchParams }: PageProps<"/pricing">) {
  const page = Number((await searchParams).page) || 1;
  const [{ data: packages, meta }, { data: currencies }] = await Promise.all([
    api<{ id: string; title: string; branch: { name: string }; prices: PriceTable }[]>(`/admin/packages?pageSize=25&page=${page}`),
    api<{ code: string; isActive: boolean }[]>("/admin/currencies"),
  ]);
  const codes = currencies.filter((c) => c.isActive).map((c) => c.code);

  return (
    <>
      <PageHeader
        title="Package pricing"
        description="Official per-person prices for every package, in every currency. Edit a package's prices in its Pricing tab. Missing prices block publishing."
      />
      <Table>
        <thead>
          <tr>
            <th scope="col">Package</th>
            <th scope="col">Branch</th>
            {TYPES.flatMap(([, label]) => codes.map((code) => <th key={`${label}-${code}`} scope="col">{`${label} ${code}`}</th>))}
            <th scope="col" />
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.id}>
              <td className="font-semibold">{pkg.title}</td>
              <td>{pkg.branch.name}</td>
              {TYPES.flatMap(([type]) =>
                codes.map((code) => (
                  <td key={`${type}-${code}`} className="whitespace-nowrap">
                    {pkg.prices[type][code] !== undefined ? formatAmount(pkg.prices[type][code], code) : <Badge tone="danger">Missing</Badge>}
                  </td>
                )),
              )}
              <td>
                <Link href={`/packages/${pkg.id}?tab=pricing`} className="font-semibold whitespace-nowrap text-cobalt hover:underline">
                  Edit prices
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
