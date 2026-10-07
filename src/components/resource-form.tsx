"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import type { ActionResult } from "@/lib/action-result";
import type { FieldConfig } from "@/lib/resources";
import { ImageField, type PickedImage } from "./media-picker";
import { buttonStyles, inputStyles } from "./ui";

type Values = Record<string, unknown>;
type Option = { value: string; label: string };
export interface Currency {
  code: string;
  name: string;
}

/** Where an image field keeps its preview object in API rows: bannerImageId -> bannerImage. */
const previewKey = (name: string) => name.replace(/Id$/, "");

/** API row -> form state. */
export function initialValues(fields: FieldConfig[], row: Values | null): Values {
  const values: Values = {};
  for (const field of fields) {
    const value = row?.[field.name];
    switch (field.type) {
      case "image": {
        const preview = row?.[previewKey(field.name)] as { id: string; url: string; alt: string } | null | undefined;
        values[field.name] = preview ? { id: preview.id, url: preview.url, alt: preview.alt } : null;
        break;
      }
      case "checkbox":
        values[field.name] = row ? Boolean(value) : field.name === "isActive";
        break;
      case "lines":
        values[field.name] = ((value as string[] | undefined) ?? []).join("\n");
        break;
      case "facts":
        values[field.name] = (value as { label: string; value: string }[] | undefined) ?? [];
        break;
      case "prices":
        values[field.name] = Object.fromEntries(Object.entries((value as Record<string, number>) ?? {}).map(([code, amount]) => [code, String(amount)]));
        break;
      case "password":
        values[field.name] = "";
        break;
      default:
        values[field.name] = value === null || value === undefined ? "" : String(value);
    }
  }
  return values;
}

