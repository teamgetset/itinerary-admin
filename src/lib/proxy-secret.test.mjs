import assert from "node:assert/strict";
import { test } from "node:test";
import { FORWARDED_IP_HEADER, PROXY_SECRET_HEADER, adminProxySecret, forwardedClientHeaders } from "./proxy-secret.mjs";

const SECRET = "test-only-admin-proxy-secret-0123456789";
const vercelProd = { production: true, vercel: true };
const headersOf = (values) => new Headers(values);

test("required on Vercel production builds and servers", () => {
  assert.throws(() => adminProxySecret({}, vercelProd), /ADMIN_PROXY_SECRET is not set/);
  assert.throws(() => adminProxySecret({ ADMIN_PROXY_SECRET: "" }, vercelProd), /ADMIN_PROXY_SECRET is not set/);
  assert.equal(adminProxySecret({ ADMIN_PROXY_SECRET: SECRET }, vercelProd), SECRET);
});

test("optional elsewhere: local production builds and development work without it", () => {
  assert.equal(adminProxySecret({}, { production: true, vercel: false }), null);
  assert.equal(adminProxySecret({}, { production: false, vercel: false }), null);
});

test("a weak or padded value is refused everywhere, and never repeated in the message", () => {
  for (const [value, message] of [
    ["short-secret-value", /at least 32 characters/],
    [` ${SECRET}`, /must not start or end with spaces/],
    [`${SECRET}\n`, /must not start or end with spaces/],
  ]) {
    for (const mode of [vercelProd, { production: false, vercel: false }]) {
      assert.throws(
        () => adminProxySecret({ ADMIN_PROXY_SECRET: value }, mode),
        (error) => error instanceof Error && message.test(error.message) && !error.message.includes(value.trim()),
      );
    }
  }
});

test("on Vercel, the visitor's address (x-real-ip, set by Vercel) is passed on with the secret", () => {
  assert.deepEqual(forwardedClientHeaders(headersOf({ "x-real-ip": "203.0.113.7" }), SECRET, true), {
    [FORWARDED_IP_HEADER]: "203.0.113.7",
    [PROXY_SECRET_HEADER]: SECRET,
  });
  assert.equal(forwardedClientHeaders(headersOf({ "x-real-ip": "2001:db8::7" }), SECRET, true)[FORWARDED_IP_HEADER], "2001:db8::7");
});

test("nothing is passed on off Vercel, without a secret, or without a valid single address", () => {
  const visitor = headersOf({ "x-real-ip": "203.0.113.7" });
  assert.deepEqual(forwardedClientHeaders(visitor, SECRET, false), {}, "off Vercel the header could be forged");
  assert.deepEqual(forwardedClientHeaders(visitor, null, true), {}, "no secret");
  for (const value of ["not-an-ip", "203.0.113.7, 203.0.113.8", "", "999.1.1.1"]) {
    assert.deepEqual(forwardedClientHeaders(headersOf({ "x-real-ip": value }), SECRET, true), {}, value);
  }
  assert.deepEqual(forwardedClientHeaders(headersOf({ "x-forwarded-for": "203.0.113.7" }), SECRET, true), {}, "only x-real-ip is read");
});
