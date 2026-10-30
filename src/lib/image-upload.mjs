// @ts-check

/*
 * Images go browser -> admin server action (Vercel) -> API. Vercel refuses requests over 4.5 MB with a 413 that never
 * reaches the API, so photos over 4 MB are made smaller here first: at most 2560 px on the long side, re-encoded.
 * Smaller files are sent exactly as chosen. The API still checks every file (type from its bytes, 10 MB limit).
 */

export const IMAGE_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
export const IMAGE_MAX_DIMENSION = 2560;

export const UPLOAD_FAILED = "The upload did not go through. Check your connection and try again; if it keeps failing, reload the page.";

/**
 * The size to draw an image at: unchanged if it fits, else scaled down to fit, keeping its proportions.
 * @param {number} width
 * @param {number} height
 */
export function fitWithin(width, height, max = IMAGE_MAX_DIMENSION) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Redraws a photo to fit IMAGE_MAX_DIMENSION and re-encodes it: WebP where the browser can (keeps transparency),
 * else JPEG on white. Browser only. Throws or returns null when the browser cannot read or encode the file.
 * @param {File} file
 * @returns {Promise<File | null>}
 */
export async function shrinkImage(file) {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  /** @type {(type: string, quality: number) => Promise<Blob | null>} */
  const encode = (type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  let type = "image/webp";
  let blob = await encode(type, 0.85);
  if (blob?.type !== type) {
    // Safari cannot encode WebP. JPEG has no transparency, so paint white behind the picture first.
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    type = "image/jpeg";
    blob = await encode(type, 0.85);
  }
  if (blob && blob.size > IMAGE_UPLOAD_MAX_BYTES) blob = await encode(type, 0.7);
  if (!blob) return null;
  return new File([blob], `${baseName(file.name)}.${type === "image/webp" ? "webp" : "jpg"}`, { type });
}

/**
 * Uploads one image to the media library through `send` (the uploadMedia server action) and never throws:
 * a file that cannot be made small enough, a refused request (such as Vercel's 413) or a lost connection all come
 * back as a message to show next to the upload button, so the page and its unsaved edits stay as they were.
 * @template {{ ok: true } | { ok: false, message: string }} Result
 * @param {File} file
 * @param {(form: FormData) => Promise<Result>} send
 * @returns {Promise<Result | { ok: false, message: string }>}
 */
export async function uploadImage(file, send, shrink = shrinkImage) {
  let image = file;
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    const smaller = await shrink(file).catch(() => null);
    if (!smaller || smaller.size > IMAGE_UPLOAD_MAX_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      return { ok: false, message: `This image is ${mb} MB and could not be made smaller here. Save it under 4 MB (for example 2560 px on the long side) and try again.` };
    }
    image = smaller;
  }
  const form = new FormData();
  form.append("file", image);
  form.append("alt", baseName(file.name).replace(/[-_]+/g, " "));
  try {
    return await send(form);
  } catch {
    // An ended session still reaches the sign-in page: Next navigates on a server action redirect by itself.
    return { ok: false, message: UPLOAD_FAILED };
  }
}

/** @param {string} name */
const baseName = (name) => name.replace(/\.[^.]+$/, "");
