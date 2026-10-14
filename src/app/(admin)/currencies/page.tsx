import type { Metadata } from "next";
import { API_URL, api, can, currentUser } from "@/lib/api";
import { CurrencyRow } from "@/components/currency-editor";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Currencies" };

interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  displayOrder: number;
  isActive: boolean;
}

export default async function CurrenciesPage() {
  const [user, { data: currencies }, settings] = await Promise.all([
    currentUser(),
    api<Currency[]>("/admin/currencies"),
    fetch(`${API_URL}/api/public/settings`, { cache: "no-store" }).then((r) => r.json()).catch(() => null),
  ]);
  const defaultCurrency: string | undefined = settings?.data?.defaultCurrency;
  const canEdit = can(user, "ADMIN");

  return (
    <>
      <PageHeader
        title="Currencies"
        description={
          <>
            Currencies visitors can switch between. There are no exchange rates: every package carries its own official price in each currency, set in its Pricing tab.
            The default ({defaultCurrency ?? "INR"}) is set by the server&apos;s DEFAULT_CURRENCY. “Number format” is a locale such as en-IN (1,01,500) or en-AE (101,500).
          </>
        }
      />
      <div className="space-y-3">
        {currencies.map((currency) => (
          <CurrencyRow key={currency.code} currency={currency} canEdit={canEdit} isDefault={currency.code === defaultCurrency} />
        ))}
        {canEdit && (
          <>
            <h2 className="pt-4 font-semibold text-navy">Add a currency</h2>
            <CurrencyRow currency={{ code: "", symbol: "", name: "", locale: "en-US", displayOrder: currencies.length, isActive: false }} canEdit isDefault={false} />
            <p className="text-sm text-muted">New currencies start hidden. Add prices in that currency to every package before showing it, or packages will fail the publish checklist.</p>
          </>
        )}
      </div>
    </>
  );
}
