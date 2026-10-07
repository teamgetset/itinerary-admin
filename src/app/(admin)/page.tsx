import Link from "next/link";
import { api } from "@/lib/api";
import { formatDateTime, humanize, plural } from "@/lib/format";
import { Badge, ButtonLink, Card, PageHeader, STATUS_TONE } from "@/components/ui";

interface Dashboard {
  counts: Record<"totalPackages" | "publishedPackages" | "draftPackages" | "branches" | "destinations" | "testimonials" | "newEnquiries", number>;
  recentEnquiries: { id: string; name: string; status: string; createdAt: string; packageTitle: string | null; adults: number; children: number; infants: number }[];
  recentPackages: { id: string; title: string; status: string; updatedAt: string }[];
  activity: { action: string; entity: string; entityId: string | null; createdAt: string; admin: string | null }[];
}

export default async function DashboardPage() {
  const { data } = await api<Dashboard>("/admin/dashboard");
  const cards = [
    { label: "Total packages", value: data.counts.totalPackages, href: "/packages" },
    { label: "Published", value: data.counts.publishedPackages, href: "/packages?status=PUBLISHED" },
    { label: "Drafts", value: data.counts.draftPackages, href: "/packages?status=DRAFT" },
    { label: "Branches", value: data.counts.branches, href: "/branches" },
    { label: "Destinations", value: data.counts.destinations, href: "/destinations" },
    { label: "Published testimonials", value: data.counts.testimonials, href: "/testimonials" },
    { label: "New enquiries", value: data.counts.newEnquiries, href: "/enquiries?status=NEW", highlight: data.counts.newEnquiries > 0 },
  ];

  return (
    <>
      <PageHeader title="Dashboard" actions={<ButtonLink href="/packages/new">New package</ButtonLink>} />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {cards.map((card) => (
          <li key={card.label}>
            <Link
              href={card.href}
              className={`block rounded-card border p-4 transition-colors hover:border-cobalt ${card.highlight ? "border-sun bg-sun/20" : "border-line bg-white"}`}
            >
              <span className="block text-3xl font-bold text-navy">{card.value}</span>
              <span className="mt-1 block text-sm text-muted">{card.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Recent enquiries" actions={<Link href="/enquiries" className="text-sm font-semibold text-cobalt">All enquiries</Link>}>
          {data.recentEnquiries.length ? (
            <ul className="divide-y divide-line">
              {data.recentEnquiries.map((enquiry) => (
                <li key={enquiry.id} className="py-2.5 first:pt-0 last:pb-0">
                  <Link href={`/enquiries/${enquiry.id}`} className="flex items-start justify-between gap-3 hover:text-cobalt">
                    <span>
                      <span className="block font-semibold">{enquiry.name}</span>
                      <span className="block text-sm text-muted">
                        {enquiry.packageTitle ?? "General enquiry"} · {plural(enquiry.adults + enquiry.children + enquiry.infants, "traveller")}
                      </span>
                    </span>
                    <Badge tone={STATUS_TONE[enquiry.status]}>{humanize(enquiry.status)}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No enquiries yet.</p>
          )}
        </Card>

        <Card title="Recently edited packages">
          <ul className="divide-y divide-line">
            {data.recentPackages.map((pkg) => (
              <li key={pkg.id} className="py-2.5 first:pt-0 last:pb-0">
                <Link href={`/packages/${pkg.id}`} className="flex items-start justify-between gap-3 hover:text-cobalt">
                  <span>
                    <span className="block font-semibold">{pkg.title}</span>
                    <span className="block text-sm text-muted">{formatDateTime(pkg.updatedAt)}</span>
                  </span>
                  <Badge tone={STATUS_TONE[pkg.status]}>{humanize(pkg.status)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Latest activity">
          <ul className="space-y-2.5 text-sm">
            {data.activity.map((entry, index) => (
              <li key={index}>
                <span className="font-semibold">{entry.admin ?? "System"}</span> <span className="text-muted">{humanize(entry.action)}</span>
                <span className="block text-xs text-muted">{formatDateTime(entry.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
