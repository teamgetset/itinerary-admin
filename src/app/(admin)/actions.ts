"use server";

import { revalidatePath } from "next/cache";
import { api, type PageMeta } from "@/lib/api";
import { attempt, type ActionResult } from "@/lib/action-result";
import { RESOURCES } from "@/lib/resources";

/*
 * Server actions behind the admin forms. The browser only names a resource ("branches"); the API path is looked
 * up here, so client code can never point a call at an arbitrary endpoint. The API checks the user's role again.
 */

type Row = Record<string, unknown> & { id: string };

function resource(key: string) {
  const config = RESOURCES[key];
  if (!config) throw new Error(`Unknown resource ${key}`);
  return config;
}

export async function saveResource(key: string, id: string | null, values: Record<string, unknown>): Promise<ActionResult<Row>> {
  const { apiPath } = resource(key);
  const result = await attempt(async () =>
    id
      ? (await api<Row>(`/admin/${apiPath}/${id}`, { method: "PATCH", body: values })).data
      : (await api<Row>(`/admin/${apiPath}`, { method: "POST", body: values })).data,
    "Saved.",
  );
  if (result.ok) revalidatePath(`/${key}`, "layout");
  return result;
}

export async function deleteResource(key: string, id: string): Promise<ActionResult<null>> {
  const { apiPath } = resource(key);
  const result = await attempt(async () => {
    await api(`/admin/${apiPath}/${id}`, { method: "DELETE" });
    return null;
  });
  if (result.ok) revalidatePath(`/${key}`, "layout");
  return result;
}

/** One consequence of a deletion, as the API words it: a summary, the records concerned, and an optional tip. */
export interface DeleteEffect {
  summary: string;
  items: string[];
  note?: string;
}

/** What else deleting this item changes (resources with `deleteCheck`), listed in the confirmation first. */
export async function deleteEffects(key: string, id: string): Promise<ActionResult<DeleteEffect[]>> {
  const { apiPath } = resource(key);
  return attempt(async () => (await api<{ effects: DeleteEffect[] }>(`/admin/${apiPath}/${id}/delete-check`)).data.effects);
}

export async function reorderResource(key: string, ids: string[]): Promise<ActionResult<null>> {
  const { apiPath } = resource(key);
  const result = await attempt(async () => {
    await api(`/admin/${apiPath}/order`, { method: "PUT", body: { ids } });
    return null;
  });
  if (result.ok) revalidatePath(`/${key}`);
  return result;
}

// ---------------------------------------------------------------------------------------------
// Media

export interface MediaItem {
  id: string;
  url: string | null;
  fileName: string;
  alt: string;
  focalPoint: string | null;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export async function listMedia(q: string, page: number): Promise<{ items: MediaItem[]; meta?: PageMeta }> {
  const params = new URLSearchParams({ page: String(page), pageSize: "24", ...(q && { q }) });
  const { data, meta } = await api<MediaItem[]>(`/admin/media?${params}`);
  return { items: data, meta };
}

export async function uploadMedia(form: FormData): Promise<ActionResult<MediaItem>> {
  const result = await attempt(async () => (await api<MediaItem>("/admin/media", { form })).data, "Uploaded.");
  if (result.ok) revalidatePath("/media");
  return result;
}

export async function updateMedia(id: string, values: { alt?: string; focalPoint?: string | null }): Promise<ActionResult<MediaItem>> {
  const result = await attempt(async () => (await api<MediaItem>(`/admin/media/${id}`, { method: "PATCH", body: values })).data, "Saved.");
  if (result.ok) revalidatePath("/media");
  return result;
}

export async function archiveMedia(id: string): Promise<ActionResult<null>> {
  const result = await attempt(async () => {
    await api(`/admin/media/${id}`, { method: "DELETE" });
    return null;
  });
  if (result.ok) revalidatePath("/media");
  return result;
}

// ---------------------------------------------------------------------------------------------
// Site content, currencies, enquiries

export async function saveContent(key: string, value: unknown): Promise<ActionResult<unknown>> {
  const result = await attempt(async () => (await api(`/admin/content/${encodeURIComponent(key)}`, { method: "PUT", body: value })).data, "Saved. The website updates within a minute.");
  if (result.ok) revalidatePath("/content");
  return result;
}

export async function saveCurrency(code: string | null, values: Record<string, unknown>): Promise<ActionResult<unknown>> {
  const result = await attempt(async () =>
    code
      ? (await api(`/admin/currencies/${code}`, { method: "PATCH", body: values })).data
      : (await api("/admin/currencies", { method: "POST", body: values })).data,
    "Saved.",
  );
  if (result.ok) revalidatePath("/currencies");
  return result;
}

export async function updateEnquiryStatus(id: string, status: string): Promise<ActionResult<unknown>> {
  const result = await attempt(async () => (await api(`/admin/enquiries/${id}`, { method: "PATCH", body: { status } })).data, "Status updated.");
  if (result.ok) revalidatePath("/enquiries", "layout");
  return result;
}

export async function addEnquiryNote(id: string, body: string): Promise<ActionResult<unknown>> {
  const result = await attempt(async () => (await api(`/admin/enquiries/${id}/notes`, { body: { body } })).data, "Note added.");
  if (result.ok) revalidatePath(`/enquiries/${id}`);
  return result;
}
