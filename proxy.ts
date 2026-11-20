import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/api/health", "/robots.txt"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/_next"))) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/admin/reset")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/")) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const session = await getSessionFromRequest(request);
  if (!session && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (session && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};