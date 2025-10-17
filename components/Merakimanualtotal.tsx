// components/Merakimanualtotal.tsx
"use client";

import React, { useCallback, useMemo, useRef, useState, useEffect, type ReactElement } from "react";
import { useRouter } from "next/navigation";

// Estado UI (mismo patrón que Merakiadjuntar)
type Estado = {
  sending: boolean;
  error: string | null;
  ok: boolean;
};

export default function Merakimanualtotal(): ReactElement {
  const router = useRouter();

  // ----- Refs campos (alineados con manualtotal.html) -----
  const refNombre = useRef<HTMLInputElement>(null);
  const refCorreo = useRef<HTMLInputElement>(null);
  const refNumero = useRef<HTMLInputElement>(null);
  const refProducto = useRef<HTMLInputElement>(null);
  const refValor = useRef<HTMLInputElement>(null);
  const refFecha = useRef<HTMLInputElement>(null); // type=date
  const refHora = useRef<HTMLInputElement>(null);  // type=time (step=60)
  const refBanco = useRef<HTMLInputElement>(null);
  const refCuentaDesde = useRef<HTMLInputElement>(null);
  const refCuentaHasta = useRef<HTMLInputElement>(null);
  const refSucursal = useRef<HTMLSelectElement>(null);

  // Log y contenedor de tareas (misma UX que Merakiadjuntar)
  const refLog = useRef<HTMLDivElement>(null);
  const refTasks = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<Estado>({ sending: false, error: null, ok: false });

  // ----- Log helpers (idéntico estilo) -----
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

  // ----- Validación mínima (nombre, número, producto, sucursal) -----
  const valid = useMemo(() => {
    const nombre = refNombre.current?.value?.trim();
    const numero = Number.parseInt(refNumero.current?.value || "");
    const producto = refProducto.current?.value?.trim();
    const sucursal = refSucursal.current?.value?.trim();
    return Boolean(nombre && producto && sucursal && Number.isInteger(numero) && numero >= 1);
  }, []);

  // ----- Persistencia ligera (igual filosofía) -----
  const bindPersistence = useCallback(() => {
    const nombre = refNombre.current;
    const correo = refCorreo.current;
    const numero = refNumero.current;
    const producto = refProducto.current;
    const sucursal = refSucursal.current;

    if (nombre) {
      nombre.value = localStorage.getItem("nombre") || "";
      nombre.addEventListener("input", () => localStorage.setItem("nombre", nombre.value.trim()));
    }
    if (correo) {
      correo.value = localStorage.getItem("correo") || "";
      correo.addEventListener("input", () => localStorage.setItem("correo", correo.value.trim()));
    }
    if (numero) {
      numero.value = localStorage.getItem("numero_personas") || "";
      numero.addEventListener("input", () => localStorage.setItem("numero_personas", numero.value.trim()));
    }
    if (producto) {
      producto.value = localStorage.getItem("producto_manual") || "";
      producto.addEventListener("input", () => localStorage.setItem("producto_manual", producto.value.trim()));
    }
    if (sucursal) {
      const saved = localStorage.getItem("sucursal") || "sede pereira";
      sucursal.value = saved;
      sucursal.addEventListener("change", () => localStorage.setItem("sucursal", sucursal.value));
    }
  }, []);

  useEffect(() => { bindPersistence(); }, [bindPersistence]);

  // ----- Helpers -----
  const genCID = () => Math.random().toString(16).slice(2, 14);

  const toDDMMYYYY = (v: string): string => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  };

  const toHHMMAmPm = (v: string): string => {
    if (!v) return "";
    const [hRaw, mRaw = "00"] = v.split(":");
    let h = parseInt(hRaw || "0", 10) % 24;
    const lab = h < 12 ? "a. m." : "p. m.";
    h = (h % 12) || 12;
    return `${String(h).padStart(2, "0")}:${String(mRaw).padStart(2, "0")} ${lab}`;
  };

  const triggerDatosAfterManual = useCallback(async (cid: string, attempt = 1) => {
    try {
      const res = await fetch("/api/_datos/datos?source=manual", { method:"POST", headers:{ "X-Correlation-Id": cid } });
      if (res.ok) {
        log("🧩 Datos: generado JSON.");
        return;
      }
      if (res.status === 404 && attempt === 1) {
        await new Promise((r) => setTimeout(r, 600));
        return triggerDatosAfterManual(cid, 2);
      }
      log(`🧩 Datos: respuesta ${res.status}.`);
    } catch (e: any) {
      log("🧩 Datos: error de red " + e.message);
    }
  }, [log]);

  // ----- Acción PROCESAR -----
  const onProcesar = useCallback(async () => {
    if (state.sending) return;

    const nombre = refNombre.current?.value?.trim() || "";
    const correo = refCorreo.current?.value?.trim() || "";
    const numero = Number.parseInt(refNumero.current?.value || "0");
    const producto = refProducto.current?.value?.trim() || "";
    const valor = refValor.current?.value?.trim() || "";
    const fecha = toDDMMYYYY(refFecha.current?.value || "");
    const hora = toHHMMAmPm(refHora.current?.value || "");
    const banco = refBanco.current?.value?.trim() || "";
    const cDesde = refCuentaDesde.current?.value?.trim() || "";
    const cHasta = refCuentaHasta.current?.value?.trim() || "";
    const sucursal = refSucursal.current?.value?.trim() || "";

    if (!nombre || !producto || !sucursal || !Number.isInteger(numero) || numero < 1) {
      setState((s) => ({ ...s, error: "Completa los campos obligatorios." }));
      return;
    }

    setState({ sending: true, error: null, ok: false });
    const taskPre = createTaskLog("Proceso " + new Date().toLocaleTimeString()) as HTMLPreElement;
    taskLog(taskPre, "⏳ Enviando a /manualtotal …");

    // Construir body como application/x-www-form-urlencoded (compat manualtotal.html)
    const params = new URLSearchParams({
      nombre,
      correo,
      numero_personas: String(numero),
      producto,
      VALOR: valor,
      FECHA: fecha,
      HORA: hora,
      BANCO: banco,
      CUENTA_DESDE_ULT4: cDesde,
      CUENTA_HASTA_ULT4: cHasta,
      SUCURSAL: sucursal,
    });

    try {
      const res = await fetch("/api/_manualtotal/manualtotal", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
        credentials: "include", // <<<<<<<<<<<<<<<<<<<<<< CAMBIO ÚNICO
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.ok && (json?.saved || json?.ok)) {
        taskLog(taskPre, "✅ Procesado manualmente.");
        const cid = (json && (json.correlation_id as string)) || genCID();
        await triggerDatosAfterManual(cid);
        setState({ sending: false, error: null, ok: true });
        // 🎯 REDIRECT_EXITO
        router.push("/manualtotal");
        return;
      }

      const errText = `Error ${res.status}: ${JSON.stringify(json)}`;
      taskLog(taskPre, errText);
      setState({ sending: false, error: errText, ok: false });
    } catch (e: any) {
      taskLog(taskPre, "Error de red: " + e.message);
      setState({ sending: false, error: e.message, ok: false });
    }
  }, [router, state.sending, createTaskLog, taskLog, triggerDatosAfterManual]);

  // ----- Controles secundarios -----
  const onReset = useCallback(() => {
    [
      "nombre",
      "correo",
      "numero_personas",
      "producto_manual",
      "sucursal",
    ].forEach((k) => localStorage.removeItem(k));

    [
      refNombre,
      refCorreo,
      refNumero,
      refProducto,
      refValor,
      refFecha,
      refHora,
      refBanco,
      refCuentaDesde,
      refCuentaHasta,
    ].forEach((r) => {
      if (r.current) r.current.value = "" as any;
    });

    if (refSucursal.current) refSucursal.current.value = "sede pereira";

    setState({ sending: false, error: null, ok: false });
    log("Formulario reiniciado.");
  }, [log]);

  const onAtras = useCallback(() => {
    router.push("/adjuntar");
  }, [router]);

  const onLogout = useCallback(() => {
    [
      "nombre",
      "correo",
      "numero_personas",
      "producto_manual",
      "sucursal",
    ].forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
    router.push("/login");
  }, [router]);

  // ----- UI -----
  return (
    <div className="wrap">
      {/* Logo (centrado y pequeño) */}
      <div className="brand-banner flex justify-center">
        <img src="/manual.png" alt="Marca" className="w-1/5 h-auto" />
      </div>

      {/* Título */}
      <section className="card max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-md shadow-md p-6" style={{ marginTop: 14 }}>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-white text-center">Proceso Manual de Registro de Pagos</h2>

        {/* Formulario (paridad con manualtotal.html) */}
        <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="nombre">Nombre</label>
            <input id="nombre" ref={refNombre} type="text" placeholder="Juan Pérez" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="correo">Correo</label>
            <input id="correo" ref={refCorreo} type="email" placeholder="correo@dominio.com" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="numero_personas">Número de Personas</label>
            <input id="numero_personas" ref={refNumero} type="number" min={1} placeholder="1" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="producto">Producto</label>
            <input id="producto" ref={refProducto} type="text" placeholder="Servicio" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="VALOR">Valor</label>
            <input id="VALOR" ref={refValor} type="text" placeholder="$ 1.360.000,00" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="FECHA">Fecha</label>
            <input id="FECHA" ref={refFecha} type="date" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="HORA">Hora</label>
            <input id="HORA" ref={refHora} type="time" step={60} className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="BANCO">Banco</label>
            <input id="BANCO" ref={refBanco} type="text" placeholder="Bancolombia" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="CUENTA_DESDE_ULT4">NÚMERO DE CUENTA QUE TRANSFIERE (Últimos 4)</label>
            <input id="CUENTA_DESDE_ULT4" ref={refCuentaDesde} type="text" placeholder="0740" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="CUENTA_HASTA_ULT4">NÚMERO DE CUENTA QUE RECIBE (Últimos 4 o nombre)</label>
            <input id="CUENTA_HASTA_ULT4" ref={refCuentaHasta} type="text" placeholder="8084 / Nombre" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring" />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="SUCURSAL">Sucursal</label>
            <select id="SUCURSAL" ref={refSucursal} defaultValue="sede pereira" className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 dark:focus:border-blue-300 focus:outline-none focus:ring">
              <option value="sede pereira">Sede Pereira</option>
              <option value="sede bogota">Sede Bogotá</option>
            </select>
          </div>
        </div>

        {/* Botonera principal (idéntica a Merakiadjuntar) */}
        <div className="w-full flex justify-center mt-6">
          <div className="flex overflow-hidden bg-white border divide-x rounded-lg rtl:flex-row-reverse dark:bg-gray-900 dark:border-gray-700 dark:divide-gray-700 w-fit">
            <button type="button" onClick={() => { if (!state.sending) onProcesar(); }} className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 sm:text-base sm:px-6 dark:hover:bg-gray-800 dark:text-gray-300 gap-x-3 hover:bg-gray-100" title="Procesar" aria-disabled={state.sending || !valid}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/></svg>
              <span className="text-green-600">{state.sending ? "Procesando…" : "Procesar"}</span>
            </button>
            <button type="button" onClick={onReset} disabled={state.sending} className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 sm:text-base sm:px-6 dark:hover:bg-gray-800 dark:text-gray-300 gap-x-3 hover:bg-gray-100" title="Reiniciar">
              <svg className="w-5 h-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.227V5.12M21 12a9 9 0 1 1-3.338-6.958M20.25 5.25l-4.227 4.098"/></svg>
              <span>Reiniciar</span>
            </button>
            <button type="button" onClick={onAtras} disabled={state.sending} className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 transition-colors duración-200 sm:text-base sm:px-6 dark:hover:bg-gray-800 dark:text-gray-300 gap-x-3 hover:bg-gray-100" title="Atrás">
              <svg className="w-5 h-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
              <span>Atrás</span>
            </button>
          </div>
        </div>

        {/* Secundarios: cerrar sesión (misma acción que en adjuntar) */}
        <div className="flex items-center gap-3 sm:gap-x-5 mt-4 justify-center">
          <button
  type="button"
  onClick={onLogout}
  disabled={state.sending}
  title="Cerrar sesión"
  className="bg-white dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 rounded-lg hover:bg-gray-100 duration-300 transition-colors border w-10 h-10 p-0 flex items-center justify-center leading-none"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9"
    />
  </svg>
</button>

        </div>

        {state.error && (
          <div className="btn" role="alert" aria-live="polite" style={{ marginTop: 10, borderColor: "#3a2b0e", background: "#261d0a" }}>{state.error}</div>
        )}
      </section>

      {/* Verificación de tareas (idéntico bloque) */}
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
