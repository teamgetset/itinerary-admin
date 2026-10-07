import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* Small, consistent building blocks for every admin page. Server-safe (no hooks). */

const buttonBase =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50";

export const buttonStyles = {
  primary: `${buttonBase} bg-navy text-white hover:bg-cobalt`,
  secondary: `${buttonBase} border border-line bg-white text-ink hover:bg-frost`,
  danger: `${buttonBase} border border-danger/30 bg-white text-danger hover:bg-danger-soft`,
  ghost: `${buttonBase} text-cobalt hover:bg-frost`,
};

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: keyof typeof buttonStyles }) {
  return <button type="button" className={`${buttonStyles[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: keyof typeof buttonStyles }) {
  return <Link className={`${buttonStyles[variant]} ${className}`} {...props} />;
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ children, className = "", title, actions }: { children: ReactNode; className?: string; title?: string; actions?: ReactNode }) {
  return (
    <section className={`rounded-card border border-line bg-white ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          {title && <h2 className="font-semibold text-navy">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const TONES = {
  neutral: "bg-frost text-ink",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-navy text-white",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>{children}</span>;
}

export const STATUS_TONE: Record<string, keyof typeof TONES> = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "neutral",
  NEW: "info",
  CONTACTED: "warning",
  IN_PROGRESS: "warning",
  CONVERTED: "success",
  CLOSED: "neutral",
};

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-white px-6 py-12 text-center">
      <p className="font-semibold text-navy">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

/** Keeps the current filters and changes only the page number. */
export function Pagination({ page, totalPages, total, params }: { page: number; totalPages: number; total: number; params: Record<string, string | undefined> }) {
  if (totalPages <= 1) return <p className="mt-4 text-sm text-muted">{total} total</p>;
  const href = (target: number) => `?${new URLSearchParams({ ...clean(params), page: String(target) })}`;
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-4 text-sm">
      <p className="text-muted">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        {page > 1 && <ButtonLink variant="secondary" href={href(page - 1)}>Previous</ButtonLink>}
        {page < totalPages && <ButtonLink variant="secondary" href={href(page + 1)}>Next</ButtonLink>}
      </div>
    </nav>
  );
}

const clean = (params: Record<string, string | undefined>) =>
  Object.fromEntries(Object.entries(params).filter((entry): entry is [string, string] => !!entry[1] && entry[0] !== "page"));

/** Table wrapper that scrolls sideways on small screens instead of breaking the layout. */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-white">
      <table className="w-full min-w-[40rem] text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wide [&_th]:text-muted [&_th]:uppercase [&_tbody_tr]:border-t [&_tbody_tr]:border-line [&_tbody_tr:hover]:bg-mist">
        {children}
      </table>
    </div>
  );
}

export function Thumb({ src, alt = "" }: { src?: string | null; alt?: string }) {
  return src ? (
    <img src={src} alt={alt} className="size-12 shrink-0 rounded-md object-cover" loading="lazy" />
  ) : (
    <span aria-hidden className="block size-12 shrink-0 rounded-md bg-frost" />
  );
}

export const inputStyles =
  "block w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-cobalt focus:outline-none aria-invalid:border-danger";
