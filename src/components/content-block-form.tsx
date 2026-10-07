"use client";

import { useState, useTransition } from "react";
import { Plus } from "@phosphor-icons/react";
import { saveContent } from "@/app/(admin)/actions";
import { FieldError, ItemControls, move } from "./package-editor/shared";
import { FormMessage } from "./resource-form";
import { buttonStyles, inputStyles } from "./ui";

/* Forms for the site-wide content blocks. Each block's shape is checked again by the API. */

export type ContentFieldType = "text" | "textarea" | "checkbox" | "link" | "optional-link" | "links" | "lines" | "social";

export interface ContentField {
  /** Property of the block value; "" means the value itself (the social links list). */
  key: string;
  label: string;
  type: ContentFieldType;
  help?: string;
}

type Link = { label: string; href: string };
type Social = { network: string; label: string; href: string };
type Value = Record<string, unknown>;

const NETWORKS = ["instagram", "facebook", "linkedin", "youtube", "x", "tiktok"];

export function ContentBlockForm({ blockKey, fields, initial }: { blockKey: string; fields: ContentField[]; initial: unknown }) {
  const [value, setValue] = useState<unknown>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [pending, start] = useTransition();

  const get = (key: string) => (key ? (value as Value)[key] : value);
  const set = (key: string, next: unknown) => setValue(key ? { ...(value as Value), [key]: next } : next);
  const errorAt = (path: string) => errors[path] ?? Object.entries(errors).find(([p]) => p.startsWith(path ? `${path}.` : ""))?.[1];

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const saved = await saveContent(blockKey, value);
          setResult(saved);
          setErrors(saved.ok ? {} : saved.fieldErrors);
        });
      }}
    >
      {fields.map((field) => {
        const id = `${blockKey}-${field.key || "value"}`;
        const current = get(field.key);
        const label = (
          <span className="mb-1.5 block text-sm font-semibold">
            {field.label}
          </span>
        );
        switch (field.type) {
          case "checkbox":
            return (
              <label key={id} className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={Boolean(current)} onChange={(event) => set(field.key, event.target.checked)} className="size-4 accent-navy" />
                {field.label}
              </label>
            );
          case "text":
          case "textarea":
            return (
              <label key={id} className="block">
                {label}
                {field.type === "text" ? (
                  <input value={String(current ?? "")} onChange={(event) => set(field.key, event.target.value)} className={inputStyles} />
                ) : (
                  <textarea rows={3} value={String(current ?? "")} onChange={(event) => set(field.key, event.target.value)} className={inputStyles} />
                )}
                {field.help && <span className="mt-1 block text-xs text-muted">{field.help}</span>}
                <FieldError message={errorAt(field.key)} />
              </label>
            );
          case "lines":
            return (
              <label key={id} className="block">
                {label}
                <textarea
                  rows={5}
                  value={((current as string[]) ?? []).join("\n")}
                  onChange={(event) => set(field.key, event.target.value.split("\n"))}
                  onBlur={(event) => set(field.key, event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))}
                  className={inputStyles}
                />
                <span className="mt-1 block text-xs text-muted">{field.help ?? "One per line."}</span>
                <FieldError message={errorAt(field.key)} />
              </label>
            );
          case "link":
          case "optional-link": {
            const link = current as Link | null;
            return (
              <fieldset key={id}>
                <legend className="mb-1.5 text-sm font-semibold">{field.label}</legend>
                {field.type === "optional-link" && (
                  <label className="mb-2 flex items-center gap-2 text-sm">
                    <input type="checkbox" className="size-4 accent-navy" checked={!!link} onChange={(event) => set(field.key, event.target.checked ? { label: "", href: "" } : null)} />
                    Show this button
                  </label>
                )}
                {link && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input aria-label={`${field.label} text`} placeholder="Button text" value={link.label} onChange={(event) => set(field.key, { ...link, label: event.target.value })} className={inputStyles} />
                    <input aria-label={`${field.label} link`} placeholder="/packages or https://…" value={link.href} onChange={(event) => set(field.key, { ...link, href: event.target.value })} className={inputStyles} />
                  </div>
                )}
                <FieldError message={errorAt(field.key)} />
              </fieldset>
            );
          }
          case "links": {
            const links = (current as Link[]) ?? [];
            return (
              <fieldset key={id}>
                <legend className="mb-1.5 text-sm font-semibold">{field.label}</legend>
                <ol className="space-y-2">
                  {links.map((link, index) => (
                    <li key={index} className="flex gap-2">
                      <input aria-label={`${field.label} ${index + 1} text`} value={link.label} placeholder="Text" onChange={(event) => set(field.key, links.map((l, i) => (i === index ? { ...l, label: event.target.value } : l)))} className={inputStyles} />
                      <input aria-label={`${field.label} ${index + 1} link`} value={link.href} placeholder="/path or https://…" onChange={(event) => set(field.key, links.map((l, i) => (i === index ? { ...l, href: event.target.value } : l)))} className={inputStyles} />
                      <ItemControls index={index} count={links.length} label={`link ${index + 1}`} onMove={(to) => set(field.key, move(links, index, to))} onRemove={() => set(field.key, links.filter((_, i) => i !== index))} />
                    </li>
                  ))}
                </ol>
                <button type="button" onClick={() => set(field.key, [...links, { label: "", href: "" }])} className={`${buttonStyles.secondary} mt-2`}>
                  <Plus aria-hidden className="size-4" /> Add link
                </button>
                <FieldError message={errorAt(field.key)} />
              </fieldset>
            );
          }
          case "social": {
            const links = (current as Social[]) ?? [];
            const update = (index: number, patch: Partial<Social>) => set(field.key, links.map((l, i) => (i === index ? { ...l, ...patch } : l)));
            return (
              <fieldset key={id}>
                <legend className="mb-1.5 text-sm font-semibold">{field.label}</legend>
                <ol className="space-y-2">
                  {links.map((link, index) => (
                    <li key={index} className="grid gap-2 sm:grid-cols-[9rem_1fr_1fr_auto]">
                      <select aria-label={`Network ${index + 1}`} value={link.network} onChange={(event) => update(index, { network: event.target.value })} className={inputStyles}>
                        {NETWORKS.map((network) => (
                          <option key={network} value={network}>
                            {network}
                          </option>
                        ))}
                      </select>
                      <input aria-label={`Label ${index + 1}`} value={link.label} placeholder="Instagram, Dubai office" onChange={(event) => update(index, { label: event.target.value })} className={inputStyles} />
                      <input aria-label={`Link ${index + 1}`} value={link.href} placeholder="https://…" onChange={(event) => update(index, { href: event.target.value })} className={inputStyles} />
                      <ItemControls index={index} count={links.length} label={`social link ${index + 1}`} onMove={(to) => set(field.key, move(links, index, to))} onRemove={() => set(field.key, links.filter((_, i) => i !== index))} />
                    </li>
                  ))}
                </ol>
                <button type="button" onClick={() => set(field.key, [...links, { network: "instagram", label: "", href: "" }])} className={`${buttonStyles.secondary} mt-2`}>
                  <Plus aria-hidden className="size-4" /> Add social link
                </button>
                <FieldError message={errorAt(field.key)} />
              </fieldset>
            );
          }
        }
      })}
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button type="submit" disabled={pending} className={buttonStyles.primary}>
          {pending ? "Saving…" : "Save"}
        </button>
        <FormMessage result={result} />
      </div>
    </form>
  );
}
