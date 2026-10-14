import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminProxySecret, forwardedClientHeaders } from "./proxy-secret.mjs";
import { adminUrls } from "./urls.mjs";

/*
 * Server-side client for the GETSET API. Only server components, server actions and route handlers use it:
 * the session token lives in an httpOnly cookie on the admin's domain and is never readable by browser code.
 * Every call is authorised again by the API, so hiding a page here is only a convenience, not the security.
 */

const MODE = { production: process.env.NODE_ENV === "production", vercel: Boolean(process.env.VERCEL) };
/** Required in production (checked again by next.config.ts); localhost only under `next dev`. */
export const { API_URL, SITE_URL } = adminUrls(process.env, MODE);
/** Shared with the API; server-only (see proxy-secret.mjs). */
const PROXY_SECRET = adminProxySecret(process.env, MODE);
export const SESSION_COOKIE = "getset_admin_session";

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: { path: string; message: string }[];
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(body.message);
  }
}

type Init = { method?: string; body?: unknown; form?: FormData };

export async function sessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** Calls /api<path>. A missing or ended session sends the user to the sign-in page. */
export async function api<T>(path: string, init: Init = {}): Promise<{ data: T; meta?: PageMeta }> {
  const token = await sessionToken();
  if (!token) redirect("/login");
  const response = await apiFetch(path, init, token);
  if (response.status === 401) redirect("/login?expired=1");
  const json = await response.json().catch(() => null);
  if (!json?.success) {
    throw new ApiError(response.status, json?.error ?? { code: "API_UNAVAILABLE", message: "The API did not respond correctly." });
  }
  return { data: json.data as T, meta: json.meta };
}

/**
 * Raw request, for streaming files (PDF previews) and the sign-in call. On Vercel it also tells the API which visitor
 * this is, proven with ADMIN_PROXY_SECRET, so sign-in limits are per person (proxy-secret.mjs); the API ignores the
 * address without the secret. X-Forwarded-For is never passed on: the API does not trust it.
 */
export async function apiFetch(path: string, init: Init = {}, token?: string) {
  const forwarded = PROXY_SECRET && MODE.vercel ? forwardedClientHeaders(await headers(), PROXY_SECRET, MODE.vercel) : {};
  return fetch(`${API_URL}/api${path}`, {
    method: init.method ?? (init.body || init.form ? "POST" : "GET"),
    headers: {
      ...(token && { authorization: `Bearer ${token}` }),
      ...(init.body !== undefined && { "content-type": "application/json" }),
      ...forwarded,
    },
    body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
    cache: "no-store",
  });
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR";
  isActive: boolean;
  lastLoginAt: string | null;
}

const RANK = { EDITOR: 1, ADMIN: 2, SUPER_ADMIN: 3 } as const;
export const can = (user: Pick<AdminUser, "role">, needed: AdminUser["role"]) => RANK[user.role] >= RANK[needed];

export const currentUser = async () => (await api<AdminUser>("/auth/me")).data;
