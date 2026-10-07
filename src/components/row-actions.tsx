"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "@phosphor-icons/react";
import { deleteResource, reorderResource } from "@/app/(admin)/actions";
import { buttonStyles } from "./ui";

/** Move an item up or down; saves the whole order of the list shown. */
export function ReorderButtons({ resource, ids, index }: { resource: string; ids: string[]; index: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const move = (by: number) =>
    start(async () => {
      const next = [...ids];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item!);
      const result = await reorderResource(resource, next);
      if (result.ok) router.refresh();
      else alert(result.message);
    });
  return (
    <span className="inline-flex gap-1">
      <button type="button" disabled={pending || index === 0} onClick={() => move(-1)} className="grid size-8 place-items-center rounded-md hover:bg-frost disabled:opacity-30" aria-label="Move up">
        <ArrowUp aria-hidden className="size-4" />
      </button>
      <button type="button" disabled={pending || index === ids.length - 1} onClick={() => move(1)} className="grid size-8 place-items-center rounded-md hover:bg-frost disabled:opacity-30" aria-label="Move down">
        <ArrowDown aria-hidden className="size-4" />
      </button>
    </span>
  );
}

/** Destructive actions always ask first. */
export function DeleteButton({ resource, id, label = "Delete", name, redirectTo }: { resource: string; id: string; label?: string; name: string; redirectTo: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className={buttonStyles.danger}
        onClick={() => {
          if (!confirm(`${label} "${name}"? This cannot be undone from the admin.`)) return;
          start(async () => {
            const result = await deleteResource(resource, id);
            if (result.ok) router.push(redirectTo);
            else setError(result.message);
          });
        }}
      >
        {pending ? "Working…" : label}
      </button>
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
    </span>
  );
}
