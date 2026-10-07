import { api } from "./api";
import type { FieldConfig } from "./resources";

type Option = { value: string; label: string };

/** Loads the dropdown options a form needs (branches, destinations, packages) and the active currencies. */
export async function formData(fields: FieldConfig[]) {
  const sources = new Set(fields.flatMap((field) => (field.source ? [field.source] : [])));
  const load = async (source: string): Promise<[string, Option[]]> => {
    if (source === "packages") {
      const { data } = await api<{ id: string; title: string; status: string }[]>("/admin/packages?pageSize=100");
      return [source, data.map((pkg) => ({ value: pkg.id, label: pkg.status === "PUBLISHED" ? pkg.title : `${pkg.title} (${pkg.status.toLowerCase()})` }))];
    }
    const { data } = await api<{ id: string; name: string }[]>(`/admin/${source}?pageSize=100`);
    return [source, data.map((row) => ({ value: row.id, label: row.name }))];
  };
  const [options, currencies] = await Promise.all([
    Promise.all([...sources].map(load)).then(Object.fromEntries),
    fields.some((field) => field.type === "prices")
      ? api<{ code: string; name: string; isActive: boolean }[]>("/admin/currencies").then(({ data }) => data.filter((c) => c.isActive))
      : Promise.resolve([]),
  ]);
  return { options: options as Record<string, Option[]>, currencies };
}
