import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

const PUBLIC_ROUTES = ["/", "/merchants", "/auth/signin", "/auth/signup"];
const CUSTOMER_ROUTES = ["/dashboard"];
const MERCHANT_ROUTES = ["/merchant"];
const ADMIN_ROUTES = ["/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets and API routes that don't need auth checks in middleware
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/sw.js") ||
    pathname === "/manifest.json" ||
    pathname === "/offline.html" ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("booking_session")?.value;
  const session = await decrypt(sessionCookie);

  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  // Unauthenticated user tries to access protected route
  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (session) {
    // Redirect authenticated users away from auth pages
    if (pathname.startsWith("/auth/")) {
      const url = request.nextUrl.clone();
      if (session.role === "PLATFORM_ADMIN") url.pathname = "/admin";
      else if (session.role === "MERCHANT") url.pathname = "/merchant/dashboard";
      else url.pathname = "/merchants";
      return NextResponse.redirect(url);
    }

    // Role-based protection
    const needsAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
    const needsMerchant = MERCHANT_ROUTES.some((r) => pathname.startsWith(r));
    const needsCustomer = CUSTOMER_ROUTES.some((r) => pathname.startsWith(r));

    if (needsAdmin && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (needsMerchant && session.role !== "MERCHANT" && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/merchant/register", request.url));
    }

    if (needsCustomer && !session) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json|offline.html).*)",
  ],
};
