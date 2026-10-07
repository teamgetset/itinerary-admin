import { ApiError } from "./api";

/** What every server action returns to its form: success with data, or a message plus errors keyed by field path. */
export type ActionResult<T = unknown> =
  | { ok: true; data: T; message?: string }
  | { ok: false; message: string; fieldErrors: Record<string, string> };

/** Turns API errors into form errors; anything else (including redirects) is re-thrown. */
export async function attempt<T>(run: () => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run(), message };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    const fieldErrors: Record<string, string> = {};
    for (const detail of error.body.details ?? []) if (!(detail.path in fieldErrors)) fieldErrors[detail.path] = detail.message;
    return { ok: false, message: error.body.message, fieldErrors };
  }
}
