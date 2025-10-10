# YARBIS Frontend (Next.js + Vercel)
**SPA Frontend con proxy a Backend en Railway**

Este README resume todo lo que hemos montado para que cualquier persona (o “futuro chat”) pueda continuar el proyecto sin perder contexto.

---

## 1) Stack y Arquitectura

- **Frontend:** Next.js (App Router) + TypeScript  
- **UI:** Tailwind CSS v4 + DaisyUI  
- **Hosting:** Vercel (Production)  
- **Backend:** FastAPI/Flask (u otro) desplegado en **Railway**  
- **Comunicación FE→BE:** **Proxy de Vercel/Next**  
  - El frontend **nunca** llama la URL absoluta del backend.  
  - Usa rutas **relativas** `/api/...` y Next reescribe a `BACKEND_URL`.

**Diagrama**

```
Browser ──(fetch /api/... )──► Next (Vercel)
                 │
                 └─ rewrites ►  BACKEND_URL/:path*  (Railway)
```

---

## 2) Variables de entorno

Archivo local: **`.env.local`** (no se versiona)  
Vercel (Production y Preview): *Project → Settings → Environment Variables*

**Obligatoria**
```bash
BACKEND_URL=https://<TU_BACKEND>.up.railway.app
```

**Opcionales**
```bash
NEXT_PUBLIC_SITE_NAME=YARBIS
```

> **Nota:** En Vercel agrega **BACKEND_URL** en *Production* (y *Preview* si aplica) y redeploy.

---

## 3) Arranque rápido

Requisitos: **Node 18+** (o 20+), **npm**

```bash
# 1) Clonar
git clone https://github.com/ctorresxz/YARBIS-frontend.git
cd YARBIS-frontend

# 2) Instalar
npm install

# 3) Variables de entorno
cp .env.example .env.local     # si no existe, crea .env.local a mano
# y edita BACKEND_URL

# 4) Dev
npm run dev

# 5) Build/Prod local
npm run build
npm start
```

---

## 4) Archivos y carpetas clave

```
app/
  layout.tsx        # Layout raíz (importa globals.css, data-theme="corporate")
  page.tsx          # Home (redirige a /login)
  login/page.tsx    # Página /login (wrapper que importa el componente de UI)

components/
  MerakiLogin.tsx   # Componente de UI + lógica mínima de login

public/             # Estáticos

types/
  daisyui.d.ts      # Declaración de módulo "daisyui" (TypeScript)

app/globals.css     # Tailwind v4 (usa @import "tailwindcss")
tailwind.config.mjs # Config Tailwind (ESM) + DaisyUI
postcss.config.js   # PostCSS (usa @tailwindcss/postcss)
next.config.ts      # **Proxy (rewrites)** /api/:path* -> BACKEND_URL/:path*
tsconfig.json       # Config TS (incluye .d.ts, alias @/*)
```

**`next.config.ts`**

```ts
// next.config.ts
const BACKEND = process.env.BACKEND_URL;

const nextConfig: import("next").NextConfig = {
  async rewrites() {
    if (!BACKEND) {
      console.warn("⚠️  BACKEND_URL no definida. Sin rewrites /api -> backend.");
      return [];
    }
    return [
      { source: "/api/:path*", destination: `${BACKEND}/:path*` },
    ];
  },
};

export default nextConfig;
```

**`tsconfig.json` (estable)**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "**/*.d.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**`tailwind.config.mjs` (ESM + DaisyUI)**
```js
import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{ts,tsx,js,jsx,mdx}", "./components/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: { extend: {} },
  plugins: [daisyui],
  daisyui: { themes: ["corporate", "light", "dark"] }
};
```

**`postcss.config.js`**
```js
module.exports = { plugins: { "@tailwindcss/postcss": {} } };
```

---

## 5) Cómo está implementado el Login

- UI y lógica mínima en **`components/MerakiLogin.tsx`**.  
- El wrapper de página es **`app/login/page.tsx`**, que simplemente importa el componente:

```tsx
// app/login/page.tsx
import MerakiLogin from "@/components/MerakiLogin";
export default function LoginPage() {
  return <MerakiLogin />;
}
```

- El componente hace `fetch` a **ruta relativa** (pasa por proxy).  
  En nuestro caso actual, **`/api/_auth/login`** con JSON `{ username, password }`, y al éxito `router.push("/adjuntar")`.

