import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants";
import { adminProxySecret } from "./src/lib/proxy-secret.mjs";
import { adminUrls } from "./src/lib/urls.mjs";

const nextConfig: NextConfig = {
  experimental: {
    // Image uploads go through server actions (the API allows 10 MB images).
    serverActions: { bodySizeLimit: "12mb" },
  },
};

// A production build or server checks its settings before anything else: a missing or malformed API_URL or SITE_URL
// (on Vercel: non-https or local), or on Vercel a missing or weak ADMIN_PROXY_SECRET, stops here with a clear message
// instead of the admin quietly calling localhost or sharing one sign-in limit.
export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER) {
    const mode = { production: true, vercel: Boolean(process.env.VERCEL) };
    adminUrls(process.env, mode);
    adminProxySecret(process.env, mode);
  }
  return nextConfig;
}
