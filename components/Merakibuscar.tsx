// components/Merakibuscar.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Partes = { nombre: string; fecha: string; hora: string; banco: string; valor: string; telefono: string; };
type Item = { filename: string; path_rel: string; size_bytes: number; mtime: string; ext: string; mime: string; parts: Partes; preview_url: string; };
type Resp = { ok: boolean; count: number; limit: number; offset: number; results: Item[]; correlation_id: string; };

// barra final para evitar 307
const API = "/api/buscar/";
const toQuery = (params: Record<string, string | number | boolean | undefined>) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") usp.set(k, String(v)); });
  return `?${usp.toString()}`;
};
// normaliza preview
const safePreview = (p: string) => `/api${p.startsWith("/") ? p : `/${p}`}`;

export default function Merakibuscar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // debounce
  const timer = useRef<number | null>(null);
  const trigger = (fn: () => void, ms = 350) => { if (timer.current) window.clearTimeout(timer.current); timer.current = window.setTimeout(fn, ms); };

  // abort controller para evitar “Failed to fetch” por carreras
  const ctrlRef = useRef<AbortController | null>(null);

  const doSearch = async (query: string) => {
    setLoading(true);
    setErr(null);

    // cancela la petición previa si existe
    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    try {
      const url = API + toQuery({ q: query.trim(), limit: 50, sort: "mtime_desc" });
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        credentials: "include",
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

      const ct = res.headers.get("content-type") || "";
      const data: Resp = ct.includes("application/json") ? await res.json() : await res.text();
      if (!ct.includes("application/json")) throw new Error("Respuesta no JSON");
      if (!data.ok) throw new Error("Respuesta no OK");

      setResults(data.results || []);
      setTotal(data.count || 0);
    } catch (e: any) {
      // silenciar abortos para que no dispare overlay
      const aborted =
        ctrl.signal.aborted ||
        e?.name === "AbortError" ||
        /aborted|The user aborted a request/i.test(e?.message || "");
      if (aborted) return;

      setErr(e?.message || "Error");
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { doSearch(""); }, []);

  const fmt = useMemo(
    () => ({
      size: (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(2)} MB` : n > 1024 ? `${(n / 1024).toFixed(0)} KB` : `${n} B`),
      date: (s: string) => new Date(s).toLocaleString(),
    }),
    []
  );

  return (
    <div className="max-w-5xl mx-auto px-5 py-6">
      <section className="relative w-full max-w-md px-5 py-4 mx-auto rounded-md">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <input
            type="text"
            className="w-full py-3 pl-10 pr-4 text-gray-700 bg-white border rounded-md dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40"
            placeholder="Busca por nombre, fecha, hora, banco, valor, teléfono…"
            value={q}
            onChange={(e) => { const v = e.target.value; setQ(v); trigger(() => doSearch(v)); }}
            onKeyDown={(e) => { if (e.key === "Enter") doSearch(q); }}
          />
        </div>
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {loading ? "Buscando…" : `Coincidencias: ${total}`} {err ? <span className="ml-2 text-red-500">({err})</span> : null}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => {
          const isImage = r.mime.startsWith("image/");
          const isPdf = r.mime === "application/pdf";
          return (
            <div key={r.path_rel} className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-md overflow-hidden shadow-sm">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {isImage ? (
                  <img src={safePreview(r.preview_url)} alt={r.filename} className="max-h-56 object-contain" loading="lazy" />
                ) : isPdf ? (
                  <a href={safePreview(r.preview_url)} target="_blank" rel="noreferrer" className="text-sm underline" title="Abrir PDF">Ver PDF</a>
                ) : (
                  <span className="text-xs opacity-70">{r.ext.toUpperCase()}</span>
                )}
              </div>

              <div className="p-3">
                <div className="font-medium text-gray-800 dark:text-gray-100 truncate" title={r.filename}>{r.filename}</div>
                <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">N: {r.parts.nombre || "—"}</span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">F: {r.parts.fecha || "—"}</span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">H: {r.parts.hora || "—"}</span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">B: {r.parts.banco || "—"}</span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">V: {r.parts.valor || "—"}</span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">T: {r.parts.telefono || "—"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{fmt.size(r.size_bytes)}</span>
                  <span>{fmt.date(r.mtime)}</span>
                </div>
                <div className="mt-2">
                  <a href={safePreview(r.preview_url)} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Abrir en nueva pestaña</a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && results.length === 0 && (
        <div className="text-center text-sm mt-8 text-gray-500 dark:text-gray-400">No hay coincidencias.</div>
      )}
    </div>
  );
}
