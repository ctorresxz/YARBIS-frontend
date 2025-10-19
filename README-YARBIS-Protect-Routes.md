# README — Endurecimiento de Rutas y Sesiones (YARBIS)

## 0) Resumen ejecutivo
Protegimos la app para que **nadie pueda entrar a rutas internas sin autenticación**.  
Lo hicimos con **doble capa**:

1) **Middleware en Vercel (Edge)**: bloquea todo lo que no sea `/login`, estáticos o endpoints de auth; exige cookie `yarbis_session`.  
2) **SSR guard** en `app/(protected)` (Next.js App Router): si alguien saltara el middleware, en el **server** se vuelve a redirigir a `/login`.

Además:
- El backend (FastAPI en Railway) emite una **cookie httpOnly + Secure** con un **JWT** que **expira en 8 horas**.
- Deshabilitamos la exposición pública de `/logs` y dejamos un **endpoint seguro de descarga** `/_download/{subpath}`.
- Ajustamos fetch del FE para usar `credentials:"include"` y el **proxy /api → backend**.

---

## 1) Variables de entorno

### Vercel (Frontend)
- `BACKEND_URL = https://web-production-67c75.up.railway.app`
- `AUTH_SECRET = <cadena secreta> ` _(misma que en Railway)_  
  Sugerencia de secreto de ejemplo: `yarbis_2025_ProdSecret_!_k3Y9y2Zp`

### Railway (Backend)
- `AUTH_SECRET = <el mismo de Vercel>`
- `DOWNLOAD_TOKEN = <opcional>` (si quieres otra barrera para `/_download`)
- (Cualquier otra que ya tuvieras)

---

## 2) Cambios en el **Frontend** (Next.js – Vercel)

### 2.1 `middleware.ts` (nuevo en la raíz del repo)
- Bloquea todo lo que no sea `/login`, estáticos (`/_next`, `/favicon.ico`, etc.) y endpoints públicos de auth.
- Lee y **verifica** el JWT de la cookie `yarbis_session` con **`jose`** (`npm i jose`).
- Si no hay cookie válida → **redirección a `/login`**.

> Si ves “Cannot find module 'jose'”: instala `jose` y vuelve a desplegar.

### 2.2 `app/(protected)/layout.tsx` (nuevo)
- **SSR guard**: en el servidor, lee la cookie (`cookies()`) y si falta → `redirect("/login")`.
- Bajo `(protected)` viven tus páginas privadas:
  ```
  app/(protected)/menu/page.tsx
  app/(protected)/adjuntar/page.tsx
  app/(protected)/rango/page.tsx
  app/(protected)/manualtotal/page.tsx
  ...
  ```

> Si prefieres no mover carpetas: pon el mismo chequeo SSR dentro de cada `page.tsx` privada.

### 2.3 Componentes (ajustes mínimos)
- `components/MerakiLogin.tsx`: el `fetch("/api/login", …)` **con** `credentials:"include"` para que el navegador guarde la cookie httpOnly.
- `components/Merakimanualtotal.tsx`: el `fetch("/api/_manualtotal/manualtotal", …)` **con** `credentials:"include"`.
- `components/Merakirango.tsx`:
  - Descargas → usar proxy seguro:  
    ```ts
    a.href = `/api/_download/${encodeURIComponent(data.output_pdf)}`;
    a.href = `/api/_download/${encodeURIComponent(data.output_xlsx)}`;
    ```
  - Fetch a calendario/rango **con** `credentials:"include"`.

### 2.4 `next.config.ts`
- Reescritura única (ya OK):
  ```ts
  { source: "/api/:path*", destination: `${process.env.BACKEND_URL}/:path*` }
  ```
  Esto manda todo `GET/POST ... /api/**` al backend en Railway.

---

## 3) Cambios en el **Backend** (FastAPI – Railway)

### 3.1 `app.py`
- **No exponer `/logs`** públicamente: se **quitó** el `app.mount("/logs", ...)`.
- Se mantiene **descarga segura**:
  ```
  GET /_download/{subpath}
    - Confina a LOG_DIR
    - Sin listar índices
    - (Opcional) token en header X-Download-Token o query ?t=
  ```
