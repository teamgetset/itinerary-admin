import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { Badge, Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "SEO" };

interface Seo {
  title: string | null;
  description: string | null;
  noindex: boolean;
}

function SeoStatus({ seo }: { seo: Seo }) {
  if (seo.noindex) return <Badge tone="warning">Hidden from search</Badge>;
  if (seo.title && seo.description) return <Badge tone="success">Custom</Badge>;
  return <Badge>Automatic</Badge>;
}

function Rows({ items }: { items: { name: string; href: string; seo: Seo }[] }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.href} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
          <Link href={item.href} className="font-semibold text-navy hover:text-cobalt hover:underline">
            {item.name}
          </Link>
          <span className="flex items-center gap-2 text-muted">
            {item.seo.description && <span className="hidden text-xs sm:inline">{item.seo.description.length} chars</span>}
            <SeoStatus seo={item.seo} />
          </span>
        </li>
      ))}
    </ul>
  );
}

type Row = { id: string; name: string; seoTitle: string | null; seoDescription: string | null; noindex: boolean };
const toSeo = (row: Row): Seo => ({ title: row.seoTitle, description: row.seoDescription, noindex: row.noindex });

export default async function SeoPage() {
  const [packages, branches, destinations] = await Promise.all([
    api<{ id: string; title: string; seo: Seo }[]>("/admin/packages?pageSize=100"),
    api<Row[]>("/admin/branches?pageSize=100"),
    api<Row[]>("/admin/destinations?pageSize=100"),
  ]);
  return (
    <>
      <PageHeader
        title="SEO"
        description="Search titles, descriptions and share images. “Automatic” pages use their name, pitch and main photo, which is a sensible default; add custom text where it helps. Drafts are never shown to search engines."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Packages">
          <Rows items={packages.data.map((pkg) => ({ name: pkg.title, href: `/packages/${pkg.id}?tab=seo`, seo: pkg.seo }))} />
        </Card>
        <Card title="Destinations">
          <Rows items={destinations.data.map((row) => ({ name: row.name, href: `/destinations/${row.id}`, seo: toSeo(row) }))} />
        </Card>
        <Card title="Branches">
          <Rows items={branches.data.map((row) => ({ name: row.name, href: `/branches/${row.id}`, seo: toSeo(row) }))} />
        </Card>
      </div>
    </>
  );
}
