import type { NextConfig } from "next";

const trim = (s?: string) => (s ?? "").replace(/\/+$/, "");
const BACKEND = trim(process.env.BACKEND_URL);
const BACKEND_DEV = trim(process.env.BACKEND_URL_DEV);
const DEV_FALLBACK = "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    const base =
      BACKEND ||
      BACKEND_DEV ||
      (process.env.NODE_ENV === "development" ? DEV_FALLBACK : "");

    if (!base) {
      console.warn("⚠️ Sin BACKEND_URL ni fallback. No se crean rewrites /api → backend.");
      return [];
    }
    return [{ source: "/api/:path*", destination: `${base}/:path*` }];
  },
};

export default nextConfig;
