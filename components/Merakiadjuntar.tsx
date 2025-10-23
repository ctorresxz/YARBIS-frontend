// components/Merakiadjuntar.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";

type Estado = {
  sending: boolean;
  error: string | null;
  ok: boolean;
};

export default function Merakiadjuntar(): ReactElement {
  const router = useRouter();

  // ----- Refs originales (se conservan) -----
  const refNombre = useRef<HTMLInputElement>(null);
  const refCorreo = useRef<HTMLInputElement>(null);
  const refNumero = useRef<HTMLInputElement>(null);
  const refProducto = useRef<HTMLSelectElement>(null);
  const refSucursal = useRef<HTMLSelectElement>(null);
  const refFile = useRef<HTMLInputElement>(null);
  const refDrop = useRef<HTMLLabelElement>(null);
  const refLog = useRef<HTMLDivElement>(null);
  const refTasks = useRef<HTMLDivElement>(null);

  // ----- NUEVOS REFS (añadidos, sin borrar nada) -----
  const refTelefono = useRef<HTMLInputElement>(null);
  const refObservaciones = useRef<HTMLTextAreaElement>(null);

  const [archivoListo, setArchivoListo] = useState<File | null>(null);
  const [state, setState] = useState<Estado>({ sending: false, error: null, ok: false });

  // NUEVO: toast de “Archivo adjuntado”
  const [showAttachOK, setShowAttachOK] = useState(false);

  // ----- Log (igual) -----
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

  // ----- Validaciones (igual) -----
  const valid = useMemo(() => {
    const nombre = refNombre.current?.value?.trim();
    const numero = Number.parseInt(refNumero.current?.value || "");
    const producto = refProducto.current?.value?.trim();
    const sucursal = refSucursal.current?.value?.trim();
    return Boolean(
      archivoListo && nombre && producto && sucursal && Number.isInteger(numero) && numero >= 1
    );
  }, [archivoListo]);

  const ALLOWED = useMemo(
    () =>
      new Set([
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "application/pdf",
      ]),
    []
  );
  const MAX_BYTES = 15 * 1024 * 1024;

  const validateFile = useCallback(
    (f: File) => {
      if (!ALLOWED.has(f.type)) throw new Error(`Tipo no permitido: ${f.type || "desconocido"}`);
      if (f.size > MAX_BYTES) throw new Error("Archivo excede 15MB");
    },
    [ALLOWED]
  );

  // ----- Persistencia (igual) -----
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
      numero.addEventListener("input", () =>
        localStorage.setItem("numero_personas", numero.value.trim())
      );
    }
    if (producto) {
      const saved = localStorage.getItem("producto") || "";
      if (saved) producto.value = saved;
      producto.addEventListener("change", () => localStorage.setItem("producto", producto.value));
    }
    if (sucursal) {
      const saved = localStorage.getItem("sucursal") || "sede pereira";
      sucursal.value = saved;
      sucursal.addEventListener("change", () => localStorage.setItem("sucursal", sucursal.value));
    }

    // ----- NUEVA PERSISTENCIA (teléfono / observaciones) -----
    const telefono = refTelefono.current;
    if (telefono) {
      telefono.value = localStorage.getItem("telefono") || "";
      telefono.addEventListener("input", () =>
        localStorage.setItem("telefono", telefono.value.trim())
      );
    }
    const observ = refObservaciones.current;
    if (observ) {
      observ.value = localStorage.getItem("observaciones") || "";
      observ.addEventListener("input", () =>
        localStorage.setItem("observaciones", observ.value.trim())
      );
    }
  }, []);

  // ----- Opciones de producto (igual) -----
  const loadProductOptions = useCallback(async () => {
    const sel = refProducto.current;
    if (!sel) return;
    sel.innerHTML = "<option value=\"\">Cargando…</option>";
    try {
      const res = await fetch("/api/_adj/product-options");
      const data = await res.json();
      const opts: string[] =
        Array.isArray((data as any)?.options) && (data as any).options.length
          ? (data as any).options
          : [
              "Analisis de perfil",
              "Primera vez",
              "Renovación",
              "Actualización",
              "Radicación",
              "Recolección",
              "Corrección de formulario",
              "Corrección de cuenta",
              "Asesoría final",
              "Pasaporte Americano",
              "ESTA",
              "Analisis de perfil Canada",
              "Canadá",
              "Reino Unido",
              "Japón",
              "China",
              "Camboya",
              "Vietnam",
            ];
      const saved = localStorage.getItem("producto") || "";
      sel.innerHTML =
        '<option value="">Selecciona…</option>' +
        opts.map((v) => `<option value="${v}">${v}</option>`).join("");
      if (saved) sel.value = saved;
    } catch {
      const sel2 = refProducto.current;
      if (!sel2) return;
      const opts = [
        "Analisis de perfil",
        "Primera vez",
        "Renovación",
        "Actualización",
        "Radicación",
        "Recolección",
        "Corrección de formulario",
        "Corrección de cuenta",
        "Asesoría final",
        "Pasaporte Americano",
        "ESTA",
        "Analisis de perfil Canada",
        "Canadá",
        "Reino Unido",
        "Japón",
        "China",
        "Camboya",
        "Vietnam",
      ];
      const saved = localStorage.getItem("producto") || "";
      sel2.innerHTML =
        '<option value="">Selecciona…</option>' +
        opts.map((v) => `<option value="${v}">${v}</option>`).join("");
      if (saved) sel2.value = saved;
    }
  }, []);

  // ----- Manejo archivo (igual) + toast Success -----
  const handleFile = useCallback(
    (f: File | null | undefined) => {
      if (!f) return;
      try {
        validateFile(f);
      } catch (err: any) {
        log(err.message);
        return;
      }
      setArchivoListo(f);
      // Mostrar confirmación visual de “Archivo adjuntado”
      setShowAttachOK(true);
      setTimeout(() => setShowAttachOK(false), 2200);
      log(`Archivo ✅: ${f.name}`);
    },
    [validateFile, log]
  );

  const wirePasteAndDrop = useCallback(() => {
    const dz = refDrop.current!;
    dz.addEventListener("paste", (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const item = items.find((i) => i.type.startsWith("image/") || i.type === "application/pdf");
      const blob = item?.getAsFile();
      handleFile(blob || undefined);
    });
    dz.addEventListener("dragover", (e) => e.preventDefault());
    dz.addEventListener("drop", (e: DragEvent) => {
      e.preventDefault();
      const f = (e.dataTransfer?.files || [])[0];
      handleFile(f);
    });
    refFile.current?.addEventListener("change", (e: Event) => {
      const input = e.target as HTMLInputElement;
      const f = (input.files || [])[0];
      handleFile(f);
    });
  }, [handleFile]);

  // ----- Helpers (igual) -----
  const genCID = () => Math.random().toString(16).slice(2, 14);

  const triggerDatosAfterLectura = useCallback(async (cid: string, attempt = 1) => {
    try {
      const res = await fetch("/api/_datos/datos?source=auto", {
        method: "POST",
        headers: { "X-Correlation-Id": cid },
      });
      if (res.ok) {
        log("🧩 Datos: ok.");
        return;
      }
      if (res.status === 404 && attempt === 1) {
        await new Promise((r) => setTimeout(r, 600));
        return triggerDatosAfterLectura(cid, 2);
      }
      log(`🧩 Datos: respuesta ${res.status}.`);
    } catch (e: any) {
      log("🧩 Datos: error de red " + e.message);
    }
  }, [log]);

  // ----- Acciones (igual) -----
  const onProcesar = useCallback(async () => {
    if (state.sending) return;
    if (!archivoListo) {
      setState((s) => ({ ...s, error: "Adjunta un archivo válido." }));
      return;
    }

    const nombre = refNombre.current?.value?.trim() || "";
    const correo = refCorreo.current?.value?.trim() || ""; // <-- FIX: sin “the”
    const numero = Number.parseInt(refNumero.current?.value || "0");
    const producto = refProducto.current?.value?.trim() || "";
    const sucursal = refSucursal.current?.value?.trim() || "";

    // ----- NUEVO: tomar teléfono y observaciones -----
    const telefono = refTelefono.current?.value?.trim() || "";
    const observaciones = refObservaciones.current?.value?.trim() || "";

    if (!nombre || !producto || !sucursal || !Number.isInteger(numero) || numero < 1) {
      setState((s) => ({ ...s, error: "Completa los campos obligatorios." }));
      return;
    }

    setState({ sending: true, error: null, ok: false });
    const taskPre = createTaskLog("Proceso " + new Date().toLocaleTimeString()) as HTMLPreElement;
    taskLog(taskPre, "⏳lectura...");

    const fd = new FormData();
    fd.append("file", archivoListo);
    fd.append(
      "meta",
      JSON.stringify({
        producto,
        numero_personas: numero,
        nombre,
        correo: correo || null,
        sucursal,
      })
    );

    // ----- NUEVO: enriquecer el "meta" SIN borrar líneas existentes -----
    try {
      const current = fd.get("meta");
      const baseObj =
        typeof current === "string" ? JSON.parse(current) : JSON.parse(String(current));
      baseObj.telefono = telefono || null;
      baseObj.observaciones = observaciones || null;
      fd.set("meta", JSON.stringify(baseObj));
    } catch {
      // Fallback por si parse falla
      fd.set(
        "meta",
        JSON.stringify({
          producto,
          numero_personas: numero,
          nombre,
          correo: correo || null,
          sucursal,
          telefono: telefono || null,
          observaciones: observaciones || null,
        })
      );
    }

    try {
      const res = await fetch("/api/_read/lectura", { method: "POST", body: fd });

      if (res.ok) {
        let data: any = {};
        try {
          const ct = res.headers.get("content-type") || "";
          data = ct.includes("application/json") ? await res.json() : await res.text();
        } catch {}

        if (data && (data.validacion === "automatica" || data.status === "ok")) {
          log("✅ Aprobado.");
          taskLog(taskPre, "✅ Aprobado.");
          const cid = genCID();
          await triggerDatosAfterLectura(cid);
          setState({ sending: false, error: null, ok: true });
          router.push("/adjuntar");
          return;
        }

        if (data && data.status === "verification_failed" && data.file) {
          taskLog(taskPre, "⚠️ Verificación fallida: flujo manual.");
          setState({ sending: false, error: "Verificación fallida, requiere flujo manual.", ok: false });
          return;
        }

        taskLog(taskPre, "⚠️ Requiere reproceso o corrección manual.");
        setState({ sending: false, error: "Requiere reproceso o corrección manual.", ok: false });
        return;
      }

      let errMsg = "Solicitud fallida";
      try {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const j = await res.json();
          if (Array.isArray((j as any).detail)) {
            errMsg = (j as any).detail.map((d: any) => d.msg || JSON.stringify(d)).join(" | ");
          } else if ((j as any).detail) {
            errMsg = (j as any).detail.msg || (j as any).detail || JSON.stringify((j as any).detail);
          } else if ((j as any).message) {
            errMsg = (j as any).message;
          } else {
            errMsg = JSON.stringify(j);
          }
        } else {
          errMsg = await res.text();
        }
      } catch {}
      log(`Error ${res.status}: ${errMsg}`);
      taskLog(taskPre, `Error ${res.status}: ${errMsg}`);
      setState({ sending: false, error: errMsg, ok: false });
    } catch (e: any) {
      log("Error de red: " + e.message);
      taskLog(taskPre, "Error de red: " + e.message);
      setState({ sending: false, error: e.message, ok: false });
    }
  }, [archivoListo, state.sending, createTaskLog, taskLog, triggerDatosAfterLectura, router, log]);

  const onReset = useCallback(() => {
    ["nombre", "correo", "numero_personas", "producto", "sucursal"].forEach((k) =>
      localStorage.removeItem(k)
    );
    // NUEVO: limpiar también teléfono y observaciones
    localStorage.removeItem("telefono");
    localStorage.removeItem("observaciones");

    if (refNombre.current) refNombre.current.value = "";
    if (refCorreo.current) refCorreo.current.value = "";
    if (refNumero.current) refNumero.current.value = "";
    if (refProducto.current) refProducto.current.value = "";
    if (refSucursal.current) refSucursal.current.value = "sede pereira";
    if (refTelefono.current) refTelefono.current.value = "";
    if (refObservaciones.current) refObservaciones.current.value = "";
    if (refFile.current) refFile.current.value = "";
    setArchivoListo(null);
    setState({ sending: false, error: null, ok: false });
    log("Formulario reiniciado.");
  }, [log]);

  const onLogout = useCallback(() => {
    ["nombre", "correo", "numero_personas", "producto", "sucursal"].forEach((k) =>
      localStorage.removeItem(k)
    );
    // NUEVO: limpiar también teléfono y observaciones
    localStorage.removeItem("telefono");
    localStorage.removeItem("observaciones");

    sessionStorage.clear();
    router.push("/login");
  }, [router]);

  // ----- Montaje (igual) -----
  useEffect(() => {
    bindPersistence();
    loadProductOptions();
    wirePasteAndDrop();
  }, [bindPersistence, loadProductOptions, wirePasteAndDrop]);

  return (
    <div className="wrap">
      {/* Logo 25% (centrado) */}
      <div className="brand-banner flex justify-center">
        <img src="/pagos.png" alt="Marca" className="w-1/5 h-auto" />
      </div>

      {/* ===== DATOS (título actualizado) ===== */}
      <section
        className="card max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-md shadow-md p-6"
        style={{ marginTop: 14 }}
      >
        <h2 className="text-lg font-semibold text-gray-700 capitalize dark:text-white">
          Registro desprendibles de pago
        </h2>

        <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="nombre">
              Nombre
            </label>
            <input
              id="nombre"
              ref={refNombre}
              type="text"
              placeholder="Juan Pérez"
              required
              autoComplete="username"
              className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
            />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="correo">
              Correo
            </label>
            <input
              id="correo"
              ref={refCorreo}
              type="text"
              placeholder="correo@dominio.com"
              autoComplete="email"
              className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
            />
          </div>

          {/* ===== NUEVO: Teléfono ===== */}
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="telefono">
              Teléfono
            </label>
            <input
              id="telefono"
              ref={refTelefono}
              type="tel"
              placeholder="+57 300 000 0000"
              className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
            />
          </div>

          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="numero_personas">
              Número de personas
            </label>
            <input
              id="numero_personas"
              ref={refNumero}
              type="number"
              min={1}
              placeholder="1"
              required
              className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
            />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="producto">
              Producto
            </label>
            <select
              id="producto"
              ref={refProducto}
              required
              defaultValue=""
              className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
            >
              <option value="">Selecciona…</option>
            </select>
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-200" htmlFor="sucursal">
              Sucursal
            </label>
            <select
              id="sucursal"
              ref={refSucursal}
              required
              defaultValue="sede pereira"
              className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
            >
              <option value="sede pereira">Sede Pereira</option>
              <option value="sede bogota">Sede Bogotá</option>
            </select>
          </div>

          {/* ===== NUEVO: Observaciones (textarea) ===== */}
          <div className="sm:col-span-2">
            <label className="text-gray-700 dark:text-gray-200" htmlFor="observaciones">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              ref={refObservaciones}
              rows={3}
              placeholder="Notas adicionales u observaciones…"
              className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
            />
          </div>
        </div>

        <small className="text-gray-400 block mt-2">
          Se guardan localmente y se envían con el archivo.
        </small>
      </section>

      {/* ===== ADJUNTAR (centrado) ===== */}
      <section className="card max-w-3xl mx-auto" style={{ marginTop: 14 }}>
        <h2 className="text-lg font-semibold text-center">Adjuntar o pegar imagen de pago</h2>

        <div>
          <label className="text-sm opacity-80" htmlFor="file">
            Archivo (PNG/JPG/GIF o PDF, máx 15MB)
          </label>

          <input
            id="file"
            ref={refFile}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,application/pdf"
            className="hidden"
          />

          <label
            htmlFor="file"
            ref={refDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") refFile.current?.click();
            }}
            className="flex flex-col items-center w-full max-w-lg p-5 mx-auto mt-2 text-center bg-white border-2 border-gray-300 border-dashed cursor-pointer dark:bg-gray-900 dark:border-gray-700 rounded-xl"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-8 h-8 text-gray-500 dark:text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3-3 3M6.75 19.5A4.5 4.5 0 0 1 5.34 10.725a5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75z"
              />
            </svg>

            <h3 className="mt-1 font-medium tracking-wide text-gray-700 dark:text-gray-200">
              Payment File
            </h3>
            <p className="mt-2 text-xs tracking-wide text-gray-500 dark:text-gray-400">
              Upload or drag &amp; drop your file SVG, PNG, JPG, GIF or PDF.
            </p>
          </label>
        </div>
      </section>

      {/* ===== GRUPO 3 BOTONES (centrado) ===== */}
      <section className="card max-w-3xl mx-auto" style={{ marginTop: 14 }}>
        <div className="w-full flex justify-center">
          <div className="flex overflow-hidden bg-white border divide-x rounded-lg rtl:flex-row-reverse dark:bg-gray-900 dark:border-gray-700 dark:divide-gray-700 w-fit">
            {/* Procesar */}
            <button
              type="button"
              onClick={() => {
                if (!state.sending) onProcesar();
              }}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 sm:text-base sm:px-6 dark:hover:bg-gray-800 dark:text-gray-300 gap-x-3 hover:bg-gray-100"
              aria-disabled={!valid || state.sending}
              title="Procesar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                />
              </svg>
              <span className="text-green-600">
                {state.sending ? "Procesando…" : "Procesar"}
              </span>
            </button>

            {/* Proceso manual */}
            <button
  type="button"
  onClick={() => {
    if (!state.sending) {
      router.push('/manualtotal');
    }
  }}
  className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 sm:text-base sm:px-6 dark:hover:bg-gray-800 dark:text-gray-300 gap-x-3 hover:bg-gray-100"
  title="Proceso manual"
