// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Usa el mismo secreto que firma el backend (Railway)
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-change-me");

// Prefijos de API públicos que NO deben pasar por autenticación del middleware
const PUBLIC_API_PREFIXES = [
  "/api/buscar",
  "/api/_download",
  "/api/_auth/login",
  "/api/_auth/logout",
  "/api/_auth/refresh",
];

// Rutas/recursos públicos (no requieren cookie)
function isPublic(path: string) {
  if (path === "/" || path === "/login") return true;

  // APIs públicas
  if (PUBLIC_API_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    return true;
  }

  // Estáticos y assets
  if (path.startsWith("/_next")) return true;
  if (path === "/favicon.ico" || path === "/robots.txt" || path === "/sitemap.xml") return true;
  const assetExt = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".css", ".js", ".txt", ".map"];
  if (assetExt.some((ext) => path.endsWith(ext))) return true;

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ⬇️ BYPASS SOLO EN DESARROLLO (Opción 1). No afecta producción.
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // Deja pasar lo público
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Requiere cookie
  const token = req.cookies.get("yarbis_session")?.value;
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Valida firma y expiración del JWT
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

// Aplica el middleware a todo salvo assets estáticos de Next.
// export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"] };
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