/** Form state -> API payload. On create, empty optional fields are left out so database defaults apply. */
export function payload(fields: FieldConfig[], values: Values, creating: boolean): Values {
  const body: Values = {};
  for (const field of fields) {
    if (field.createOnly && !creating) continue;
    const value = values[field.name];
    const empty = value === "" || value === null || value === undefined;
    switch (field.type) {
      case "checkbox":
        body[field.name] = Boolean(value);
        break;
      case "image":
        if (value) body[field.name] = (value as PickedImage).id;
        else if (!creating && field.nullable) body[field.name] = null;
        break;
      case "number":
        if (!empty) body[field.name] = Number(value);
        else if (!creating && field.nullable) body[field.name] = null;
        break;
      case "lines":
        body[field.name] = String(value ?? "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        break;
      case "facts":
        body[field.name] = (value as { label: string; value: string }[]).filter((fact) => fact.label.trim() || fact.value.trim());
        break;
      case "prices":
        body[field.name] = Object.entries(value as Record<string, string>)
          .filter(([, amount]) => amount !== "")
          .map(([currencyCode, amount]) => ({ currencyCode, amount: Number(amount) }));
        break;
      case "password":
        if (!empty) body[field.name] = value;
        break;
      default: {
        const text = field.uppercase ? String(value ?? "").toUpperCase() : value;
        if (!empty) body[field.name] = text;
        else if (!creating && field.nullable) body[field.name] = null;
        else if (!creating && !field.required && field.name !== "slug") body[field.name] = "";
      }
    }
  }
  return body;
}

export function FormMessage({ result }: { result: { ok: boolean; message?: string } | null }) {
  if (!result?.message) return null;
  return (
    <p role={result.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${result.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
      {result.message}
    </p>
  );
}

export function FieldShell({ id, label, help, error, required, children, wide }: { id: string; label: string; help?: string; error?: string; required?: boolean; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
      {help && !error && <p className="mt-1 text-xs text-muted">{help}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** The first error at this path or below it (e.g. "facts.0.label" for the facts field). */
const errorFor = (errors: Record<string, string>, name: string) =>
  errors[name] ?? Object.entries(errors).find(([path]) => path.startsWith(`${name}.`))?.[1];

/**
 * A form for any field list. `save` is a server action (already bound to what it saves); after creating,
 * the browser goes to `${createdPath}/<new id>`.
 */
export function ResourceForm({
  fields,
  row,
  options,
  currencies = [],
  submitLabel,
  save,
  createdPath,
}: {
  fields: FieldConfig[];
  row: Values | null;
  options: Record<string, Option[]>;
  currencies?: Currency[];
  submitLabel: string;
  save: (values: Values) => Promise<ActionResult<{ id: string }>>;
  createdPath?: string;
}) {
  const router = useRouter();
  const creating = !row;
  const [values, setValues] = useState<Values>(() => initialValues(fields, row));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (name: string, value: unknown) => setValues((current) => ({ ...current, [name]: value }));

  const submit = () =>
    start(async () => {
      const saved = await save(payload(fields, values, creating));
      setResult(saved);
      if (!saved.ok) {
        setErrors(saved.fieldErrors);
        return;
      }
      setErrors({});
      if (creating && createdPath) router.push(`${createdPath}/${saved.data.id}`);
      else router.refresh();
    });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-6"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {fields
          .filter((field) => !(field.createOnly && !creating))
          .map((field) => (
            <FieldRow
              key={field.name}
              field={field}
              value={values[field.name]}
              onChange={(value) => set(field.name, value)}
              error={errorFor(errors, field.name)}
              options={field.options ?? (field.source ? options[field.source] : undefined) ?? []}
              currencies={currencies}
            />
          ))}
      </div>
      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 px-5 py-3 backdrop-blur">
        <button type="submit" disabled={pending} className={buttonStyles.primary}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <FormMessage result={result} />
      </div>
    </form>
  );
}

function FieldRow({
  field,
  value,
  onChange,
  error,
  options,
  currencies,
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  options: Option[];
  currencies: Currency[];
}) {
  const id = `field-${field.name}`;
  const common = { id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-error` : undefined };
  const heading = field.section ? <h3 className="border-t border-line pt-5 font-semibold text-navy sm:col-span-2">{field.section}</h3> : null;
  const shell = (control: ReactNode) => (
    <>
      {heading}
      <FieldShell id={id} label={field.label} help={field.help} error={error} required={field.required} wide={field.wide || field.type === "textarea"}>
        {control}
      </FieldShell>
    </>
  );

  switch (field.type) {
    case "checkbox":
      return (
        <>
          {heading}
          <label className="flex items-center gap-2.5 self-end text-sm font-semibold">
            <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-navy" />
            {field.label}
          </label>
        </>
      );
    case "textarea":
      return shell(<textarea {...common} rows={4} value={String(value)} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} className={inputStyles} />);
    case "lines":
      return shell(<textarea {...common} rows={4} value={String(value)} onChange={(event) => onChange(event.target.value)} className={inputStyles} />);
    case "select":
      return shell(
        <select {...common} value={String(value)} onChange={(event) => onChange(event.target.value)} className={inputStyles}>
          <option value="">{field.required ? "Choose…" : "None"}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>,
      );
    case "image":
      return shell(<ImageField value={value as PickedImage | null} onChange={onChange} invalid={!!error} />);
    case "facts":
      return shell(<FactsEditor value={value as { label: string; value: string }[]} onChange={onChange} />);
    case "prices":
      return shell(
        <div className="grid gap-3 sm:grid-cols-3">
          {currencies.map((currency) => (
            <label key={currency.code} className="text-sm">
              <span className="mb-1 block text-muted">{currency.code}</span>
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={(value as Record<string, string>)[currency.code] ?? ""}
                onChange={(event) => onChange({ ...(value as Record<string, string>), [currency.code]: event.target.value })}
                className={inputStyles}
              />
            </label>
          ))}
        </div>,
      );
    default:
      return shell(
        <input
          {...common}
          type={field.type === "password" ? "password" : field.type === "number" ? "number" : field.type}
          step={field.step}
          autoComplete={field.type === "password" ? "new-password" : undefined}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className={`${inputStyles} ${field.uppercase ? "uppercase" : ""}`}
        />,
      );
  }
}

function FactsEditor({ value, onChange }: { value: { label: string; value: string }[]; onChange: (value: unknown) => void }) {
  const update = (index: number, key: "label" | "value", text: string) =>
    onChange(value.map((fact, i) => (i === index ? { ...fact, [key]: text } : fact)));
  return (
    <div className="space-y-2">
      {value.map((fact, index) => (
        <div key={index} className="flex gap-2">
          <input aria-label={`Fact ${index + 1} label`} value={fact.label} onChange={(event) => update(index, "label", event.target.value)} placeholder="Label, e.g. Visa" className={`${inputStyles} sm:w-48`} />
          <input aria-label={`Fact ${index + 1} value`} value={fact.value} onChange={(event) => update(index, "value", event.target.value)} placeholder="Value" className={inputStyles} />
          <button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))} className={buttonStyles.ghost} aria-label={`Remove fact ${index + 1}`}>
            <Trash aria-hidden className="size-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { label: "", value: "" }])} className={buttonStyles.secondary}>
        <Plus aria-hidden className="size-4" />
        Add fact
      </button>
    </div>
  );
}
