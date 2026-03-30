import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/parent", "/teacher", "/admin"];
const PUBLIC_ROUTES = ["/login", "/signup"];
const PUBLIC_API_PREFIX = "/api/auth";

const ROLE_DASHBOARD: Record<string, string> = {
  parent: "/parent/dashboard",
  teacher: "/teacher/dashboard",
  admin: "/admin/dashboard",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public API routes through
  if (pathname.startsWith(PUBLIC_API_PREFIX)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("__session")?.value;
  const roleCookie = request.cookies.get("__role")?.value;

  // If user is authenticated and hits / or /login, redirect to their dashboard
  if (sessionCookie && (pathname === "/" || PUBLIC_ROUTES.includes(pathname))) {
    const dashboard =
      roleCookie && ROLE_DASHBOARD[roleCookie]
        ? ROLE_DASHBOARD[roleCookie]
        : "/parent/dashboard";
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // Check if the route is protected
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
