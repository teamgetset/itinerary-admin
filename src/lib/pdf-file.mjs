// @ts-check

/*
 * Itinerary PDFs go browser -> admin server (Vercel) -> API. Vercel refuses requests over 4.5 MB, so the API allows
 * PDFs up to 4 MB (the form adds a little). This check runs before uploading, so a file that would fail is never sent;
 * the API checks again, including the file's contents.
 */

export const PDF_MAX_BYTES = 4 * 1024 * 1024;

/**
 * What is wrong with a chosen file, or null when it can be uploaded.
 * @param {{ size: number, type: string }} file
 */
export function pdfFileProblem(file) {
  if (file.size === 0) return "The file is empty.";
  if (file.type !== "application/pdf") return "Choose a PDF file.";
  if (file.size > PDF_MAX_BYTES) {
    return `This PDF is ${(file.size / (1024 * 1024)).toFixed(1)} MB; the limit is 4 MB. Export it with compressed images and try again.`;
  }
  return null;
}