>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                />
              </svg>
              <span>Proceso manual</span>
            </button>

            {/* Informe */}
            <button
  type="button"
  onClick={() => {
    if (!state.sending) {
      router.push("/rango");
      log("Ir a informe (/rango)");
    }
  }}
  className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 transition-colors duración-200 sm:text-base sm:px-6 dark:hover:bg-gray-800 dark:text-gray-300 gap-x-3 hover:bg-gray-100"
  title="Informe"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17v-4m3 4V7m3 10v-2M3.75 5.25v13.5A2.25 2.25 0 006 21h12a2.25 2.25 0 002.25-2.25V8.25L15.75 3H6A2.25 2.25 0 003.75 5.25z"
                />
              </svg>
              <span>Informe</span>
            </button>
          </div>
        </div>

        {/* Grupo “no color” -> Reiniciar / Atrás / Cerrar sesión (centrado) */}
        <div className="flex items-center gap-3 sm:gap-x-5 mt-4 justify-center">
          <button
            type="button"
            onClick={onReset}
            disabled={state.sending}
            title="Reiniciar"
            className="bg-white dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 rounded-lg hover:bg-gray-100 duración-300 transition-colors border px-4 py-2.5"
          >
            <svg
              className="w-5 h-5 sm:h-6 sm:w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.227V5.12M21 12a9 9 0 1 1-3.338-6.958M20.25 5.25l-4.227 4.098"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => router.push("/menu")}
            disabled={state.sending}
            title="Atrás"
            className="bg-white dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 rounded-lg hover:bg-gray-100 duración-300 transition-colors border px-4 py-2.5"
          >
            <svg
              className="w-5 h-5 sm:h-6 sm:w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onLogout}
            disabled={state.sending}
            title="Cerrar sección"
            className="bg-white dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 rounded-lg hover:bg-gray-100 duración-300 transition-colors border px-4 py-2.5"
          >
            <svg
              className="w-5 h-5 sm:h-6 sm:w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 2.25v7.5m6.364-3.864a9 9 0 1 1-12.728 0"
              />
            </svg>
          </button>
        </div>

        {/* Mensajes (igual) */}
        {state.error && (
          <div
            className="btn"
            role="alert"
            aria-live="polite"
            style={{ marginTop: 10, borderColor: "#3a2b0e", background: "#261d0a" }}
          >
            {state.error}
          </div>
        )}
      </section>

      {/* ===== Verificación de tareas (POP info Meraki, centrado y con warnings intactos) ===== */}
      <section className="card max-w-3xl mx-auto" style={{ marginTop: 14 }}>
        <div className="flex w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800">
          <div className="flex items-center justify-center w-12 bg-blue-500">
            <svg
              className="w-6 h-6 text-white fill-current"
              viewBox="0 0 40 40"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 3.33331C10.8 3.33331 3.33337 10.8 3.33337 20C3.33337 29.2 10.8 36.6666 20 36.6666C29.2 36.6666 36.6667 29.2 36.6667 20C36.6667 10.8 29.2 3.33331 20 3.33331ZM21.6667 28.3333H18.3334V25H21.6667V28.3333ZM21.6667 21.6666H18.3334V11.6666H21.6667V21.6666Z" />
            </svg>
          </div>
          <div className="px-4 py-3 flex-1">
            <div className="mb-1 font-semibold text-blue-600 dark:text-blue-400">
              Verificación de tareas
            </div>

            {/* Salida de log y tareas (tu wiring original) */}
            <div className="max-h-64 overflow-auto">
              <div id="out" ref={refLog} className="log" aria-live="polite" />
              <div style={{ height: 8 }} />
              <div id="tasks" ref={refTasks} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Toast SUCCESS: Archivo adjuntado ===== */}
      {showAttachOK && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800"
        >
          <div className="flex items-center justify-center w-12 bg-emerald-500 p-3">
            <svg
              className="w-6 h-6 text-white fill-current"
              viewBox="0 0 40 40"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 3.33331C10.8 3.33331 3.33337 10.8 3.33337 20C3.33337 29.2 10.8 36.6666 20 36.6666C29.2 36.6666 36.6667 29.2 36.6667 20C36.6667 10.8 29.2 3.33331 20 3.33331ZM16.6667 28.3333L8.33337 20L10.6834 17.65L16.6667 23.6166L29.3167 10.9666L31.6667 13.3333L16.6667 28.3333Z" />
            </svg>
          </div>
          <div className="px-4 py-2">
            <div className="font-semibold text-emerald-600 dark:text-emerald-400">
              Archivo adjuntado
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              {archivoListo?.name ?? "Archivo recibido."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
