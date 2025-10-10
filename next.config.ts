// next.config.ts
import type { NextConfig } from "next";

const BACKEND = (process.env.BACKEND_URL ?? "").replace(/\/+$/, ""); // sin slash final

const nextConfig: NextConfig = {
  async rewrites() {
    if (!BACKEND) {
      console.warn("⚠️ BACKEND_URL no definida. Sin rewrites /api → backend.");
      return [];
    }
    return [
      // Genérica: todo lo que empiece por /api/** va al backend
      { source: "/api/:path*", destination: `${BACKEND}/:path*` },

      // (Opcional) mapeos específicos si tu backend usa rutas distintas:
      // { source: "/api/login", destination: `${BACKEND}/_auth/login` },
    ];
  },
};

export default nextConfig;
