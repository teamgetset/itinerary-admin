// @ts-check
import { isIP } from "node:net";

/*
 * ADMIN_PROXY_SECRET is shared with the GETSET API (the same value in the Render service). With it, the admin's server
 * tells the API which visitor a sign-in comes from, so each person has their own rate limit instead of everyone
 * sharing the admin server's address. Server-only: never a NEXT_PUBLIC_ variable, never sent to a browser.
 * Plain JavaScript so next.config.ts and `npm test` can use it as is.
 */

export const FORWARDED_IP_HEADER = "x-getset-client-ip";
export const PROXY_SECRET_HEADER = "x-getset-proxy-secret";

/**
 * The secret, or null when it is not set. Required on Vercel production builds and servers; when set anywhere it
 * must look like a generated secret. The value never appears in an error message.
 * @param {Record<string, string | undefined>} env usually process.env
 * @param {{ production: boolean, vercel: boolean }} mode
 * @returns {string | null}
 */
export function adminProxySecret(env, { production, vercel }) {
  const value = env.ADMIN_PROXY_SECRET;
  let problem = null;
  if (!value) {
    if (production && vercel) problem = "ADMIN_PROXY_SECRET is not set.";
  } else if (value.length < 32) {
    problem = "ADMIN_PROXY_SECRET must be at least 32 characters.";
  } else if (value !== value.trim()) {
    problem = "ADMIN_PROXY_SECRET must not start or end with spaces.";
  }
  if (problem) {
    throw new Error(
      `Admin configuration error:\n  - ${problem}\n` +
        "Use the same value as the API's ADMIN_PROXY_SECRET (Render), set in the Vercel project's environment variables " +
        "(generate one with: openssl rand -base64 48). See .env.example.",
    );
  }
  return value || null;
}

/**
 * Headers that pass the visitor's address on to the API. Only on Vercel, which overwrites x-real-ip with the
 * visitor's address; anywhere else that header could come from the visitor, so nothing is sent.
 * @param {{ get(name: string): string | null }} incoming the visitor's request headers
 * @param {string | null} secret
 * @param {boolean} vercel
 * @returns {Record<string, string>}
 */
export function forwardedClientHeaders(incoming, secret, vercel) {
  if (!secret || !vercel) return {};
  const ip = incoming.get("x-real-ip")?.trim();
  return ip && isIP(ip) ? { [FORWARDED_IP_HEADER]: ip, [PROXY_SECRET_HEADER]: secret } : {};
}
