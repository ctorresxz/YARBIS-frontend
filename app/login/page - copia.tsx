// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget); // toma "usuario" y "password"
      const res = await fetch("/api/login", { method: "POST", body: fd });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
      }

      setMsg("✅ Login correcto");
      router.push("/adjuntar");
    } catch (err: any) {
      setMsg(`❌ ${err?.message ?? "Error de autenticación"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-base-200 grid place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title justify-center">Iniciar sesión</h1>

            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="form-control">
                <label className="label" htmlFor="usuario">
                  <span className="label-text">Usuario</span>
                </label>
                <input
                  id="usuario"
                  name="usuario"
                  className="input input-bordered"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="password">
                  <span className="label-text">Contraseña</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="input input-bordered"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {msg && (
                <div className={`alert ${msg.startsWith("✅") ? "alert-success" : "alert-error"} text-sm`}>
                  <span>{msg}</span>
                </div>
              )}

              <button className={`btn btn-primary ${loading ? "loading" : ""}`} disabled={loading}>
                {loading ? "Ingresando…" : "Entrar"}
              </button>
            </form>

            <div className="divider my-2"></div>
            <p className="text-center text-xs opacity-60">
              © {new Date().getFullYear()} YARBIS
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
