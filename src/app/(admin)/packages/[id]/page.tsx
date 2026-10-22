import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, SITE_URL, api, can, currentUser } from "@/lib/api";
import { humanize } from "@/lib/format";
import { formData } from "@/lib/options";
import { PACKAGE_FIELDS } from "@/lib/package-fields";
import { seoFields } from "@/lib/resources";
import { ResourceForm } from "@/components/resource-form";
import { ItineraryEditor, type ItineraryDayInput } from "@/components/package-editor/itinerary-editor";
import { PricingEditor } from "@/components/package-editor/pricing-editor";
import { ActivitiesEditor, GalleryEditor, HotelsEditor } from "@/components/package-editor/collections";
import { ListEditor } from "@/components/package-editor/shared";
import { PublishPanel, type ItineraryPdf } from "@/components/package-editor/publish-panel";
import { Badge, ButtonLink, Card, PageHeader, STATUS_TONE } from "@/components/ui";
import { updatePackage } from "../actions";

const TABS = [
  ["details", "Details"],
  ["gallery", "Gallery"],
  ["highlights", "Highlights"],
  ["itinerary", "Itinerary"],
  ["hotels", "Hotels"],
  ["activities", "Activities"],
  ["pricing", "Pricing"],
  ["inclusions", "Inclusions & exclusions"],
  ["info", "Good to know & info"],
  ["seo", "SEO"],
  ["publish", "PDF & publish"],
] as const;

type Tab = (typeof TABS)[number][0];

interface EditorPackage extends Record<string, unknown> {
  id: string;
  title: string;
  slug: string;
  status: string;
  durationDays: number;
  branch: { name: string };
  /** The branch's currency: the only one the package is priced in (missing from APIs older than that). */
  currency?: string;
  destination: { name: string };
  gallery: { mediaId: string; image: { id: string; url: string; alt: string } | null }[];
  /** Exactly what the package page shows under "Good to know" and "Important information" (missing from older APIs). */
  goodToKnow?: { title: string; description: string | null }[];
  importantInfo?: string[];
  /** False while those are still the shared content (destination travel facts, Global content notes). */
  ownInfo?: boolean;
  highlights: { title: string; description: string | null }[];
  inclusions: { title: string; description: string | null }[];
  exclusions: { title: string; description: string | null }[];
  itinerary: ItineraryDayInput[];
  prices: { currencyCode: string; priceType: string; amount: number }[];
  hotels: { hotelId: string | null; nights: number | null; roomType: string | null; mealPlan: string | null; isDefault: boolean }[];
  activities: { activityId: string }[];
  itineraryPdf: ItineraryPdf | null;
  /** Missing from an API older than the second version. */
  itineraryPdfWithoutLogo?: ItineraryPdf | null;
}

export async function generateMetadata({ params }: PageProps<"/packages/[id]">) {
  try {
    return { title: (await api<EditorPackage>(`/admin/packages/${(await params).id}`)).data.title };
  } catch {
    return { title: "Package" };
  }
}

