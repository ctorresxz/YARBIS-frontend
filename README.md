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

---

## /adjuntar – Registro de desprendibles de pago (Merakiadjuntar)

**Archivo:** `components/Merakiadjuntar.tsx`  
**Wrapper de página:** `app/adjuntar/page.tsx`

### Qué hace

- **Formulario “Registro desprendibles de pago”** con campos: **Nombre**, **Correo**, **Número de personas**, **Producto**, **Sucursal**.
- **Persistencia local** en `localStorage` (se repueblan los campos al recargar).
- **Validaciones**:
  - Archivo obligatorio (PNG/JPG/JPEG/GIF/PDF, máx **15 MB**).
  - Nombre / Producto / Sucursal obligatorios.
  - Número de personas `>= 1`.
- **Dropzone** (click, _drag & drop_ y **paste** de imagen/PDF).
- **Toast de éxito** “Archivo adjuntado” (emerge cuando el archivo pasa validación).
- **Acciones**:
  - **Procesar** → `POST /api/_read/lectura` con `FormData(file, meta)`  
    - Si la validación es automática (`validacion: "automatica"` o `status: "ok"`), registra en log y lanza **Datos** (`/api/_datos/datos?source=auto`) con `X-Correlation-Id`.
    - Si hay `verification_failed` con `file`, redirige al **flujo manual** (pendiente de ruta).
    - Manejo de errores: traza de texto y cuadro de error accesible (`role="alert"`).
  - **Proceso manual** (log + TODO `router.push('/manualtotal')`).
  - **Informe** (log + TODO `router.push('/rango')`).
  - **Reiniciar**: borra caché local y limpia el estado.
  - **Atrás**: `router.push('/menu')`.
  - **Cerrar sesión**: limpia `localStorage` + `sessionStorage` y `router.push('/login')`.
- **Panel de “Verificación de tareas”** con tarjeta (estilo Meraki) que contiene:
  - **Log incremental** (prepende mensajes con hora).
  - **Tasks** con entradas por proceso (`<h3>Proceso HH:MM:SS</h3><pre>…</pre>`).

> **Nota de diseño:** se centraron las secciones **Dropzone**, **grupo de botones** y **panel de verificación**, conservando la responsividad original.

### Endpoints (vía proxy `/api/...`)

- `GET /api/_adj/product-options` – llena el `<select>` de **Producto** (con _fallback_ local si falla).
- `POST /api/_read/lectura` – procesa el archivo (multiparte).
- `POST /api/_datos/datos?source=auto` – “Datos: JSON unificado” (se invoca tras éxito de lectura).

### Tipo de retorno y _case-sensitive_ (importante para Vercel/TS)

- Se tipó explícitamente la firma del componente para evitar el error _“cannot be used as a JSX component”_:

```tsx
// components/Merakiadjuntar.tsx
export default function Merakiadjuntar(): JSX.Element {
  // ...
}
```

- En **`app/adjuntar/page.tsx`** importa respetando el **casing exacto del archivo** (Linux/Vercel es _case-sensitive_):

```tsx
import Merakiadjuntar from "@/components/Merakiadjuntar";

export default function Page() {
  return (
    <div className="p-4">
      <Merakiadjuntar />
    </div>
  );
}
```

### UX: toasts y tarjeta informativa

- **Toast éxito** (archivo adjuntado): se muestra ~2.2 s y contiene el **nombre del archivo**.
- **Tarjeta “Verificación de tareas” (azul)**: integra el log **existente** y no cambia tu _wiring_, solo el _wrapper_ visual.

### Reglas de negocio clave

- **Validación de archivo**:
  - Mime permitido: `image/png`, `image/jpeg`, `image/jpg`, `image/gif`, `application/pdf`.
  - Tamaño: `<= 15 * 1024 * 1024` bytes.
- **Validación de formulario** (antes de enviar):
  - `archivoListo && nombre && producto && sucursal && numero >= 1`.

### Errores y _retry_ controlado

- Cuando `POST /api/_datos/datos?source=auto` devuelve **404** justo después de la lectura, se hace **un reintento** tras 600 ms (esperando a que el backend termine su pipeline).
- Errores de red y de API se **registran en el log** y en un **banner accesible** (`role="alert"`).

### Accesibilidad

- `aria-live="polite"` en mensajes y log para lectores de pantalla.
- Botones deshabilitan acciones mientras `sending=true`.
- Dropzone navegable con teclado (`Enter`/`Space` dispara `<input type="file">`).

### Estructura de UI (resumen de secciones)

1. **Brand** (logo centrado).
2. **Card Datos** – título: **“Registro desprendibles de pago”**.
3. **Card Dropzone** – “Adjuntar o pegar imagen de pago”.
4. **Card Acciones** – grupo de 3 (Procesar / Proceso manual / Informe) + grupo “sin color” (Reiniciar / Atrás / Cerrar sesión).
5. **Card Verificación de tareas** – tarjeta azul con log y _tasks_.

### Troubleshooting específico de /adjuntar

- **TS2786 / “cannot be used as a JSX component”**  
  Asegúrate de **declarar** `(): JSX.Element` y de **importar con el mismo casing** que el archivo.

- **“Cannot find namespace 'JSX'”**  
  Verifica que `tsconfig.json` tenga `"jsx": "preserve"` y `lib` incluya `"dom"`.

- **Vercel (Linux) vs Windows (local)**  
  - Cualquier diferencia de mayúsculas/minúsculas en nombres de archivo **rompe el build** en Vercel.  
  - Los avisos **CRLF/LF** son benignos; Git normaliza.

- **Adjuntar por _paste_ no reacciona**  
  Debes enfocar la **dropzone** (label) y pegar; solo acepta `image/*` o `application/pdf`.

### Comandos Git sugeridos (cuando toques /adjuntar)

```bash
# trabajar en rama feature
git checkout -b feat/adjuntar-ui

# añadir cambios
git add components/Merakiadjuntar.tsx app/adjuntar/page.tsx public/

# commit con convención
git commit -m "feat(adjuntar): UI de registro, dropzone, toasts y verificación de tareas"

# (si renombraste por casing)
git mv components/merakiadjuntar.tsx components/Merakiadjuntar.tsx
git commit -m "chore(adjuntar): enforce exact casing for Merakiadjuntar"

# subir
git push -u origin feat/adjuntar-ui
```

### Roadmap corto de /adjuntar

- Conectar **Proceso manual** e **Informe** con sus rutas reales (`router.push`).
- Añadir **guard de sesión** (middleware o verificación en el componente).
- Confirmación visual al terminar **Datos** (cuando `triggerDatosAfterLectura` finaliza).
