import type { Metadata } from "next";
import { can, currentUser } from "@/lib/api";
import { MediaCard, UploadButton } from "@/components/media-library";
import { EmptyState, PageHeader, Pagination, buttonStyles, inputStyles } from "@/components/ui";
import { FilterForm } from "@/components/filter-form";
import { listMedia } from "../actions";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaPage({ searchParams }: PageProps<"/media">) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  const page = Number(query.page) || 1;
  const [user, { items, meta }] = await Promise.all([currentUser(), listMedia(q, page)]);

  return (
    <>
      <PageHeader
        title="Media library"
        description="Every image used on the site. Upload once, then pick it anywhere. JPEG, PNG, WebP or AVIF, up to 10 MB. Good alt text helps search engines and screen-reader users."
        actions={<UploadButton />}
      />
      <FilterForm className="mb-4 flex gap-2" clearHref="/media" active={!!q}>
        <input type="search" name="q" defaultValue={q} placeholder="Search file names and alt text" aria-label="Search images" className={`${inputStyles} sm:max-w-sm`} />
        <button type="submit" className={buttonStyles.secondary}>
          Search
        </button>
      </FilterForm>
      {items.length === 0 ? (
        <EmptyState title="No images found">{q ? "Try another search." : "Upload the first image."}</EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {items.map((item) => (
            <MediaCard key={item.id} item={item} canArchive={can(user, "ADMIN")} />
          ))}
        </ul>
      )}
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} params={{ q }} />}
    </>
  );
}
