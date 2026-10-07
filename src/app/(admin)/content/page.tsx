import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { ContentBlockForm, type ContentField } from "@/components/content-block-form";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Global content" };

const BLOCKS: { key: string; title: string; description: string; fields: ContentField[] }[] = [
  {
    key: "home.hero",
    title: "Homepage hero",
    description: "The headline and buttons over the hero photos. The photos themselves are Hero slides.",
    fields: [
      { key: "eyebrow", label: "Small heading", type: "text" },
      { key: "heading", label: "Headline", type: "text", help: "Keep it short: it is shown on one line on large screens." },
      { key: "description", label: "Description", type: "textarea" },
      { key: "primaryCta", label: "Main button", type: "link" },
      { key: "secondaryCta", label: "Second button", type: "optional-link" },
    ],
  },
  { key: "home.branches", title: "Branch section", description: "Above the branch cards on the homepage.", fields: [{ key: "heading", label: "Heading", type: "text" }, { key: "description", label: "Description", type: "textarea" }] },
  { key: "home.packages", title: "All packages section", description: "Above the package grid on the homepage.", fields: [{ key: "heading", label: "Heading", type: "text" }, { key: "description", label: "Description", type: "textarea" }] },
  {
    key: "testimonials",
    title: "Testimonials section",
    description: "Shown above the footer on every page. The reviews themselves are under Testimonials.",
    fields: [
      { key: "enabled", label: "Show the testimonials section", type: "checkbox" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    key: "navigation",
    title: "Navigation",
    description: "Links in the header (and mobile menu) and in the footer's Explore column. Branch pages are reached through the branch cards.",
    fields: [
      { key: "header", label: "Header links", type: "links" },
      { key: "footer", label: "Footer links", type: "links" },
    ],
  },
  {
    key: "contact",
    title: "Contact information",
    description: "Site-wide contact details. Branch phone numbers and addresses are edited on each branch.",
    fields: [
      { key: "email", label: "Email", type: "text" },
      { key: "whatsapp", label: "WhatsApp number", type: "text", help: "Digits with country code, no + or spaces: 971585689114." },
    ],
  },
  { key: "social", title: "Social links", description: "Icons in the footer.", fields: [{ key: "", label: "Links", type: "social" }] },
  { key: "footer", title: "Footer", description: "", fields: [{ key: "tagline", label: "Tagline", type: "textarea" }, { key: "legalName", label: "Legal name (copyright line)", type: "text" }] },
  {
    key: "package.defaults",
    title: "Package defaults",
    description: "Shown on every package page and itinerary PDF. Changing these rebuilds every PDF on its next download.",
    fields: [
      { key: "importantInfo", label: "Important information", type: "lines" },
      { key: "terms", label: "Terms and conditions", type: "lines", help: "One clause per line. Leave empty to hide the section." },
    ],
  },
  {
    key: "enquiry",
    title: "WhatsApp enquiry message",
    description: "The first line of the WhatsApp message a visitor sends from a package page. The website adds the travellers and the estimate.",
    fields: [{ key: "whatsappTemplate", label: "Message", type: "textarea", help: "{branch} and {package} are replaced with the branch and package names." }],
  },
];

export default async function ContentPage() {
  const { data: content } = await api<Record<string, unknown>>("/admin/content");
  return (
    <>
      <PageHeader title="Global content" description="Words and links used across the website. Saved changes show on the site within a minute." />
      <nav aria-label="Content blocks" className="mb-6 flex flex-wrap gap-2 text-sm">
        {BLOCKS.map((block) => (
          <Link key={block.key} href={`#${block.key.replace(".", "-")}`} className="rounded-full border border-line bg-white px-3 py-1 hover:border-cobalt">
            {block.title}
          </Link>
        ))}
      </nav>
      <div className="space-y-6">
        {BLOCKS.map((block) => (
          <section key={block.key} id={block.key.replace(".", "-")} className="scroll-mt-6">
            <Card title={block.title}>
              {block.description && <p className="mb-4 text-sm text-muted">{block.description}</p>}
              <ContentBlockForm blockKey={block.key} fields={block.fields} initial={content[block.key]} />
            </Card>
          </section>
        ))}
      </div>
    </>
  );
}
