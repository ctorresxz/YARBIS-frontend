// components/Merakirango.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";

// Estado UI (mismo patrón que Merakiadjuntar)
type Estado = {
  sending: boolean;
  error: string | null;
  ok: boolean;
};

export default function Merakirango(): ReactElement {
  const router = useRouter();

  // ====== Gate por PIN (acceso restringido) ======
  const [authed, setAuthed] = useState<boolean>(false);
  const [pin, setPin] = useState<string>("");
  const [pinErr, setPinErr] = useState<string>("");

  useEffect(() => {
    try {
      const ok = localStorage.getItem("rango_ok") === "1";
      setAuthed(ok);
    } catch {}
  }, []);

  const onEnter = useCallback(() => {
    const expected = process.env.NEXT_PUBLIC_RANGO_PIN || "";
    if (pin && expected && pin === expected) {
      try { localStorage.setItem("rango_ok", "1"); } catch {}
      setAuthed(true);
      setPinErr("");
    } else {
      setPinErr("Clave incorrecta");
    }
  }, [pin]);

  // ====== REFS según rango.html ======
  const refPreset = useRef<HTMLSelectElement>(null);
  const refStart = useRef<HTMLInputElement>(null);
  const refEnd = useRef<HTMLInputElement>(null);
  const refMakePdf = useRef<HTMLInputElement>(null);
  const refMakeXlsx = useRef<HTMLInputElement>(null);

  // Logs (mismo estilo Merakiadjuntar)
  const refLog = useRef<HTMLDivElement>(null);
  const refTasks = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<Estado>({ sending: false, error: null, ok: false });

  // ====== Helpers de log ======
  const log = useCallback((msg: string, obj?: unknown) => {
    const t = new Date().toLocaleTimeString();
    const text = obj ? `${msg} ${JSON.stringify(obj, null, 2)}` : msg;
    if (refLog.current) refLog.current.textContent = `[${t}] ${text}\n` + refLog.current.textContent;
  }, []);

  const createTaskLog = useCallback((title: string) => {
    if (!refTasks.current) return null;
    const wrap = document.createElement("div");
    wrap.className = "task";
    wrap.innerHTML = `<h3>${title}</h3><pre></pre>`;
    refTasks.current.prepend(wrap);
    return wrap.querySelector("pre");
  }, []);

  const taskLog = useCallback((pre: HTMLPreElement | null, msg: string, obj?: unknown) => {
    if (!pre) return;
    const t = new Date().toLocaleTimeString();
    const text = obj ? `${msg} ${JSON.stringify(obj, null, 2)}` : msg;
    pre.textContent += `[${t}] ${text}\n`;
    pre.scrollTop = pre.scrollHeight;
  }, []);

  // Mostrar/ocultar rango personalizado
  const isCustom = useMemo(() => refPreset.current?.value === "personalizado", []);
  const syncCustom = useCallback(() => {
    const el = refPreset.current;
    const show = el?.value === "personalizado";
    const cont = document.getElementById("customRangeCont");
    if (cont) cont.style.display = show ? "block" : "none";
  }, []);

  useEffect(() => {
    syncCustom();
  }, [syncCustom]);

  // ====== BOTÓN: Generar informe ======
  const onRun = useCallback(async () => {
    if (state.sending) return;

    const preset = refPreset.current?.value || "hoy";
    const start = refStart.current?.value || "";
    const end = refEnd.current?.value || "";
    const makePdf = !!refMakePdf.current?.checked;
    const makeXlsx = !!refMakeXlsx.current?.checked;

    // validación simple en personalizado
    if (preset === "personalizado" && (!start || !end)) {
      setState((s) => ({ ...s, error: "Debes seleccionar fecha inicio y fin." }));
      return;
    }

    setState({ sending: true, error: null, ok: false });
    const pre = createTaskLog("Proceso " + new Date().toLocaleTimeString()) as HTMLPreElement;

    try {
      // 1) Ejecutar calendario (como en HTML de backend)
      const today = new Date().toISOString().slice(0, 10);
      taskLog(pre, `▶ Ejecutando calendario ${today}...`);
      const calRes = await fetch(`/api/_calendario/calendario?date=${today}&make_pdf=${makePdf}&make_xlsx=${makeXlsx}`, { method: "POST", credentials: "include" });
      if (!calRes.ok) {
        const err = await calRes.text();
        taskLog(pre, `ERROR calendario: ${calRes.status} ${err}`);
        setState({ sending: false, error: `Calendario fallo: ${calRes.status}`, ok: false });
        return;
      }
      taskLog(pre, "✅ Calendario OK");

      // 2) Ejecutar rango
      let url = `/api/_rango/rango?preset=${encodeURIComponent(preset)}&make_pdf=${makePdf ? "true" : "false"}&make_xlsx=${makeXlsx ? "true" : "false"}`;
      if (preset === "personalizado") {
        url += `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
      }

      taskLog(pre, `▶ POST ${url}`);
      const res = await fetch(url, { method: "POST", credentials: "include" });
      const txt = await res.text();
      let data: any; try { data = JSON.parse(txt); } catch { data = { raw: txt }; }

      if (res.ok && (data?.status === "ok" || data?.output_pdf || data?.output_xlsx)) {
        taskLog(pre, `✅ HTTP ${res.status}${data?.status ? " · "+data.status : ""}`);
        // Descargar salidas si procede
        const range = data?.range;

        // --- NORMALIZACIÓN DEL SUBPATH PARA /_download ---
        // Quita "logs/" o "app/logs/" al inicio. No codifica las barras.
        const norm = (p: string) => (p || "").replace(/^\/?(?:app\/)?logs\//, "");

        if (data?.output_pdf && makePdf) {
          const a = document.createElement('a');
          const subpathPdf = norm(data.output_pdf);
          a.href = `/api/_download/${subpathPdf}`;
          let fname = 'informe.pdf';
          if (range?.start && range?.end) fname = range.start === range.end ? `informe_${range.start}.pdf` : `informe_${range.start}_a_${range.end}.pdf`;
          a.download = fname; document.body.appendChild(a); a.click(); a.remove();
        }
        if (data?.output_xlsx && makeXlsx) {
          const a = document.createElement('a');
          const subpathX = norm(data.output_xlsx);
          a.href = `/api/_download/${subpathX}`;
          let fname = 'consolidado.xlsx';
          if (range?.start && range?.end) fname = range.start === range.end ? `consolidado_${range.start}.xlsx` : `consolidado_${range.start}_a_${range.end}.xlsx`;
          a.download = fname; document.body.appendChild(a); a.click(); a.remove();
        }
        setState({ sending: false, error: null, ok: true });
        // 🎯 REDIRECT_EXITO
        router.push("/rango");
        return;
      }

      taskLog(pre, `Error ${res.status}: ${txt}`);
      setState({ sending: false, error: `Error ${res.status}`, ok: false });
    } catch (e: any) {
      taskLog(pre, "CLIENT_ERROR: " + e.message);
      setState({ sending: false, error: e.message, ok: false });
    }
  }, [state.sending, router, createTaskLog, taskLog]);

  // ====== Reiniciar ======
  const onReset = useCallback(() => {
    if (refPreset.current) refPreset.current.value = "hoy";
    if (refStart.current) refStart.current.value = "";
    if (refEnd.current) refEnd.current.value = "";
    if (refMakePdf.current) refMakePdf.current.checked = true;
    if (refMakeXlsx.current) refMakeXlsx.current.checked = false;
    syncCustom();
    setState({ sending: false, error: null, ok: false });
    log("Reinicio completado.");
  }, [log, syncCustom]);

  // ====== Atrás ======
  const onAtras = useCallback(() => {
    router.push("/adjuntar");
  }, [router]);

  // ====== Cerrar sesión ======
  const onLogout = useCallback(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
    router.push("/login");
  }, [router]);

  // ====== Gate UI (si no autorizado) ======
  if (!authed) {
    return (
      <div className="wrap">
        <section className="card max-w-md mx-auto bg-white dark:bg-gray-800 rounded-md shadow-md p-6" style={{ marginTop: 14 }}>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white text-center">Acceso restringido</h2>
          <div className="mt-4">
            <label className="text-gray-700 dark:text-gray-200" htmlFor="pin">Clave</label>
            <input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring"
              placeholder="Ingrese clave de acceso"
            />
            <button
              type="button"
              onClick={onEnter}
              className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Entrar
            </button>
            {pinErr && (
              <div className="btn" role="alert" aria-live="polite" style={{ marginTop: 10, borderColor: "#3a2b0e", background: "#261d0a" }}>
                {pinErr}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // ====== UI (original) ======
  return (
    <div className="wrap">
      {/* Logo / encabezado */}
      <div className="brand-banner flex justify-center">
        <img src="/informe1.png" alt="Marca" className="w-1/6 h-auto" />
      </div>

      <section className="card max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-md shadow-md p-6" style={{ marginTop: 14 }}>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-white text-center">Informe Personalizado</h2>

        {/* Preset */}
        <div className="grid grid-cols-1 gap-6 mt-4 place-items-center justify-items-center">
          <div className="w-full max-w-lg text-center mx-auto"><label className="text-gray-700 dark:text-gray-200" htmlFor="preset">Periodo de generación del informe</label>
            <select id="preset" ref={refPreset} onChange={syncCustom} defaultValue="hoy" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring">
              <option value="hoy">Hoy</option>
              <option value="ayer">Ayer</option>
              <option value="ultimos8">Últimos 8 días</option>
              <option value="ultimos15">Últimos 15 días</option>
              <option value="ultimomes">Último mes</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>
          <div className="hidden sm:block" />

          {/* Rango personalizado */}
          <div id="customRangeCont" className="sm:col-span-2" style={{ display: "none" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-gray-700 dark:text-gray-200" htmlFor="start">Inicio (YYYY-MM-DD)</label>
                <input id="start" ref={refStart} type="date" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring" />
              </div>
              <div>
                <label className="text-gray-700 dark:text-gray-200" htmlFor="end">Fin (YYYY-MM-DD)</label>
                <input id="end" ref={refEnd} type="date" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring" />
              </div>
            </div>
          </div>

          {/* PDF / XLSX */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center sm:space-x-10 space-y-6 sm:space-y-0">
            <div className="flex flex-col items-center">
              <img src="/pdf.png" alt="PDF" className="w-10 h-10 object-contain" />
              <span className="mt-2 text-sm text-gray-700 dark:text-gray-200">Generar PDF</span>
              <label htmlFor="makePdf" className="mt-3 inline-flex items-center cursor-pointer select-none">
                <input id="makePdf" ref={refMakePdf} type="checkbox" defaultChecked className="sr-only peer" />
                <span className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative transition-colors peer-checked:bg-emerald-500">
                  <span className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </span>
              </label>
            </div>
            <div className="flex flex-col items-center">
              <img src="/excel.png" alt="Excel" className="w-10 h-10 object-contain" />
              <span className="mt-2 text-sm text-gray-700 dark:text-gray-200">Generar EXCEL</span>
              <label htmlFor="makeXlsx" className="mt-3 inline-flex items-center cursor-pointer select-none">
                <input id="makeXlsx" ref={refMakeXlsx} type="checkbox" className="sr-only peer" />
                <span className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative transition-colors peer-checked:bg-emerald-500">
                  <span className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </span>
              </label>
            </div>
          </div></div>

        {/* Botonera principal */}
        <div className="w-full flex justify-center mt-6">
          <div className="flex overflow-hidden bg-white border divide-x rounded-lg rtl:flex-row-reverse dark:bg-gray-900 dark:border-gray-700 dark:divide-gray-700 w-fit">
            <button type="button" onClick={onRun} disabled={state.sending} className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 sm:text-base sm:px-6 dark:hover:bg-gray-800 dark:text-gray-300 gap-x-3 hover:bg-gray-100" title="Generar informe">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0-3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/></svg>
              <span className="text-green-600">{state.sending ? "Procesando…" : "Generar informe"}</span>
            </button>
            <button type="button" onClick={onReset} disabled={state.sending} className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 transition-colors duración-200 sm:text-base sm:px-6 dark:hover:bg-gray-800 dark:text-gray-300 gap-x-3 hover:bg-gray-100" title="Reiniciar">
              <svg className="w-5 h-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.227V5.12M21 12a9 9 0 1 1-3.338-6.958M20.25 5.25l-4.227 4.098"/></svg>
              <span>Reiniciar</span>
            </button>
            <button type="button" onClick={onAtras} disabled={state.sending} className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 transition-colors duración-200 sm:text-base sm:px-6 dark:hover:bg-gray-800 dark:text-gray-300 gap-x-3 hover:bg-gray-100" title="Atrás">
              <svg className="w-5 h-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
              <span>Atrás</span>
            </button>
          </div>
        </div>

        {/* Errores */}
        {state.error && (
          <div className="btn" role="alert" aria-live="polite" style={{ marginTop: 10, borderColor: "#3a2b0e", background: "#261d0a" }}>{state.error}</div>
        )}
        {/* Botón Cerrar sesión */}
        <div className="flex items-center justify-center mt-4">
          <button type="button" onClick={onLogout} disabled={state.sending} title="Cerrar sesión" className="bg-white dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 rounded-lg hover:bg-gray-100 duración-300 transition-colors border px-4 py-2.5 flex items-center gap-2">
            <svg className="w-5 h-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25v7.5m6.364-3.864a9 9 0 1 1-12.728 0" />
            </svg>
          </button>
        </div>
      </section>

      {/* Verificación de tareas */}
      <section className="card max-w-3xl mx-auto" style={{ marginTop: 14 }}>
        <div className="flex w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800">
          <div className="flex items-center justify-center w-12 bg-blue-500">
            <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M20 3.33331C10.8 3.33331 3.33337 10.8 3.33337 20C3.33337 29.2 10.8 36.6666 20 36.6666C29.2 36.6666 36.6667 29.2 36.6667 20C36.6667 10.8 29.2 3.33331 20 3.33331ZM21.6667 28.3333H18.3334V25H21.6667V28.3333ZM21.6667 21.6666H18.3334V11.6666H21.6667V21.6666Z"/></svg>
          </div>
          <div className="px-4 py-3 flex-1">
            <div className="mb-1 font-semibold text-blue-600 dark:text-blue-400">Verificación de tareas</div>
            <div className="max-h-64 overflow-auto">
              <div id="out" ref={refLog} className="log" aria-live="polite" />
              <div style={{ height: 8 }} />
              <div id="tasks" ref={refTasks} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
