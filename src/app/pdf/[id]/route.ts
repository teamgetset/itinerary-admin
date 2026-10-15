import { apiFetch, sessionToken } from "@/lib/api";
import { pdfVersionPath } from "@/lib/pdf-file.mjs";

/**
 * Streams one version of a package's uploaded itinerary PDF to a signed-in admin, for checking before or after
 * publishing: ?version=without-logo, otherwise the one with the logo.
 */
export async function GET(request: Request, { params }: RouteContext<"/pdf/[id]">) {
  const { id } = await params;
  const token = await sessionToken();
  if (!token) return new Response("Sign in first", { status: 401 });
  const path = pdfVersionPath(new URL(request.url).searchParams.get("version") ?? "with-logo");
  if (path === null) return new Response("Unknown PDF version", { status: 404 });

  const response = await apiFetch(`/admin/packages/${encodeURIComponent(id)}/itinerary-pdf${path}`, {}, token);
  if (!response.ok) {
    const message = response.status === 404 ? "This package has no itinerary PDF of this version yet" : response.status === 401 ? "Sign in again" : "Could not load the PDF";
    return new Response(message, { status: response.status });
  }
  return new Response(response.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": response.headers.get("content-disposition") ?? "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