> Si tu backend espera **`usuario`/`password`** en lugar de `username`/`password`, cambia los `name` de los inputs y el payload del `fetch` a esos nombres.

---

## 6) Crear nuevas pantallas (receta 2 archivos)

Para cada ruta (por ejemplo, **`/adjuntar`**):

1) **Componente de UI + lógica**  
`components/Adjuntar.tsx`
```tsx
"use client";
export default function Adjuntar() {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await fetch("/api/adjuntar", { method: "POST", body: new FormData(e.currentTarget) });
    if (!res.ok) { /* mostrar error */ return; }
    // opcional: router.push("/siguiente")
  }
  return (
    <form onSubmit={onSubmit} className="p-6">
      {/* ...tus campos... */}
      <button className="btn btn-primary">Subir</button>
    </form>
  );
}
```

2) **Wrapper de página (App Router)**  
`app/adjuntar/page.tsx`
```tsx
import Adjuntar from "@/components/Adjuntar";
export default function Page() { return <Adjuntar />; }
```

> **No toques `next.config.ts`** si usas rutas **/api/...**; ya pasan por el proxy.

---

## 7) Integrar plantillas HTML externas (workflow)

1. Copia el HTML (MerakiUI, Flowbite, etc.).  
2. Pégalo dentro de un **componente cliente**:  
   - `"use client"` arriba.  
   - Cambia `class` → `className`. Cierra tags en JSX.  
3. Si hay formulario/botón:  
   - `onSubmit/onClick` y `fetch("/api/tu-endpoint", {...})`.  
   - **Rutas relativas** para usar el proxy.  
   - Si el backend espera `multipart/form-data`, usa `new FormData(form)`.  
   - Si espera JSON, usa `headers: {'Content-Type':'application/json'}` y `JSON.stringify(...)`.  
4. Envuelve el componente en `app/<ruta>/page.tsx`.

---

## 8) Despliegue en Vercel

1. **Connect Repo** (GitHub → Vercel).  
2. **Environment Variables** → agrega `BACKEND_URL` en *Production* (y *Preview* si aplica).  
3. Build & Output: Vercel detecta Next.js (`npm install`, `npm run build`).  
4. Cada `git push` a `main` despliega **Production**. Otras ramas → **Preview**.

---

## 9) Buenas prácticas

- **No** versionar `.env*` (ya está en `.gitignore`).  
- Mantener **`.env.example`** con claves vacías para referencia.  
- Cuidado con **nombres de archivo** (case-sensitive en Vercel).  
- Evitar hardcodear la URL del backend: **usa `BACKEND_URL` + rutas relativas**.  
- No exponer tokens/secretos en el frontend.

---

## 10) Troubleshooting

- **“An issue occurred while parsing a tsconfig.json file”**  
  - Usar el `tsconfig.json` de arriba (JSON válido).  
  - Borrar `.next/` y `*.tsbuildinfo` y reintentar:
    ```bash
    # PowerShell (Windows)
    Remove-Item -Recurse -Force .\.next, .\tsconfig.tsbuildinfo
    npm run dev
    ```

- **“BACKEND_URL no definida. Sin rewrites /api -> backend.”**  
  - Crea/edita `.env.local` con `BACKEND_URL=...` y reinicia `npm run dev`.

- **CORS/401/404**  
  - Usa **rutas relativas** `/api/...`.  
  - Verifica que el endpoint real exista en Railway.  
  - Asegura nombres de campos correctos (`username/password` vs `usuario/password`).

- **CRLF/LF warnings en Windows**: benignos; Git los normaliza.

---

## 11) Roadmap

- **/adjuntar** (subida de archivos) con validaciones y toasts.  
- **Sesiones/Protección de rutas** (guardar token, middleware App Router).  
- **Speed Insights / Analytics** de Vercel (opcionales).  
- **CI/CD** con checks (lint, type-check).

---

## 12) Scripts

```bash
npm run dev     # desarrollo
npm run build   # build
npm start       # servir build local
```

---

## 13) Decisiones clave

- **Proxy por rewrites** para ocultar la URL de Railway y evitar CORS.  
- **Rutas relativas** `/api/...` **en todo el frontend**.  
- **Component-first**: cada página = 2 archivos (componente en `components/` + wrapper en `app/<ruta>/page.tsx`).  
- **Tailwind v4 + DaisyUI** como base de estilos.  
- **TypeScript** estricto y alias `@/*`.
