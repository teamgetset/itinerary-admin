import { apiFetch, sessionToken } from "@/lib/api";

/** Streams a package's uploaded itinerary PDF to a signed-in admin, for checking before or after publishing. */
export async function GET(_request: Request, { params }: RouteContext<"/pdf/[id]">) {
  const { id } = await params;
  const token = await sessionToken();
  if (!token) return new Response("Sign in first", { status: 401 });

  const response = await apiFetch(`/admin/packages/${encodeURIComponent(id)}/itinerary-pdf`, {}, token);
  if (!response.ok) {
    const message = response.status === 404 ? "This package has no itinerary PDF yet" : response.status === 401 ? "Sign in again" : "Could not load the PDF";
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