- **CORS** habilitado con credenciales para el dominio de Vercel:
  ```py
  from fastapi.middleware.cors import CORSMiddleware
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["https://yarbis-frontend.vercel.app"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

### 3.2 `scripts/login.py`
- Tras validar credenciales:
  - Se **firma** un **JWT (HS256)** con `AUTH_SECRET`.
  - Se setea cookie **httpOnly + Secure + SameSite=Lax** con **expiración = 8 horas**.
- **Logout**: `POST /logout` borra la cookie.
- Dependencias: **PyJWT** (ej. `pip install PyJWT` o en `pyproject.toml`).

> Credenciales demo siguen siendo `admin` / `secreto` (cámbialas en prod).

---

## 4) Pruebas (checklist)

### 4.1 Navegador (Incógnito)
1. Ir a `https://yarbis-frontend.vercel.app/protected/menu` → **debe redirigir a `/login`**.
2. Hacer login (form del FE) → debe volver al menú privado sin errores.
3. DevTools → **Application → Cookies → yarbis_session**:
   - **HttpOnly ✓**
   - **Secure ✓**
   - **SameSite = Lax**
   - **Expires ≈ +8 horas** (columna **Expires / Max-Age**).

### 4.2 Network (para login)
- DevTools → **Network** → marca **Preserve log**, **Disable cache**.
- Click en la petición `POST /api/login`:
  - **Request**: `credentials: include` (verás la cookie después del primer login).
  - **Response Headers**: debe venir `Set-Cookie: yarbis_session=...; HttpOnly; Secure; Max-Age=28800`.

### 4.3 Descargas
- En Rango: al generar PDF/XLSX, las descargas deben salir desde  
  `https://yarbis-frontend.vercel.app/api/_download/...` → proxy hacia Railway.

---

## 5) Despliegue

### 5.1 Backend (Railway) — PowerShell
```powershell
git add app.py scripts/login.py
git commit -m "auth: JWT cookie 8h + logout + CORS + secure download; hide /logs"
git push origin main
```
> Railway hace el deploy automáticamente.

### 5.2 Frontend (Vercel) — PowerShell
```powershell
git add middleware.ts app/(protected)/layout.tsx components/MerakiLogin.tsx components/Merakimanualtotal.tsx components/Merakirango.tsx next.config.ts
git commit -m "auth(frontend): edge guard + SSR guard + credentials include + secure downloads"
git push origin main
```
> Vercel hace el deploy automáticamente.

---

## 6) Resolución de problemas

- **404 en `/protected/menu`**  
  La ruta debe existir como `app/(protected)/menu/page.tsx`. Si tu “menu” está fuera, muévelo o añade el guard SSR dentro de esa página.

- **No se crea cookie al loguear**  
  - En FE: el `fetch` del login **debe** llevar `credentials:"include"`.  
  - En BE: la respuesta **debe** traer `Set-Cookie` con `HttpOnly; Secure; SameSite=Lax; Max-Age=28800`.  
  - En CORS: `allow_credentials=True` y `allow_origins` contiene tu dominio exacto de Vercel.

- **`Cannot find module 'jose'`**  
  `npm i jose` y vuelve a desplegar.

- **Expiración no es 8h**  
  Asegura que en `login.py` el JWT tiene `exp = now + 8h` **y** la cookie usa `max_age=28800`. Borra cookies y reintenta.

- **Redirección no ocurre**  
  Revisa `middleware.ts` (lista de públicos) y que `AUTH_SECRET` esté configurado en **Vercel** y **Railway** con **el mismo valor**.

---

## 7) Recomendación extra (endurecer el backend)
Ya bloqueamos FE, pero para blindar del todo:
- Añade en FastAPI una **Dependencia** que lea `yarbis_session`, verifique el **JWT** con `AUTH_SECRET` y **proteja** endpoints sensibles (datos, reportes).
- Mantén `DOWNLOAD_TOKEN` en `/_download` si compartes enlaces.

Si quieres, te paso el **snippet** de dependencia JWT para FastAPI cuando lo vayas a integrar.

---

## 8) Qué archivos tocamos hoy (resumen)

**Frontend**
- `middleware.ts` (nuevo)
- `app/(protected)/layout.tsx` (nuevo)
- `components/MerakiLogin.tsx` (credentials include)
- `components/Merakimanualtotal.tsx` (endpoint + credentials include)
- `components/Merakirango.tsx` (descargas via `/_download` + credentials include)
- `next.config.ts` (verificado rewrite /api)

**Backend**
- `app.py` (CORS + **quitamos** mount público `/logs` + `/_download` seguro)
- `scripts/login.py` (JWT 8h, cookie httpOnly/Secure, `POST /logout`)

---

## 9) Cómo saber que “ya quedó”
- Si entras a `/protected/menu` **sin** cookie → te manda a **/login**.
- Si haces login → ves el **menú** y la cookie `yarbis_session` con **HttpOnly, Secure, Lax** y **Expires ≈ +8h**.
- Si borras la cookie → cualquier ruta privada vuelve a `/login`.
- Descargas ahora pasan por `/api/_download/...` (sin listar directorios).
