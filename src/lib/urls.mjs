// @ts-check

/*
 * The admin's two addresses: the GETSET API and the customer website. Plain JavaScript so that next.config.ts (which
 * checks them before a production build or server starts) and `npm test` can use it as is.
 * Only `next dev` falls back to localhost; production never does.
 */

const DEV_DEFAULTS = { API_URL: "http://localhost:4000", SITE_URL: "http://localhost:3000" };
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];

/**
 * @param {Record<string, string | undefined>} env usually process.env
 * @param {{ production: boolean, vercel: boolean }} mode production: `next build`/`next start`; vercel: running on Vercel
 * @returns {{ API_URL: string, SITE_URL: string }} origins, without a trailing slash
 */
export function adminUrls(env, { production, vercel }) {
  /** @type {string[]} */
  const problems = [];
  const urls = { ...DEV_DEFAULTS };
  for (const name of /** @type {const} */ (["API_URL", "SITE_URL"])) {
    const value = env[name]?.trim();
    if (!value) {
      if (production) problems.push(`${name} is not set.`);
      continue;
    }
    let url;
    try {
      url = new URL(value);
    } catch {
      problems.push(`${name} is not a valid URL.`);
      continue;
    }
    // Only scheme and host are ever echoed back: the value could hold credentials by mistake.
    const shown = `${url.protocol}//${url.host}`;
    if (!["http:", "https:"].includes(url.protocol) || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
      problems.push(`${name} must be just an address like https://api.example.com (no path, query or credentials).`);
    } else if (vercel && (url.protocol !== "https:" || LOCAL_HOSTS.includes(url.hostname) || url.hostname.endsWith(".localhost"))) {
      problems.push(`${name} must be a public https:// address on Vercel (got ${shown}).`);
    } else {
      urls[name] = url.origin;
    }
  }
  if (problems.length) {
    throw new Error(
      `Admin configuration error:\n  - ${problems.join("\n  - ")}\n` +
        "Set API_URL (the GETSET API) and SITE_URL (the website) in the Vercel project's environment variables, " +
        "or in .env.local for a local production build. See .env.example.",
    );
  }
  return urls;
}
