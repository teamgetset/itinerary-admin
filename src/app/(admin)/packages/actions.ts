"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { attempt, type ActionResult } from "@/lib/action-result";
import { pdfFileProblem, pdfVersionPath } from "@/lib/pdf-file.mjs";

/* Package editor actions. Each tab saves its own section through the API. */

const SECTIONS = ["highlights", "inclusions", "exclusions", "good-to-know", "important-info", "itinerary", "prices", "hotels", "activities", "gallery"] as const;
type Section = (typeof SECTIONS)[number];

const refresh = (id?: string) => {
  revalidatePath("/packages");
  revalidatePath("/pdfs");
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

export type PackageCommand = "publish" | "unpublish" | "archive" | "duplicate" | "delete" | "preview";

const MESSAGES: Record<PackageCommand, string> = {
  publish: "Published. The website updates within a minute.",
  unpublish: "Unpublished: the package is a draft again and hidden from the website.",
  archive: "Archived.",
  duplicate: "Copy created.",
  delete: "Deleted.",
  preview: "Preview link ready.",
};

/** Lifecycle and one-off actions. Returns the API's data (new package id, preview URL...). */
export async function runPackageCommand(id: string, command: PackageCommand): Promise<ActionResult<Record<string, unknown>>> {
  const result = await attempt(async () => {
    switch (command) {
      case "delete":
        return (await api<Record<string, unknown>>(`/admin/packages/${id}`, { method: "DELETE" })).data;
      default:
        return (await api<Record<string, unknown>>(`/admin/packages/${id}/${command}`, { method: "POST" })).data;
    }
  }, MESSAGES[command]);
  if (result.ok) refresh(command === "delete" ? undefined : id);
  return result;
}

const UNKNOWN_VERSION = { ok: false as const, message: "Unknown PDF version.", fieldErrors: {} };

/**
 * Uploads or replaces one version of the package's itinerary PDF ("with-logo" or "without-logo").
 * The file is checked here and again, with its contents, by the API.
 */
export async function uploadItineraryPdf(id: string, version: string, form: FormData): Promise<ActionResult<{ warning?: string }>> {
  const path = pdfVersionPath(version);
  if (path === null) return UNKNOWN_VERSION;
  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, message: "Choose a PDF file.", fieldErrors: {} };
  const problem = pdfFileProblem(file);
  if (problem) return { ok: false, message: problem, fieldErrors: {} };
  const upload = new FormData();
  upload.append("file", file, file.name);
  const result = await attempt(
    async () => (await api<{ warning?: string }>(`/admin/packages/${id}/itinerary-pdf${path}`, { method: "PUT", form: upload })).data,
    "PDF uploaded.",
  );
  if (result.ok) refresh(id);
  return result;
}

/**
 * Removes one version of the itinerary PDF (admins only). The one with the logo only while the package is not
 * published; the API enforces both.
 */
export async function removeItineraryPdf(id: string, version: string): Promise<ActionResult<{ fileDeleted: boolean; warning?: string }>> {
  const path = pdfVersionPath(version);
  if (path === null) return UNKNOWN_VERSION;
  const result = await attempt(
    async () => (await api<{ fileDeleted: boolean; warning?: string }>(`/admin/packages/${id}/itinerary-pdf${path}`, { method: "DELETE" })).data,
    "PDF removed.",
  );
  if (result.ok) refresh(id);
  return result;
}
