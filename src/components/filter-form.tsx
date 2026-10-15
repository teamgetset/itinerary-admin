"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

/**
 * A list's search and filters: a plain GET form, so the filters live in the URL (shareable, kept by the page links).
 * Choosing a dropdown option applies it straight away; text search applies on Enter or the Filter button.
 * "Clear" appears while anything is applied and goes back to the unfiltered list.
 *
 * The fields are uncontrolled (defaultValue), and React keeps an input's current value when only its defaultValue
 * changes. So after an in-app navigation (Clear, the sidebar link, Back) the dropdowns would still show, and the next
 * submit would send, the old filters. Keying the form by the URL's query rebuilds it to match the list shown.
 */
export function FilterForm({ className, clearHref, active, children }: { className: string; clearHref: string; active: boolean; children: ReactNode }) {
  const query = useSearchParams().toString();
  return (
    <form
      key={query}
      role="search"
      className={className}
      onChange={(event) => {
        if (event.target instanceof HTMLSelectElement) event.currentTarget.requestSubmit();
      }}
    >
      {children}
      {active && (
        <Link href={clearHref} className="self-center px-2 text-sm font-semibold text-cobalt hover:underline">
          Clear
        </Link>
      )}
    </form>
  );
}
