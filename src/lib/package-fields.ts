import type { FieldConfig } from "./resources";

/** The package editor's "Details" tab. Lists (itinerary, prices...) have their own editors. */
export const PACKAGE_FIELDS: FieldConfig[] = [
  { name: "branchId", label: "Branch", type: "select", source: "branches", required: true, help: "The office that sells this package. Dubai and Calicut catalogues never mix." },
  { name: "destinationId", label: "Destination", type: "select", source: "destinations", required: true },
  { name: "categoryId", label: "Category", type: "select", source: "categories", nullable: true },
  { name: "title", label: "Package title", type: "text", required: true },
  { name: "slug", label: "URL slug", type: "text", help: "The page address: /packages/<slug>. Leave empty to generate it. Changing it on a live package breaks old links." },
  { name: "shortDescription", label: "Pitch", type: "textarea", help: "One line for cards and the page header.", wide: true },
  { name: "description", label: "Overview", type: "textarea", help: "Separate paragraphs with a blank line.", wide: true },
  { name: "durationDays", label: "Days", type: "number", required: true, section: "Trip" },
  { name: "durationNights", label: "Nights", type: "number", required: true },
  { name: "bestTime", label: "Best time to go", type: "text", nullable: true, placeholder: "November to March" },
  { name: "arrivalAirportCode", label: "Arrival airport code", type: "text", nullable: true, uppercase: true, placeholder: "KUL" },
  { name: "arrivalCity", label: "Arrival city", type: "text", nullable: true },
  { name: "heroImageId", label: "Hero image", type: "image", nullable: true, help: "Required to publish. Used on cards, the page and the PDF cover." },
  { name: "keywords", label: "Search keywords", type: "lines", help: "One per line: words people might search for (honeymoon, skiing)." },
  { name: "importantInfo", label: "Trip-specific notes", type: "lines", help: "One per line. Shown after the site-wide important information.", wide: true },
  { name: "displayOrder", label: "Display order", type: "number", section: "Listing", help: "Lower numbers come first." },
  { name: "isFeatured", label: "Featured", type: "checkbox" },
  { name: "isRecommended", label: "Recommend on other package pages", type: "checkbox" },
];

/** Fields for creating a package; everything else is added in the editor. */
export const NEW_PACKAGE_FIELDS = PACKAGE_FIELDS.filter((field) =>
  ["branchId", "destinationId", "categoryId", "title", "slug", "shortDescription", "durationDays", "durationNights"].includes(field.name),
);
