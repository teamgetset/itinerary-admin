"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { attempt, type ActionResult } from "@/lib/action-result";

/* Package editor actions. Each tab saves its own section through the API. */

const SECTIONS = ["highlights", "inclusions", "exclusions", "itinerary", "prices", "hotels", "activities", "gallery"] as const;
type Section = (typeof SECTIONS)[number];

const refresh = (id?: string) => {
  revalidatePath("/packages");
  if (id) revalidatePath(`/packages/${id}`);
};

export async function createPackage(values: Record<string, unknown>): Promise<ActionResult<{ id: string }>> {
  const result = await attempt(async () => (await api<{ id: string }>("/admin/packages", { body: values })).data, "Package created.");
  if (result.ok) refresh();
  return result;
}

export async function updatePackage(id: string, values: Record<string, unknown>): Promise<ActionResult<{ id: string }>> {
  const result = await attempt(async () => (await api<{ id: string }>(`/admin/packages/${id}`, { method: "PATCH", body: values })).data, "Saved.");
  if (result.ok) refresh(id);
  return result;
}

export async function savePackageSection(id: string, section: Section, body: unknown): Promise<ActionResult<unknown>> {
  if (!SECTIONS.includes(section)) throw new Error("Unknown section");
  const result = await attempt(async () => (await api(`/admin/packages/${id}/${section}`, { method: "PUT", body })).data, "Saved.");
  if (result.ok) refresh(id);
  return result;
}

export type PackageCommand = "publish" | "unpublish" | "archive" | "duplicate" | "delete" | "preview" | "pdf";

const MESSAGES: Record<PackageCommand, string> = {
  publish: "Published. The website updates within a minute.",
  unpublish: "Unpublished: the package is a draft again and hidden from the website.",
  archive: "Archived.",
  duplicate: "Copy created.",
  delete: "Deleted.",
  preview: "Preview link ready.",
  pdf: "PDF ready.",
};

/** Lifecycle and one-off actions. Returns the API's data (new package id, preview URL, PDF version...). */
export async function runPackageCommand(id: string, command: PackageCommand): Promise<ActionResult<Record<string, unknown>>> {
  const result = await attempt(async () => {
    switch (command) {
      case "delete":
        return (await api<Record<string, unknown>>(`/admin/packages/${id}`, { method: "DELETE" })).data;
      case "pdf":
        return (await api<Record<string, unknown>>(`/admin/packages/${id}/pdf`, { method: "POST" })).data;
      default:
        return (await api<Record<string, unknown>>(`/admin/packages/${id}/${command}`, { method: "POST" })).data;
    }
  }, MESSAGES[command]);
  if (result.ok) refresh(command === "delete" ? undefined : id);
  return result;
}
