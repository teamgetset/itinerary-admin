import type { AdminUser } from "./api";

/*
 * Simple content types, described as data: the list columns and the form fields.
 * One list page and one form render all of them (src/app/(admin)/[resource]).
 * Packages, media, enquiries and site content have their own pages.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "url"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "image"
  | "lines"
  | "facts"
  | "prices"
  | "password";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Sends null when left empty (clears the value). */
  nullable?: boolean;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Options loaded from the API. */
  source?: "branches" | "destinations" | "packages" | "categories" | "hotels" | "activities";
  uppercase?: boolean;
  createOnly?: boolean;
  /** Section heading shown above this field. */
  section?: string;
  step?: string;
  wide?: boolean;
}

export interface ColumnConfig {
  key: string;
  label: string;
  kind?: "image" | "active" | "published" | "date" | "stars" | "prices" | "role";
}

export interface ResourceConfig {
  key: string;
  apiPath: string;
  title: string;
  singular: string;
  description: string;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  seo?: boolean;
  orderable?: boolean;
  /** Role needed to create and edit, and to delete. */
  write: AdminUser["role"];
  remove: AdminUser["role"] | null;
  removeLabel?: string;
  filters?: { name: string; label: string; options: { value: string; label: string }[] }[];
  /** Customer-site path of an item, for "View on site". */
  sitePath?: "branches" | "destinations";
}

const SEO_FIELDS: FieldConfig[] = [
  { name: "seoTitle", label: "SEO title", type: "text", nullable: true, section: "Search engines and sharing", help: "Up to 70 characters. Defaults to the name." },
  { name: "seoDescription", label: "Meta description", type: "textarea", nullable: true, help: "Up to 170 characters." },
  { name: "canonicalUrl", label: "Canonical URL", type: "url", nullable: true, help: "Only if this page has a different main address." },
  { name: "ogTitle", label: "Share title (OG)", type: "text", nullable: true },
  { name: "ogDescription", label: "Share description (OG)", type: "textarea", nullable: true },
  { name: "ogImageId", label: "Share image (OG)", type: "image", nullable: true, help: "Defaults to the main image." },
  { name: "noindex", label: "Hide from search engines (noindex)", type: "checkbox" },
];

export const seoFields = SEO_FIELDS;

const active: FieldConfig = { name: "isActive", label: "Active (shown on the website)", type: "checkbox" };
const order: FieldConfig = { name: "displayOrder", label: "Display order", type: "number", help: "Lower numbers come first." };

