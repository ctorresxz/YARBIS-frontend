// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Debe coincidir con el backend
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-change-me");

// Prefijos de API públicos que NO pasan por auth
const PUBLIC_API_PREFIXES = [
  "/api/buscar",
  "/api/_buscar",
  "/api/_download",
  "/api/_auth/login",
  "/api/_auth/logout",
  "/api/_auth/refresh",
];

function isPublic(path: string) {
  if (path === "/" || path === "/login") return true;

  // APIs públicas
  if (PUBLIC_API_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    return true;
  }

  // Estáticos/Next assets
  if (path.startsWith("/_next")) return true;
  if (path === "/favicon.ico" || path === "/robots.txt" || path === "/sitemap.xml") return true;

  const assetExt = [
    ".png",".jpg",".jpeg",".gif",".svg",".webp",".ico",
    ".css",".js",".txt",".map",".woff",".woff2",".ttf",
  ];
  if (assetExt.some((ext) => path.endsWith(ext))) return true;

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // BYPASS en desarrollo
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // Público
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Protegido: requiere cookie
  const token = req.cookies.get("yarbis_session")?.value;
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    res.cookies.set("yarbis_session", "", { path: "/", maxAge: 0 });
    return res;
  }
}

// Aplica a todo salvo assets de Next (la API pasa por aquí, pero será pública si coincide con PUBLIC_API_PREFIXES)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
