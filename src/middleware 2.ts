import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_API_PATHS = ["/api/auth/login"];

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$/) !== null
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_API_PATHS.includes(pathname)) {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (pathname === "/login" && token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
