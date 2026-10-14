import assert from "node:assert/strict";
import { test } from "node:test";
import { PDF_MAX_BYTES, pdfFileProblem } from "./pdf-file.mjs";

const pdf = (size) => ({ size, type: "application/pdf" });

test("a PDF up to exactly 4 MB can be uploaded", () => {
  assert.equal(pdfFileProblem(pdf(1)), null);
  assert.equal(pdfFileProblem(pdf(PDF_MAX_BYTES)), null);
});

test("empty, oversized and non-PDF files are stopped before uploading, with a clear message", () => {
  assert.equal(pdfFileProblem(pdf(0)), "The file is empty.");
  assert.match(pdfFileProblem(pdf(PDF_MAX_BYTES + 1)), /the limit is 4 MB/);
  assert.match(pdfFileProblem(pdf(6 * 1024 * 1024)), /^This PDF is 6\.0 MB/);
  assert.equal(pdfFileProblem({ size: 100, type: "image/jpeg" }), "Choose a PDF file.");
  assert.equal(pdfFileProblem({ size: 100, type: "" }), "Choose a PDF file.");
});

test("4 MB plus the form's overhead stays under Vercel's 4.5 MB request limit", () => {
  // Measured 2026-10-14: a 4 MB upload through the admin form sends 4,194,645 bytes (341 bytes of overhead).
  assert.ok(PDF_MAX_BYTES + 64 * 1024 < 4.5 * 1000 * 1000);
});
