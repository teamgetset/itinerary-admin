"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp } from "@phosphor-icons/react";
import { deleteEffects, deleteResource, reorderResource, type DeleteEffect } from "@/app/(admin)/actions";
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

/** The confirmation question, followed by what else the deletion changes. */
function confirmation(label: string, name: string, effects: DeleteEffect[]) {
  const lines = [`${label} "${name}"? This cannot be undone from the admin.`];
  for (const effect of effects) {
    lines.push("", effect.summary, ...effect.items.slice(0, 8).map((item) => `  • ${item}`));
    if (effect.items.length > 8) lines.push(`  • and ${effect.items.length - 8} more`);
    if (effect.note) lines.push(effect.note);
  }
  return lines.join("\n");
}

/** Destructive actions always ask first; with `check`, the question lists what else is affected (from the API). */
export function DeleteButton({
  resource,
  id,
  label = "Delete",
  name,
  redirectTo,
  check = false,
}: {
  resource: string;
  id: string;
  label?: string;
  name: string;
  redirectTo: string;
  check?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const remove = (effects: DeleteEffect[]) => {
    if (!confirm(confirmation(label, name, effects))) return;
    start(async () => {
      const result = await deleteResource(resource, id);
      if (result.ok) router.push(redirectTo);
      else setError(result.message);
    });
  };
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className={buttonStyles.danger}
        onClick={() => {
          setError(null);
          if (!check) return remove([]);
          start(async () => {
            const found = await deleteEffects(resource, id);
            if (found.ok) remove(found.data);
            else setError(found.message);
          });
        }}
      >
        {pending ? "Working…" : label}
      </button>
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
    </span>
  );
}
