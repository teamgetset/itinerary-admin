"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { List, X } from "@phosphor-icons/react";

export interface NavGroup {
  label: string;
  items: { label: string; href: string }[];
}

/** Sidebar on desktop, a menu button on small screens. */
export function Sidebar({ groups, user, logout }: { groups: NavGroup[]; user: { name: string; role: string }; logout: () => Promise<void> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Link href="/" className="font-bold text-navy">
          GETSET <span className="font-medium text-muted">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="admin-nav"
          className="grid size-10 place-items-center rounded-lg hover:bg-frost"
        >
          {open ? <X aria-hidden className="size-5" /> : <List aria-hidden className="size-5" />}
          <span className="sr-only">Menu</span>
        </button>
      </div>

      <aside
        id="admin-nav"
        className={`${open ? "block" : "hidden"} border-b border-line bg-night text-white lg:sticky lg:top-0 lg:block lg:h-svh lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-0`}
      >
        <div className="hidden px-6 pt-6 pb-4 lg:block">
          <Link href="/" className="text-lg font-bold">
            GETSET <span className="font-medium text-white/60">Admin</span>
          </Link>
        </div>
        <nav aria-label="Admin" className="space-y-5 px-3 py-4 lg:py-2">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1 text-[0.7rem] font-semibold tracking-wider text-white/45 uppercase">{group.label}</p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active(item.href) ? "page" : undefined}
                      className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white aria-[current=page]:bg-white/15 aria-[current=page]:font-semibold aria-[current=page]:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 px-6 py-4 text-sm">
          <p className="font-semibold">{user.name}</p>
          <p className="text-white/60">{user.role.replace("_", " ").toLowerCase()}</p>
          <form action={logout} className="mt-3">
            <button type="submit" className="text-sm font-semibold text-sun hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
