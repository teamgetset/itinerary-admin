import assert from "node:assert/strict";
import { test } from "node:test";
import { IMAGE_MAX_DIMENSION, IMAGE_UPLOAD_MAX_BYTES, UPLOAD_FAILED, fitWithin, uploadImage } from "./image-upload.mjs";

const MB = 1024 * 1024;
const image = (name, size, type = "image/jpeg") => new File([new Uint8Array(size)], name, { type });
const uploaded = { ok: true, data: { id: "m1" } };

/** A stand-in for the uploadMedia server action that records what it was sent. */
function recorder(reply = async () => uploaded) {
  const sent = [];
  const send = async (form) => {
    sent.push({ file: form.get("file"), alt: form.get("alt") });
    return reply();
  };
  return { send, sent };
}

const noShrink = async () => assert.fail("a file up to 4 MB must be sent as chosen");

test("images are fitted within 2560 px on the long side, keeping their proportions", () => {
  assert.deepEqual(fitWithin(6000, 4000), { width: 2560, height: 1707 });
  assert.deepEqual(fitWithin(3000, 4500), { width: 1707, height: 2560 });
  assert.deepEqual(fitWithin(5000, 5000), { width: 2560, height: 2560 });
  assert.deepEqual(fitWithin(12000, 10), { width: 2560, height: 2 });
  assert.deepEqual(fitWithin(40000, 10), { width: 2560, height: 1 });
  assert.deepEqual(fitWithin(IMAGE_MAX_DIMENSION, 1440), { width: 2560, height: 1440 });
  assert.deepEqual(fitWithin(1200, 800), { width: 1200, height: 800 });
});

test("an image up to exactly 4 MB is sent unchanged, with alt text from its name", async () => {
  for (const size of [1, 3 * MB, IMAGE_UPLOAD_MAX_BYTES]) {
    const file = image("kavaratti-lagoon_day-2.jpg", size);
    const { send, sent } = recorder();
    assert.deepEqual(await uploadImage(file, send, noShrink), uploaded);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].file.size, size);
    assert.equal(sent[0].file.name, file.name);
    assert.equal(sent[0].alt, "kavaratti lagoon day 2");
  }
});

test("a larger image is made smaller before it is sent; the alt text keeps the original name", async () => {
  const large = image("Agatti_beach.PNG", 9 * MB, "image/png");
  const smaller = image("Agatti_beach.webp", 900 * 1024, "image/webp");
  const shrunk = [];
  const { send, sent } = recorder();
  const result = await uploadImage(large, send, async (file) => (shrunk.push(file), smaller));
  assert.deepEqual(result, uploaded);
  assert.deepEqual(shrunk, [large]);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].file.name, "Agatti_beach.webp");
  assert.equal(sent[0].file.size, smaller.size);
  assert.equal(sent[0].alt, "Agatti beach");
});

test("a large image that cannot be made small enough is not sent, and says why", async () => {
  const large = image("raw-export.jpg", 6.2 * MB);
  const failures = [
    async () => null, // the browser could not encode it
    async () => { throw new DOMException("The source image could not be decoded.", "InvalidStateError"); },
    async () => image("still-big.jpg", IMAGE_UPLOAD_MAX_BYTES + 1),
  ];
  for (const shrink of failures) {
    const { send, sent } = recorder();
    const result = await uploadImage(large, send, shrink);
    assert.equal(result.ok, false);
    assert.match(result.message, /^This image is 6\.2 MB and could not be made smaller here\. Save it under 4 MB/);
    assert.equal(sent.length, 0);
  }
});

test("a refused or lost request (such as Vercel's 413) comes back as a message instead of crashing the page", async () => {
  const errors = [
    new Error("An unexpected response was received from the server."), // what Next throws for Vercel's 413
    new TypeError("Failed to fetch"),
    new Error("Server action not found."),
  ];
  for (const error of errors) {
    const { send } = recorder(async () => { throw error; });
    assert.deepEqual(await uploadImage(image("day-2.jpg", 2 * MB), send, noShrink), { ok: false, message: UPLOAD_FAILED });
  }
});

test("the API's own refusals are shown as the API words them", async () => {
  const refused = { ok: false, message: "Upload a JPEG, PNG, WebP or AVIF image", fieldErrors: {} };
  const { send } = recorder(async () => refused);
  assert.deepEqual(await uploadImage(image("photo.heic", 2 * MB, "image/heic"), send, noShrink), refused);
});

test("4 MB plus the form's overhead stays under Vercel's 4.5 MB request limit", () => {
  // The admin form adds a few hundred bytes (measured 341 for a 4 MB PDF on 2026-10-14); the alt field adds up to 250.
  assert.ok(IMAGE_UPLOAD_MAX_BYTES + 64 * 1024 < 4.5 * 1000 * 1000);
});
