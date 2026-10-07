import { apiFetch, sessionToken } from "@/lib/api";

/** Streams a generated PDF version to a signed-in admin, for checking before or after publishing. */
export async function GET(_request: Request, { params }: RouteContext<"/pdf/[id]/[version]/[branding]">) {
  const { id, version, branding } = await params;
  const token = await sessionToken();
  if (!token) return new Response("Sign in first", { status: 401 });
  if (!/^\d+$/.test(version) || !["with-logo", "without-logo"].includes(branding)) return new Response("Not found", { status: 404 });

  const response = await apiFetch(`/admin/packages/${encodeURIComponent(id)}/pdf/${version}/${branding}`, {}, token);
  if (!response.ok) return new Response(response.status === 404 ? "This PDF version does not exist" : "Could not load the PDF", { status: response.status });
  return new Response(response.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": response.headers.get("content-disposition") ?? "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
