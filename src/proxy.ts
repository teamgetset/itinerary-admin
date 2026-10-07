import { NextResponse, type NextRequest } from "next/server";

/**
 * Sends visitors without a session cookie to the sign-in page. This is only a convenience redirect:
 * whether the session is valid, and what the user may do, is decided by the API on every request.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("getset_admin_session")) {
    const login = new URL("/login", request.url);
    if (request.nextUrl.pathname !== "/") login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next/|favicon.ico|icon.png).*)"],
};
