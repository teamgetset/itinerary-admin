"use client";

import { useState } from "react";
import { inputStyles } from "../ui";
import { FieldError, SaveBar, useSectionSave } from "./shared";

const TYPES = [
  ["ADULT", "Adult", "12 years and over"],
  ["CHILD", "Child", "2 to 11 years"],
  ["INFANT", "Infant", "Under 2 years"],
] as const;

/**
 * Official price per traveller type, entered separately for every currency. Nothing is converted:
 * GETSET decides each INR and AED price. Publishing needs all of them.
 */
export function PricingEditor({
  packageId,
  initial,
  currencies,
}: {
  packageId: string;
  initial: { currencyCode: string; priceType: string; amount: number }[];
  currencies: { code: string; name: string }[];
}) {
  const [cells, setCells] = useState<Record<string, string>>(() =>
    Object.fromEntries(initial.map((price) => [`${price.priceType}:${price.currencyCode}`, String(price.amount)])),
  );
  const { save, pending, result, errors } = useSectionSave(packageId, "prices");

  // The order prices are sent in, so an error at "prices.N" can be shown in the right cell.
  const order = TYPES.flatMap(([type]) => currencies.map((currency) => `${type}:${currency.code}`)).filter((key) => cells[key]?.trim());
  const errorFor = (key: string) => {
    const index = order.indexOf(key);
    return index >= 0 ? (errors[`prices.${index}.amount`] ?? errors[`prices.${index}`]) : undefined;
  };
  const missing = TYPES.flatMap(([type, label]) => currencies.filter((c) => !cells[`${type}:${c.code}`]?.trim()).map((c) => `${label} ${c.code}`));

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Prices are per person, twin sharing. Enter each currency&apos;s official price; the website shows the one the visitor picks.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wide text-muted uppercase">
              <th scope="col" className="py-2 pr-4">Traveller</th>
              {currencies.map((currency) => (
                <th key={currency.code} scope="col" className="py-2 pr-4">
                  {currency.code} <span className="font-normal normal-case">({currency.name})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPES.map(([type, label, ages]) => (
              <tr key={type} className="border-t border-line">
                <th scope="row" className="py-3 pr-4 text-left">
                  <span className="block font-semibold">{label}</span>
                  <span className="text-xs font-normal text-muted">{ages}</span>
                </th>
                {currencies.map((currency) => {
                  const key = `${type}:${currency.code}`;
                  const error = errorFor(key);
                  return (
                    <td key={key} className="py-3 pr-4 align-top">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        aria-label={`${label} price in ${currency.code}`}
                        aria-invalid={error ? true : undefined}
                        value={cells[key] ?? ""}
                        onChange={(event) => setCells({ ...cells, [key]: event.target.value })}
                        className={inputStyles}
                      />
                      <FieldError message={error} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {missing.length > 0 && <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">Needed before publishing: {missing.join(", ")}.</p>}
      <FieldError message={errors.prices} />
      <SaveBar
        pending={pending}
        result={result}
        label="Save prices"
        onSave={() =>
          save({
            prices: order.map((key) => {
              const [priceType, currencyCode] = key.split(":");
              return { priceType, currencyCode, amount: Number(cells[key]) };
            }),
          })
        }
      />
    </div>
  );
}
