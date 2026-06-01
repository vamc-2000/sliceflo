// middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/auth", "/logout"]; // include "/"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files
  if (/\.(.*)$/.test(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("authToken")?.value ?? null;

  // Public paths are always allowed; client-side decides routing
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For other routes, require authentication
  if (!token) {
    // Note: Store reset (resetAllStores) is handled client-side in AuthProvider.tsx
    // when it detects a missing or invalid session on a protected route.
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};