// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "yarbis_session";
const LOGIN_PATH = "/login";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas públicas
  if (
    pathname === LOGIN_PATH ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // Rutas protegidas: requieren cookie de sesión
  const hasSession = req.cookies.get(SESSION_COOKIE)?.value;
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Aplica a todo excepto assets conocidos (el guard decide si es pública o protegida)
export const config = {
  matcher: ["/((?!_next|static|images|favicon.ico|robots.txt|sitemap.xml).*)"],
};
