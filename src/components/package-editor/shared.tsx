"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash } from "@phosphor-icons/react";
import { savePackageSection } from "@/app/(admin)/packages/actions";
import { FormMessage } from "../resource-form";
import { buttonStyles, inputStyles } from "../ui";

type Section = Parameters<typeof savePackageSection>[1];

/** Saves one section of a package and keeps its field errors (keyed by API path, e.g. "days.0.title"). */
export function useSectionSave(packageId: string, section: Section) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = (body: unknown) =>
    start(async () => {
      const saved = await savePackageSection(packageId, section, body);
      setResult(saved);
      setErrors(saved.ok ? {} : saved.fieldErrors);
      if (saved.ok) router.refresh();
    });
  return { save, pending, result, errors };
}

export function SaveBar({ onSave, pending, result, label = "Save" }: { onSave: () => void; pending: boolean; result: { ok: boolean; message?: string } | null; label?: string }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-6 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 px-5 py-3 backdrop-blur">
      <button type="button" onClick={onSave} disabled={pending} className={buttonStyles.primary}>
        {pending ? "Saving…" : label}
      </button>
      <FormMessage result={result} />
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs font-medium text-danger">{message}</p> : null;
}

/** Up, down and remove controls for an item in an ordered list. */
export function ItemControls({ index, count, onMove, onRemove, label }: { index: number; count: number; onMove: (to: number) => void; onRemove: () => void; label: string }) {
  const iconButton = "grid size-8 place-items-center rounded-md hover:bg-frost disabled:opacity-30";
  return (
    <span className="inline-flex shrink-0 gap-1">
      <button type="button" disabled={index === 0} onClick={() => onMove(index - 1)} className={iconButton} aria-label={`Move ${label} up`}>
        <ArrowUp aria-hidden className="size-4" />
      </button>
      <button type="button" disabled={index === count - 1} onClick={() => onMove(index + 1)} className={iconButton} aria-label={`Move ${label} down`}>
        <ArrowDown aria-hidden className="size-4" />
      </button>
      <button type="button" onClick={onRemove} className={`${iconButton} text-danger`} aria-label={`Remove ${label}`}>
        <Trash aria-hidden className="size-4" />
      </button>
    </span>
  );
}

export const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
};

/** Local ids so React keeps inputs attached to the right item while reordering. */
let counter = 0;
export const uid = () => `item-${++counter}`;

interface ListItem {
  key: string;
  title: string;
  description: string;
}

/** Highlights, inclusions and exclusions: an ordered list of short texts with optional detail. */
export function ListEditor({
  packageId,
  section,
  initial,
  noun,
  intro,
}: {
  packageId: string;
  section: "highlights" | "inclusions" | "exclusions";
  initial: { title: string; description: string | null }[];
  noun: string;
  intro: string;
}) {
  const [items, setItems] = useState<ListItem[]>(() => initial.map((item) => ({ key: uid(), title: item.title, description: item.description ?? "" })));
  const { save, pending, result, errors } = useSectionSave(packageId, section);
  const update = (index: number, patch: Partial<ListItem>) => setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div>
      <p className="mb-4 text-sm text-muted">{intro}</p>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={item.key} className="rounded-lg border border-line p-3">
            <div className="flex items-start gap-2">
              <span className="mt-2 w-6 shrink-0 text-right text-sm font-semibold text-muted">{index + 1}.</span>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  aria-label={`${noun} ${index + 1}`}
                  value={item.title}
                  onChange={(event) => update(index, { title: event.target.value })}
                  aria-invalid={errors[`items.${index}.title`] ? true : undefined}
                  className={inputStyles}
                />
                <FieldError message={errors[`items.${index}.title`]} />
                <input
                  aria-label={`${noun} ${index + 1} detail (optional)`}
                  placeholder="Optional detail"
                  value={item.description}
                  onChange={(event) => update(index, { description: event.target.value })}
                  className={`${inputStyles} text-muted`}
                />
              </div>
              <ItemControls index={index} count={items.length} label={`${noun} ${index + 1}`} onMove={(to) => setItems(move(items, index, to))} onRemove={() => setItems(items.filter((_, i) => i !== index))} />
            </div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => setItems([...items, { key: uid(), title: "", description: "" }])} className={`${buttonStyles.secondary} mt-3`}>
        <Plus aria-hidden className="size-4" />
        Add {noun.toLowerCase()}
      </button>
      <SaveBar
        pending={pending}
        result={result}
        label={`Save ${section}`}
        onSave={() => save({ items: items.map(({ title, description }) => ({ title, description: description.trim() || null })) })}
      />
    </div>
  );
}
