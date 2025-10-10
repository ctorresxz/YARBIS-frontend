# YARBIS Frontend — README de configuración (Next.js + Vercel)

Guía breve para entender **qué archivos se crean o editan** al configurar **Tailwind v4**, **DaisyUI** y el **proxy** (Vercel ⇄ Railway), y qué pasa si **no** usas alguna librería.

---

## 0) Estructura base (sin Tailwind/DaisyUI)
**Siempre presentes en un proyecto Next.js (TS):**
- `app/` → páginas y rutas (App Router).
  - `app/layout.tsx` → layout global.
  - `app/page.tsx` → página raíz.
- `public/` → archivos estáticos.
- `package.json` / `package-lock.json` → dependencias y scripts.
- `tsconfig.json` → configuración TypeScript.
- `next.config.ts` → configuración Next (opcional, aquí se define el **proxy**).
- `next-env.d.ts` → tipos generados por Next (auto).

> Si **no** usas Tailwind/DaisyUI, **no** necesitas sus archivos de configuración.

---

## 1) Añadir Tailwind CSS v4
**Instalar dev-deps (si faltan):**
```bash
npm i -D tailwindcss @tailwindcss/postcss postcss autoprefixer
```

**Archivos que se crean/ajustan:**
1) `postcss.config.js`  
   ```js
   module.exports = { plugins: { "@tailwindcss/postcss": {} } };
   ```
2) `tailwind.config.mjs`  
   ```ts
   /** @type {import('tailwindcss').Config} */
   export default {
     content: [
       "./app/**/*.{js,ts,jsx,tsx,mdx}",
       "./components/**/*.{js,ts,jsx,tsx,mdx}",
       "./pages/**/*.{js,ts,jsx,tsx,mdx}",
     ],
     theme: { extend: {} },
     plugins: [], // <- DaisyUI se agrega en la sección 2
   };
   ```
3) `app/globals.css`  
   ```css
   @import "tailwindcss";
   /* estilos globales opcionales */
   ```

> **Nota:** usa **solo** `tailwind.config.mjs` (ESM). Si existe un `tailwind.config.js` duplicado, elimínalo para evitar choques.

---

## 2) Añadir DaisyUI (sobre Tailwind)
**Instalar:**
```bash
npm i -D daisyui
```

**Archivos que se crean/ajustan:**
1) `tailwind.config.mjs` → agregar el plugin y temas
   ```ts
   import daisyui from "daisyui";

   export default {
     content: [
       "./app/**/*.{js,ts,jsx,tsx,mdx}",
       "./components/**/*.{js,ts,jsx,tsx,mdx}",
       "./pages/**/*.{js,ts,jsx,tsx,mdx}",
     ],
     theme: { extend: {} },
     plugins: [daisyui],
     daisyui: { themes: ["corporate", "light", "dark"] },
   };
   ```
2) **Tipos para TS (recomendado):** `types/daisyui.d.ts`
   ```ts
   declare module "daisyui";
   ```
3) (Opcional) `app/layout.tsx` → setear tema
   ```tsx
   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="es" data-theme="corporate">
         <body>{children}</body>
       </html>
     );
   }
   ```

> Si **no** usas DaisyUI**, no crees `types/daisyui.d.ts` ni agregues el plugin a Tailwind.

---

## 3) Proxy Vercel ⇄ Railway (evitar CORS y ocultar backend)

### Opción A — `next.config.ts` (rewrites)
**Archivos que se crean/ajustan:**
- `next.config.ts`
  ```ts
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    async rewrites() {
      return [
        { source: "/api/:path*", destination: "https://web-production-67c75.up.railway.app/:path*" },
      ];
    },
  };
  export default nextConfig;
  ```
Usa `fetch('/api/...')` en el frontend; Vercel reenvía a Railway.

### Opción B — API Route (proxy por endpoint)
**Archivos que se crean/ajustan:**
- `app/api/login/route.ts`
  ```ts
  export async function POST(req: Request) {
    const form = await req.formData();
    const r = await fetch(process.env.BACKEND_URL + "/_auth/login", { method: "POST", body: form });
    return new Response(await r.text(), { status: r.status });
  }
  ```
- Variables en Vercel → `BACKEND_URL=https://web-production-67c75.up.railway.app`

> Si **no** necesitas comunicarte con el backend, **no** agregues proxy.

---

## 4) Matriz rápida — “Si activo X, se crean/ajustan Y”

| Feature/Librería | Archivos nuevos | Archivos editados |
|---|---|---|
| **Tailwind v4** | `postcss.config.js`, `tailwind.config.mjs` | `app/globals.css` (`@import "tailwindcss";`) |
| **DaisyUI** | `types/daisyui.d.ts` | `tailwind.config.mjs` (plugin+themes), `app/layout.tsx` (tema opcional) |
| **Proxy (rewrites)** | — | `next.config.ts` |
| **Proxy (API Route)** | `app/api/<ruta>/route.ts` | — |

> Sin Tailwind/DaisyUI → **no** existen sus archivos.  
> Sin backend/Proxy → `next.config.ts` puede quedar sin rewrites.

---

## 5) Comandos útiles
**Desarrollo:**
```bash
npm run dev
```
**Build local:**
```bash
npm run build && npm run start
```
**Git (ejemplo):**
```bash
git add .
git commit -m "chore: setup tailwind+daisyui y proxy rewrites"
git push origin main
```

---

## 6) Notas y buenas prácticas
- Evita duplicar `tailwind.config.js` y `tailwind.config.mjs`: **usa solo** el `.mjs` (ESM).
- En Vercel define variables en **Project Settings → Environment Variables** (Production/Preview/Development).
- El frontend **no** persiste archivos ni corre cron jobs: esa lógica queda en Railway.
- Puedes crear **rutas puente** (`app/adjuntar/page.tsx`) que redirijan temporalmente a HTML del backend mientras migras UI.

---

**Listo.** Este README indica **qué archivos nacen o se tocan** al activar Tailwind, DaisyUI y Proxy, y **qué no existe** si no usas esas librerías.
