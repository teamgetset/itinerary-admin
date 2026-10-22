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
  const { data: packages, meta } = await api<{ id: string; title: string; branch: { name: string }; currency: string; prices: PriceTable }[]>(
    `/admin/packages?pageSize=25&page=${page}`,
  );

  return (
    <>
      <PageHeader
        title="Package pricing"
        description="Official per-person prices for every package, in its branch's currency (Dubai AED, Calicut INR). Edit a package's prices in its Pricing tab; the publish checklist flags missing ones."
      />
      <Table>
        <thead>
          <tr>
            <th scope="col">Package</th>
            <th scope="col">Branch</th>
            <th scope="col">Currency</th>
            {TYPES.map(([type, label]) => (
              <th key={type} scope="col">
                {label}
              </th>
            ))}
            <th scope="col" />
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.id}>
              <td className="font-semibold">{pkg.title}</td>
              <td>{pkg.branch.name}</td>
              <td>{pkg.currency}</td>
              {TYPES.map(([type]) => (
                <td key={type} className="whitespace-nowrap">
                  {pkg.prices[type][pkg.currency] !== undefined ? formatAmount(pkg.prices[type][pkg.currency]!, pkg.currency) : <Badge tone="warning">Missing</Badge>}
                </td>
              ))}
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
