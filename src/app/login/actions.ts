"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, apiFetch, sessionToken } from "@/lib/api";

export interface LoginState {
  error?: string;
  email?: string;
}

/** Only same-site paths are allowed as the post-login destination. */
const safeNext = (value: FormDataEntryValue | null) => (typeof value === "string" && /^\/(?!\/)/.test(value) ? value : "/");

export async function login(_state: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  let response: Response;
  try {
    response = await apiFetch("/auth/login", { body: { email, password } });
  } catch {
    return { error: "The GETSET API is not reachable. Try again in a moment.", email };
  }
  const json = await response.json().catch(() => null);
  if (!json?.success) return { error: json?.error?.message ?? "Sign-in failed.", email };

  (await cookies()).set(SESSION_COOKIE, json.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(json.data.expiresAt),
  });
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  const token = await sessionToken();
  if (token) await apiFetch("/auth/logout", { method: "POST" }, token).catch(() => null);
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
