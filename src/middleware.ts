import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { hasValidSession, SESSION_COOKIE } from "@/lib/auth/session";

export function middleware(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = request.nextUrl;
  const authenticated = hasValidSession(session);

  const protectedRoute = pathname.startsWith("/app") || pathname === "/dashboard";

  if (protectedRoute && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && authenticated) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/dashboard", "/login"]
};
