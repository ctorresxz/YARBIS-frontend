// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("usuario", user);     // <-- ajusta si tu backend usa otro nombre
      fd.append("password", pass);

      const res = await fetch("/api/login", {
        method: "POST",
        body: fd,
        // El proxy está en el mismo dominio => no hace falta credentials aquí
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      // Éxito: ve a tu página protegida o a /adjuntar
      router.push("/adjuntar");
    } catch (e: any) {
      setErr(e.message ?? "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm space-y-4"
      >
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>

        <div>
          <label className="block text-sm mb-1">Usuario</label>
          <input
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Contraseña</label>
          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {err && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {err}
          </p>
        )}

        <button
          className="w-full rounded-lg bg-black text-white py-2 disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
