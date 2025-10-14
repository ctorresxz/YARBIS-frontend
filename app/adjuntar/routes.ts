// Centralización de rutas de la app y endpoints del proxy
// Stack: Next.js (App Router), TypeScript
// Nota: mantener solo rutas relativas para pasar por el proxy de Next (/api/:path* -> ${BACKEND_URL}/:path*)

export const ROUTES = {
  ADJUNTAR: "/adjuntar",
  LOGIN: "/login",
  MENU: "/menu",
  // TODO: agrega más vistas si las necesitas
} as const;

export const API = {
  LECTURA: "/api/_read/lectura",
  DATOS: "/api/_datos/datos",
  PRODUCT_OPTIONS: "/api/_adj/product-options",
  // TODO: agrega otros endpoints cuando estén listos
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
export type ApiRoute = typeof API[keyof typeof API];