export const RESOURCES: Record<string, ResourceConfig> = {
  branches: {
    key: "branches",
    apiPath: "branches",
    title: "Branches",
    singular: "branch",
    description: "Offices that sell packages. Each branch has its own catalogue, banner and contact details.",
    columns: [
      { key: "bannerImage", label: "", kind: "image" },
      { key: "name", label: "Branch" },
      { key: "city", label: "City" },
      { key: "phone", label: "Phone" },
      { key: "isActive", label: "Status", kind: "active" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", help: "Used in /branches/<slug>. Leave empty to generate it from the name." },
      { name: "shortDescription", label: "Catalogue summary", type: "textarea", help: "Shown on the branch card and banner.", wide: true },
      { name: "description", label: "About the office", type: "textarea", help: "Shown with the contact details.", wide: true },
      { name: "bannerImageId", label: "Banner image", type: "image", nullable: true, section: "Images" },
      { name: "thumbnailImageId", label: "Office photo", type: "image", nullable: true },
      { name: "addressLines", label: "Address", type: "lines", help: "One line per row.", section: "Contact" },
      { name: "city", label: "City", type: "text", required: true },
      { name: "countryCode", label: "Country code", type: "text", required: true, uppercase: true, placeholder: "AE" },
      { name: "countryName", label: "Country", type: "text", required: true },
      { name: "airportCode", label: "Departure airport code", type: "text", nullable: true, uppercase: true, placeholder: "DXB" },
      { name: "airportCity", label: "Airport city", type: "text", nullable: true },
      { name: "phone", label: "Phone", type: "text", required: true },
      { name: "whatsapp", label: "WhatsApp number", type: "text", nullable: true, help: "Digits only, with the country code: 971585689114." },
      { name: "email", label: "Email", type: "email", nullable: true },
      { name: "mapUrl", label: "Map link", type: "url", nullable: true },
      { name: "latitude", label: "Latitude", type: "number", nullable: true, step: "any" },
      { name: "longitude", label: "Longitude", type: "number", nullable: true, step: "any" },
      { ...order, section: "Visibility" },
      active,
    ],
    seo: true,
    orderable: true,
    write: "ADMIN",
    remove: "ADMIN",
    sitePath: "branches",
  },

  destinations: {
    key: "destinations",
    apiPath: "destinations",
    title: "Destinations",
    singular: "destination",
    description: "Places packages go to. Any branch can sell packages to any destination.",
    columns: [
      { key: "heroImage", label: "", kind: "image" },
      { key: "name", label: "Destination" },
      { key: "countryName", label: "Country" },
      { key: "region", label: "Region" },
      { key: "isActive", label: "Status", kind: "active" },
    ],
    // Only what the website uses. Thumbnail and display order are no longer asked for: nothing shows the thumbnail,
    // and the order is set with the arrows in the list. Stored values are kept.
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Georgia", help: "Shown on the destination page, on its packages and in search." },
      {
        name: "kind",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "PLACE", label: "A place within a country, e.g. Dubai, Bali, Kerala" },
          { value: "COUNTRY", label: "A whole country, e.g. Georgia, Maldives" },
        ],
        help: "Packages show a place with its country (“Bali, Indonesia”), a whole country on its own (“Georgia”).",
      },
      { name: "countryName", label: "Country", type: "text", required: true, placeholder: "Indonesia" },
      {
        name: "countryCode",
        label: "Country code",
        type: "text",
        required: true,
        uppercase: true,
        placeholder: "ID",
        help: "Two letters. A package without an arrival airport shows it as its destination code.",
      },
      { name: "region", label: "Region (optional)", type: "text", nullable: true, placeholder: "Caucasus", help: "Site search also finds this destination and its packages by it." },
      { name: "heroImageId", label: "Banner photo", type: "image", nullable: true, section: "Destination page", help: "The large photo at the top of the page; also used when the page is shared." },
      { name: "shortDescription", label: "Summary", type: "textarea", help: "One or two sentences on the banner, under the name. Search engines show it too.", wide: true },
      { name: "description", label: "About the destination (optional)", type: "textarea", help: "A longer introduction under the travel facts. Leave a blank line between paragraphs.", wide: true },
      { name: "facts", label: "Travel facts", type: "facts", help: "Flight time, currency, visa: shown on this destination's page, and under “Good to know” on its packages until a package saves its own list.", wide: true },
      { ...active, label: "Show on the website", section: "Visibility" },
      { name: "slug", label: "Page address", type: "text", help: "The end of /destinations/…. Leave empty to make it from the name; changing it breaks old links." },
    ],
    seo: true,
    orderable: true,
    write: "EDITOR",
    remove: "ADMIN",
    sitePath: "destinations",
  },

  categories: {
    key: "categories",
    apiPath: "categories",
    title: "Package categories",
    singular: "category",
    description: "Trip types shown on package cards, such as Family or Honeymoon.",
    columns: [
      { key: "name", label: "Category" },
      { key: "slug", label: "Slug" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text" },
      order,
    ],
    orderable: true,
    write: "EDITOR",
    remove: "ADMIN",
  },

  hotels: {
    key: "hotels",
    apiPath: "hotels",
    title: "Hotels",
    singular: "hotel",
    description: "Reusable hotels: add them to packages as stay options, or to itinerary days.",
    columns: [
      { key: "primaryImage", label: "", kind: "image" },
      { key: "name", label: "Hotel" },
      { key: "location", label: "Location" },
      { key: "starCategory", label: "Stars", kind: "stars" },
      { key: "isActive", label: "Status", kind: "active" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text" },
      { name: "location", label: "Location", type: "text", required: true, placeholder: "Bukit Bintang, Kuala Lumpur" },
      { name: "address", label: "Address", type: "text", nullable: true },
      { name: "starCategory", label: "Star category", type: "number", nullable: true, help: "1 to 5." },
      { name: "rating", label: "Guest rating", type: "number", nullable: true, step: "0.1", help: "0 to 5." },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "primaryImageId", label: "Photo", type: "image", nullable: true },
      active,
    ],
    write: "EDITOR",
    remove: "ADMIN",
  },

  activities: {
    key: "activities",
    apiPath: "activities",
    title: "Activities",
    singular: "activity",
    description: "Reusable experiences. Link them to packages and itinerary days; with a destination and prices they are offered as add-ons on that destination's page.",
    columns: [
      { key: "image", label: "", kind: "image" },
      { key: "name", label: "Activity" },
      { key: "location", label: "Location" },
      { key: "prices", label: "Price per person", kind: "prices" },
      { key: "isActive", label: "Status", kind: "active" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text" },
      { name: "location", label: "Location", type: "text", nullable: true },
      { name: "destinationId", label: "Destination (for add-on listing)", type: "select", source: "destinations", nullable: true },
      { name: "description", label: "Description", type: "textarea", wide: true },
      { name: "imageId", label: "Photo", type: "image", nullable: true },
      { name: "prices", label: "Price per person when booked on its own", type: "prices", wide: true },
      order,
      active,
    ],
    orderable: true,
    write: "EDITOR",
    remove: "ADMIN",
  },

  testimonials: {
    key: "testimonials",
    apiPath: "testimonials",
    title: "Testimonials",
    singular: "testimonial",
    description: "Reviews in the site-wide carousel. Publish only real reviews, keep the source, and add a photo only with the customer's permission.",
    columns: [
      { key: "customerName", label: "Customer" },
      { key: "place", label: "Place" },
      { key: "rating", label: "Rating", kind: "stars" },
      { key: "reviewedAt", label: "Reviewed", kind: "date" },
      { key: "isPublished", label: "Status", kind: "published" },
    ],
    fields: [
      { name: "customerName", label: "Customer name", type: "text", required: true },
      { name: "profile", label: "Profile", type: "text", placeholder: "Malaysia holiday" },
      { name: "rating", label: "Rating (1 to 5)", type: "number", required: true },
      { name: "place", label: "Place", type: "text", placeholder: "Calicut, India" },
      { name: "review", label: "Review", type: "textarea", required: true, wide: true },
      { name: "imageId", label: "Customer photo (with permission only)", type: "image", nullable: true },
      { name: "sourceName", label: "Source", type: "text", nullable: true, placeholder: "Google", section: "Source" },
      { name: "sourceUrl", label: "Source link", type: "url", nullable: true },
      { name: "reviewedAt", label: "Review date", type: "date", nullable: true },
      { name: "packageId", label: "Also show on package", type: "select", source: "packages", nullable: true },
      { ...order, section: "Visibility" },
      { name: "isPublished", label: "Published", type: "checkbox" },
    ],
    orderable: true,
    write: "EDITOR",
    remove: "ADMIN",
    removeLabel: "Delete",
    filters: [
      { name: "published", label: "Status", options: [{ value: "true", label: "Published" }, { value: "false", label: "Unpublished" }] },
      { name: "rating", label: "Rating", options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} stars` })) },
    ],
  },

  "hero-slides": {
    key: "hero-slides",
    apiPath: "hero-slides",
    title: "Hero slides",
    singular: "hero slide",
    description: "Photos in the homepage carousel. The headline and buttons over them are in Global content.",
    columns: [
      { key: "image", label: "", kind: "image" },
      { key: "title", label: "Caption" },
      { key: "buttonLink", label: "Links to" },
      { key: "isPublished", label: "Status", kind: "published" },
    ],
    fields: [
      { name: "imageId", label: "Photo", type: "image", required: true },
      { name: "title", label: "Caption", type: "text", required: true, help: "Shown under the slide, e.g. the package name." },
      { name: "label", label: "Tag", type: "text", nullable: true, placeholder: "MLE", help: "Short code in the caption." },
      { name: "description", label: "Description", type: "textarea", nullable: true },
      { name: "buttonText", label: "Link text", type: "text", nullable: true, placeholder: "View package" },
      { name: "buttonLink", label: "Link", type: "text", nullable: true, placeholder: "/packages/maldives" },
      order,
      { name: "isPublished", label: "Published", type: "checkbox" },
    ],
    orderable: true,
    write: "EDITOR",
    remove: "ADMIN",
  },

  "admin-users": {
    key: "admin-users",
    apiPath: "admin-users",
    title: "Admin users",
    singular: "admin user",
    description: "Editors edit content; admins also publish, delete and manage branches; super admins also manage accounts.",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role", kind: "role" },
      { key: "lastLoginAt", label: "Last sign-in", kind: "date" },
      { key: "isActive", label: "Status", kind: "active" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true, createOnly: true },
      {
        name: "role",
        label: "Role",
        type: "select",
        required: true,
        options: [
          { value: "EDITOR", label: "Editor" },
          { value: "ADMIN", label: "Admin" },
          { value: "SUPER_ADMIN", label: "Super admin" },
        ],
      },
      { name: "password", label: "Password", type: "password", help: "At least 12 characters, letters and numbers. Leave empty to keep the current one." },
      { name: "isActive", label: "Active (can sign in)", type: "checkbox" },
    ],
    write: "SUPER_ADMIN",
    remove: null,
  },
};
