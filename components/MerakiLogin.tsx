// === 1. Comentario inicial ===
// Componente de Login principal de la aplicación YARBIS
// Encargado de autenticar usuarios y redirigir al menú principal.

// === 2. Importaciones ===
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// === 3. Inicialización de hooks/estado ===
export default function MerakiLogin() {
  const router = useRouter();
  const [status, setStatus] = useState<{ msg: string; kind: "ok" | "err" | "warn" | "" }>({ msg: "", kind: "" });
  const [loading, setLoading] = useState(false);

  // === 4. Funciones internas ===
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const username = (form.username as any).value.trim();
    const password = (form.password as any).value.trim();

    if (!username || !password) {
      setStatus({ msg: "Usuario y contraseña son obligatorios.", kind: "err" });
      return;
    }

    setLoading(true);
    setStatus({ msg: "Enviando...", kind: "warn" });

    try {
      const res = await fetch("/api/_auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const ct = res.headers.get("content-type") || "";
      const isJson = ct.includes("application/json");
      const data = isJson ? await res.json() : {};

      if (res.status === 200) {
        setStatus({ msg: data.message || "Login exitoso", kind: "ok" });
        router.push("/menu");
        return;
      }

      if (res.status === 401) {
        setStatus({ msg: data.message || "Credenciales inválidas", kind: "err" });
        return;
      }

      if (res.status === 422) {
        const d = data.details || data.message || "Entrada inválida";
        setStatus({ msg: typeof d === "string" ? d : JSON.stringify(d, null, 2), kind: "err" });
        return;
      }

      if (res.status === 429) {
        setStatus({ msg: data.message || "Demasiados intentos. Intenta más tarde.", kind: "warn" });
        return;
      }

      setStatus({ msg: `Error ${res.status}: ${data.message || "Solicitud fallida"}`, kind: "err" });
    } catch {
      setStatus({ msg: "No se pudo conectar con la API.", kind: "err" });
    } finally {
      setLoading(false);
    }
  }

  // === 5. Bloque principal (JSX) ===
  return (
    <section className="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
      <div className="container px-6 py-16 mx-auto lg:py-24">
        <div className="lg:flex lg:items-center lg:justify-center">
          <div className="lg:w-1/2 text-center">
            <img
              className="w-auto h-16 mx-auto mb-4"
              src="/Estrellas-8.png"
              alt="Logo Estrellas"
            />
            <p className="text-gray-500 dark:text-gray-400">Bienvenido</p>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Login YARVIS Visas Americanas Colombia
            </h1>
          </div>

          <div className="mt-10 lg:w-1/2 lg:mt-0">
            <form
              onSubmit={handleSubmit}
              className="w-full lg:max-w-md mx-auto"
              aria-live="polite"
              role="form"
            >
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                className="block w-full py-3 px-4 text-gray-700 bg-white border rounded-lg dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring focus:ring-blue-300 focus:outline-none"
              />

              <label htmlFor="password" className="block mt-6 text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="block w-full py-3 px-4 text-gray-700 bg-white border rounded-lg dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring focus:ring-blue-300 focus:outline-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 px-6 py-3 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-blue-500 rounded-lg hover:bg-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50 disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Iniciar sesión"}
              </button>

              {status.msg && (
                <div
                  role="alert"
                  className={`mt-4 p-3 rounded-lg text-sm ${
                    status.kind === "ok"
                      ? "bg-green-900/30 text-green-300 border border-green-700"
                      : status.kind === "warn"
                      ? "bg-yellow-900/30 text-yellow-300 border border-yellow-700"
                      : "bg-red-900/30 text-red-300 border border-red-700"
                  }`}
                >
                  {status.msg}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
