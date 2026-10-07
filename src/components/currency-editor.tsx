"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveCurrency } from "@/app/(admin)/actions";
import { FieldError } from "./package-editor/shared";
import { buttonStyles, inputStyles } from "./ui";

interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  displayOrder: number;
  isActive: boolean;
}

/** One currency as an editable row; with `code: ""` it is the form for adding a new one. */
export function CurrencyRow({ currency, canEdit, isDefault }: { currency: Currency; canEdit: boolean; isDefault: boolean }) {
  const router = useRouter();
  const creating = !currency.code;
  const [values, setValues] = useState({ ...currency, displayOrder: String(currency.displayOrder) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (key: keyof typeof values, value: string | boolean) => setValues({ ...values, [key]: value });

  const submit = () =>
    start(async () => {
      const body = { symbol: values.symbol, name: values.name, locale: values.locale, displayOrder: Number(values.displayOrder) || 0, isActive: values.isActive };
      const result = await saveCurrency(creating ? null : currency.code, creating ? { ...body, code: values.code } : body);
      setErrors(result.ok ? {} : result.fieldErrors);
      setMessage({ ok: result.ok, text: result.ok ? "Saved." : result.message });
      if (result.ok) {
        if (creating) setValues({ ...currency, displayOrder: "0" });
        router.refresh();
      }
    });

  const input = (key: "code" | "symbol" | "name" | "locale" | "displayOrder", label: string, className = "") => (
    <label className={`block text-xs font-semibold ${className}`}>
      {label}
      <input
        value={String(values[key])}
        disabled={!canEdit || (key === "code" && !creating)}
        onChange={(event) => set(key, event.target.value)}
        aria-invalid={errors[key] ? true : undefined}
        className={`${inputStyles} mt-1 font-normal ${key === "code" ? "uppercase" : ""}`}
      />
      <FieldError message={errors[key]} />
    </label>
  );

  return (
    <form
      className="grid gap-3 rounded-card border border-line bg-white p-4 sm:grid-cols-[6rem_6rem_1fr_8rem_6rem] sm:items-start"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {input("code", "Code")}
      {input("symbol", "Symbol")}
      {input("name", "Name")}
      {input("locale", "Number format")}
      {input("displayOrder", "Order")}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-5">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="size-4 accent-navy" checked={values.isActive} disabled={!canEdit || isDefault} onChange={(event) => set("isActive", event.target.checked)} />
          Shown on the website{isDefault && " (default currency)"}
        </label>
        {canEdit && (
          <button type="submit" disabled={pending} className={buttonStyles.secondary}>
            {pending ? "Saving…" : creating ? "Add currency" : "Save"}
          </button>
        )}
        {message && (
          <span role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
