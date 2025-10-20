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

  // ----- Constantes (igual) -----
  const MAX_BYTES = useMemo(() => 15 * 1024 * 1024, []);
  const ALLOWED = useMemo(
    () => new Set(["image/jpeg", "image/png", "image/gif", "application/pdf", "image/jpg"]),
    []
  );

  // ----- Cargar select opciones (igual) -----
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
              "Pasaporte actualizado",
            ];
      sel.innerHTML =
        '<option value="">Selecciona…</option>' +
        opts.map((v) => `<option value="${v}">${v}</option>`).join("");
      const saved = localStorage.getItem("producto") || "";
      if (saved) sel.value = saved;
    } catch (e) {
      sel.innerHTML =
        '<option value="">Selecciona…</option>' +
        [
          "Analisis de perfil",
          "Primera vez",
          "Renovación",
          "Actualización",
          "Radicación",
          "Recolección",
          "Corrección de formulario",
          "Corrección de cuenta",
          "Asesoría final",
          "Pasaporte actualizado",
        ]
          .map((v) => `<option value="${v}">${v}</option>`)
          .join("");
    }
  }, []);

  // ----- Validación archivo (igual) -----
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

  // ====== NUEVO: pegar desde portapapeles + mantener DnD/Input (ADITIVO) ======
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
      log("🧩 Datos: error cliente " + e.message);
    }
  }, [log]);

  // ----- Enviar (igual) -----
  const onProcesar = useCallback(async () => {
    const archivo = archivoListo || (refFile.current?.files || [])[0] || null;
    const nombre = refNombre.current?.value.trim() || "";
    const correo = refCorreo.current?.value.trim() || "";
    const producto = refProducto.current?.value.trim() || "";
    const numero = parseInt(refNumero.current?.value || "0", 10);
    const sucursal = refSucursal.current?.value || "";

    if (!archivo || !producto || !sucursal || !Number.isInteger(numero) || numero < 1) {
      setState((s) => ({ ...s, error: "Completa los campos obligatorios." }));
      return;
    }

    setState({ sending: true, error: null, ok: false });
    const taskPre = createTaskLog("Proceso " + new Date().toLocaleTimeString()) as HTMLPreElement;
    taskLog(taskPre, "⏳lectura...");

    const fd = new FormData();
    fd.append("file", archivo);
    fd.append(
      "meta",
      JSON.stringify({
        producto,
        numero_personas: numero,
        sucursal,
        nombre,
        correo,
      })
    );

    const cid = genCID();
    try {
      const res = await fetch("/api/_adj/adjuntar", {
        method: "POST",
        body: fd,
        headers: { "X-Correlation-Id": cid },
      });
      const txt = await res.text();
      let data: any; try { data = JSON.parse(txt); } catch { data = { raw: txt }; }

      if (res.ok && (data?.ok || data?.status === "ok")) {
        taskLog(taskPre, `✅ HTTP ${res.status}${data?.ok ? " · ok" : ""}`);
        setState({ sending: false, error: null, ok: true });
        triggerDatosAfterLectura(cid);
        router.push("/adjuntar");
        return;
      }

      taskLog(taskPre, `Error ${res.status}: ${txt}`);
      setState({ sending: false, error: `Error ${res.status}`, ok: false });
    } catch (e: any) {
      taskLog(taskPre, "CLIENT_ERROR: " + e.message);
      setState({ sending: false, error: e.message, ok: false });
    }
  }, [archivoListo, createTaskLog, taskLog, triggerDatosAfterLectura, router]);

  const onManual = useCallback(() => {
    router.push("/manualtotal");
  }, [router]);

  const onInforme = useCallback(() => {
    router.push("/rango");
  }, [router]);

  const onReset = useCallback(() => {
    setArchivoListo(null);
    if (refFile.current) refFile.current.value = "";
    setState({ sending: false, error: null, ok: false });
    log("Reinicio completado.");
  }, [log]);

  // ----- Montaje (igual) -----
  useEffect(() => {
    bindPersistence();
    loadProductOptions();
    wirePasteAndDrop();
  }, [bindPersistence, loadProductOptions, wirePasteAndDrop]);

  return (
    <div className="wrap">
      {/* Sección principal */}
      <section className="card max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-md shadow-md p-6" style={{ marginTop: 14 }}>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-white text-center">Adjuntar o pegar imagen de pago</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
          Archivo (PNG/JPG/GIF o PDF, máx 15MB)
        </p>

        {/* Dropzone + Input + Pegado */}
        <div className="mt-4 flex flex-col items-center">
          <label
            ref={refDrop}
            htmlFor="file"
            className="w-full max-w-2xl h-44 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Arrastra, haz clic o pega (Ctrl+V) aquí"
          >
            <div className="text-center">
              <div className="text-lg font-medium">Payment File</div>
              <div className="text-xs opacity-80">
                Upload or drag & drop your file SVG, PNG, JPG, GIF or PDF.
                <br />
                <strong>También puedes pegar (Ctrl+V) una captura o PDF desde el portapapeles.</strong>
              </div>
            </div>
            <input ref={refFile} id="file" type="file" accept=".png,.jpg,.jpeg,.gif,.pdf" className="hidden" />
          </label>

          {/* Botonera principal */}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={onProcesar} disabled={state.sending} className="btn">
              Procesar
            </button>
            <button type="button" onClick={onManual} disabled={state.sending} className="btn">
              Proceso manual
            </button>
            <button type="button" onClick={onInforme} disabled={state.sending} className="btn">
              Informe
            </button>
            <button type="button" onClick={onReset} disabled={state.sending} className="btn">
              Reiniciar
            </button>
          </div>

          {/* Estado */}
          {state.error && (
            <div className="btn" role="alert" aria-live="polite" style={{ marginTop: 10, borderColor: "#3a2b0e", background: "#261d0a" }}>
              {state.error}
            </div>
          )}

          {/* Toast de adjunto OK (no invasivo) */}
          {showAttachOK && (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-md border text-sm"
                 style={{ borderColor: "#16a34a", color: "#16a34a" }}>
              ✓ Archivo adjuntado
            </div>
          )}

          {/* Info de archivo listo */}
          {archivoListo && (
            <div className="mt-3 w-full max-w-2xl border rounded-md overflow-hidden">
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30">
                <div className="font-semibold text-emerald-700 dark:text-emerald-300">Archivo adjuntado</div>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  {archivoListo?.name ?? "Archivo recibido."}
                </p>
              </div>
            </div>
          )}
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