export default async function PackageEditorPage({ params, searchParams }: PageProps<"/packages/[id]">) {
  const { id } = await params;
  const requested = (await searchParams).tab;
  const tab: Tab = TABS.some(([key]) => key === requested) ? (requested as Tab) : "details";

  let pkg: EditorPackage;
  try {
    pkg = (await api<EditorPackage>(`/admin/packages/${id}`)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const user = await currentUser();
  const save = updatePackage.bind(null, id);

  const panel = await (async () => {
    switch (tab) {
      case "details": {
        const { options } = await formData(PACKAGE_FIELDS);
        return <ResourceForm fields={PACKAGE_FIELDS} row={pkg} options={options} submitLabel="Save details" save={save} />;
      }
      case "seo":
        return <ResourceForm fields={seoFields} row={pkg} options={{}} submitLabel="Save SEO" save={save} />;
      case "gallery":
        return <GalleryEditor packageId={id} initial={pkg.gallery} />;
      case "highlights":
        return <ListEditor packageId={id} section="highlights" initial={pkg.highlights} noun="Highlight" intro="The best bits, shown as a list under the overview and in the PDF." />;
      case "inclusions":
        return (
          <div className="grid gap-8 xl:grid-cols-2">
            <ListEditor packageId={id} section="inclusions" initial={pkg.inclusions} noun="Inclusion" intro="What the price includes." />
            <ListEditor packageId={id} section="exclusions" initial={pkg.exclusions} noun="Exclusion" intro="What it does not include." />
          </div>
        );
      case "info":
        return (
          <div>
            <p className="mb-5 max-w-3xl text-sm text-muted">
              {pkg.ownInfo
                ? "These two lists are exactly what the package page shows under “Good to know” and “Important information”, below “What's included”."
                : `This package still shows the shared content: the travel facts of ${pkg.destination.name} (Destinations) and the notes for every package (Global content › Package defaults). The lists below are that content. Edit and save to give this package its own lists; changes to the shared content then no longer affect it.`}
            </p>
            <div className="grid gap-8 xl:grid-cols-2">
              <section aria-labelledby="good-to-know-heading">
                <h3 id="good-to-know-heading" className="mb-1 font-semibold text-navy">
                  Good to know
                </h3>
                <ListEditor
                  packageId={id}
                  section="good-to-know"
                  initial={pkg.goodToKnow ?? []}
                  noun="Item"
                  saveLabel="Save good to know"
                  intro="Each item is a label and its detail, e.g. “Currency” with “UAE dirham (AED)”. An empty list hides the section."
                />
              </section>
              <section aria-labelledby="important-info-heading">
                <h3 id="important-info-heading" className="mb-1 font-semibold text-navy">
                  Important information
                </h3>
                <ListEditor
                  packageId={id}
                  section="important-info"
                  initial={(pkg.importantInfo ?? []).map((title) => ({ title, description: null }))}
                  noun="Note"
                  detail={false}
                  saveLabel="Save important information"
                  intro="One note per line (up to 40). An empty list hides the notes; the terms and conditions from Global content still follow them."
                />
              </section>
            </div>
          </div>
        );
      case "itinerary": {
        const [hotels, activities] = await Promise.all([
          api<{ id: string; name: string; location: string }[]>("/admin/hotels?pageSize=100"),
          api<{ id: string; name: string }[]>("/admin/activities?pageSize=100"),
        ]);
        return (
          <ItineraryEditor
            packageId={id}
            initial={pkg.itinerary}
            durationDays={pkg.durationDays}
            hotels={hotels.data.map((h) => ({ value: h.id, label: `${h.name}, ${h.location}` }))}
            activities={activities.data.map((a) => ({ value: a.id, label: a.name }))}
          />
        );
      }
      case "hotels": {
        const hotels = await api<{ id: string; name: string; location: string; starCategory: number | null }[]>("/admin/hotels?pageSize=100");
        return (
          <HotelsEditor
            packageId={id}
            initial={pkg.hotels}
            hotels={hotels.data.map((h) => ({ value: h.id, label: `${h.name}${h.starCategory ? ` (${h.starCategory}★)` : ""}, ${h.location}` }))}
          />
        );
      }
      case "activities": {
        const activities = await api<{ id: string; name: string }[]>("/admin/activities?pageSize=100");
        return <ActivitiesEditor packageId={id} initial={pkg.activities} activities={activities.data.map((a) => ({ value: a.id, label: a.name }))} />;
      }
      case "pricing": {
        const currencies = await api<{ code: string; name: string; isActive: boolean }[]>("/admin/currencies");
        // Only the branch's currency; prices kept in another one stay stored, untouched by saving.
        const active = currencies.data.filter((c) => c.isActive && (!pkg.currency || c.code === pkg.currency));
        return <PricingEditor packageId={id} initial={pkg.prices} currencies={active} branchName={pkg.branch.name} currency={pkg.currency} />;
      }
      case "publish": {
        const check = await api<{ checklist: { key: string; label: string; ok: boolean; message?: string }[] }>(`/admin/packages/${id}/publish-check`);
        return (
          <PublishPanel
            packageId={id}
            status={pkg.status}
            checklist={check.data.checklist}
            itineraryPdf={pkg.itineraryPdf}
            itineraryPdfWithoutLogo={pkg.itineraryPdfWithoutLogo ?? null}
            canPublish={can(user, "ADMIN")}
            canRemovePdf={can(user, "ADMIN")}
          />
        );
      }
    }
  })();

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/packages" className="text-cobalt hover:underline">
          Packages
        </Link>
      </p>
      <PageHeader
        title={pkg.title}
        description={
          <>
            <Badge tone={STATUS_TONE[pkg.status]}>{humanize(pkg.status)}</Badge> {pkg.destination.name} · {pkg.branch.name} branch
          </>
        }
        actions={
          <>
            {pkg.status === "PUBLISHED" && (
              <ButtonLink variant="secondary" href={`${SITE_URL}/packages/${pkg.slug}`} target="_blank" rel="noreferrer">
                View on site
              </ButtonLink>
            )}
            <ButtonLink variant={tab === "publish" ? "primary" : "secondary"} href={`/packages/${id}?tab=publish`}>
              PDF & publish
            </ButtonLink>
          </>
        }
      />
      <nav aria-label="Package sections" className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-1 border-b border-line">
          {TABS.map(([key, label]) => (
            <li key={key}>
              <Link
                href={`/packages/${id}?tab=${key}`}
                aria-current={tab === key ? "page" : undefined}
                className="-mb-px block border-b-2 border-transparent px-3 py-2 text-sm font-semibold text-muted hover:text-navy aria-[current=page]:border-navy aria-[current=page]:text-navy"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Keyed by tab, so switching tabs never carries one tab's unsaved state into another. */}
      <Card key={tab}>{panel}</Card>
    </>
  );
}
