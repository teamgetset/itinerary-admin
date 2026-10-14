import assert from "node:assert/strict";
import { test } from "node:test";
import { adminUrls } from "./urls.mjs";

const local = { production: true, vercel: false };
const vercel = { production: true, vercel: true };
const good = { API_URL: "https://api.example.com", SITE_URL: "https://www.example.com/" };

test("production needs both addresses: there is no localhost fallback", () => {
  assert.throws(() => adminUrls({}, local), /API_URL is not set\.[\s\S]*SITE_URL is not set\./);
  assert.throws(() => adminUrls({ SITE_URL: good.SITE_URL }, vercel), /API_URL is not set/);
  assert.throws(() => adminUrls({ API_URL: "  ", SITE_URL: good.SITE_URL }, local), /API_URL is not set/);
});

test("malformed addresses are refused", () => {
  for (const API_URL of ["api.example.com", "ftp://api.example.com", "https://api.example.com/api", "https://api.example.com/?x=1", "https://api.example.com/#x"]) {
    assert.throws(() => adminUrls({ ...good, API_URL }, local), /API_URL (is not a valid URL|must be just an address)/, API_URL);
  }
});

test("credentials in an address are refused and never repeated in the message", () => {
  assert.throws(
    () => adminUrls({ ...good, API_URL: "https://user:s3cret-value@api.example.com" }, vercel),
    (error) => error instanceof Error && /no path, query or credentials/.test(error.message) && !error.message.includes("s3cret-value"),
  );
});

test("on Vercel only public https addresses are accepted", () => {
  for (const API_URL of ["http://api.example.com", "https://localhost:4000", "https://127.0.0.1", "https://[::1]:4000", "https://app.localhost"]) {
    assert.throws(() => adminUrls({ ...good, API_URL }, vercel), /API_URL must be a public https:\/\/ address on Vercel/, API_URL);
  }
  assert.throws(() => adminUrls({ ...good, SITE_URL: "http://localhost:3000" }, vercel), /SITE_URL must be a public https/);
});

test("valid addresses come back as origins without a trailing slash", () => {
  assert.deepEqual(adminUrls(good, vercel), { API_URL: "https://api.example.com", SITE_URL: "https://www.example.com" });
});

test("a local production build may use local addresses when they are set explicitly", () => {
  assert.deepEqual(adminUrls({ API_URL: "http://localhost:4000", SITE_URL: "http://localhost:3000" }, local), {
    API_URL: "http://localhost:4000",
    SITE_URL: "http://localhost:3000",
  });
});

test("only development falls back to the local API and website", () => {
  assert.deepEqual(adminUrls({}, { production: false, vercel: false }), { API_URL: "http://localhost:4000", SITE_URL: "http://localhost:3000" });
});

test("the message says where to set the values", () => {
  assert.throws(() => adminUrls({}, vercel), /Vercel project's environment variables[\s\S]*\.env\.example/);
});
