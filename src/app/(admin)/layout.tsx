import { can, currentUser } from "@/lib/api";
import { Sidebar, type NavGroup } from "@/components/sidebar";
import { logout } from "../login/actions";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const user = await currentUser();

  const groups: NavGroup[] = [
    { label: "Overview", items: [{ label: "Dashboard", href: "/" }] },
    {
      label: "Travel",
      items: [
        { label: "Packages", href: "/packages" },
        { label: "Pricing", href: "/pricing" },
        { label: "Itinerary PDFs", href: "/pdfs" },
        { label: "Branches", href: "/branches" },
        { label: "Destinations", href: "/destinations" },
        { label: "Categories", href: "/categories" },
        { label: "Hotels", href: "/hotels" },
        { label: "Activities", href: "/activities" },
      ],
    },
    {
      label: "Website",
      items: [
        { label: "Hero slides", href: "/hero-slides" },
        { label: "Testimonials", href: "/testimonials" },
        { label: "Global content", href: "/content" },
        { label: "Media library", href: "/media" },
        { label: "SEO", href: "/seo" },
      ],
    },
    { label: "Leads", items: [{ label: "Enquiries", href: "/enquiries" }] },
    {
      label: "Settings",
      items: [
        { label: "Currencies", href: "/currencies" },
        ...(can(user, "SUPER_ADMIN") ? [{ label: "Admin users", href: "/admin-users" }] : []),
        ...(can(user, "ADMIN") ? [{ label: "Activity log", href: "/activity" }] : []),
      ],
    },
  ];

  return (
    <div className="lg:flex">
      <Sidebar groups={groups} user={user} logout={logout} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
