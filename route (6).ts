import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, ADMIN_COOKIE, EMPRESA_COOKIE } from "./lib/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload || payload.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (pathname.startsWith("/portal") && !pathname.startsWith("/portal/login")) {
    const token = request.cookies.get(EMPRESA_COOKIE)?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload || payload.role !== "empresa") {
      return NextResponse.redirect(new URL("/portal/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
