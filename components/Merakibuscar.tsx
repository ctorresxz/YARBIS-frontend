'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Partes = {
  nombre?: string;
  fecha?: string;
  hora?: string;
  banco?: string;
  valor?: string;
  telefono?: string;
};

type Item = {
  filename: string;
  path_rel: string;
  size_bytes: number;
  mtime: string;
  ext: string;
  mime: string;
  parts: Partes;
  preview_url: string;
};

type Resp = {
  ok: boolean;
  count: number;
  limit: number;
  offset: number;
  results: Item[];
  correlation_id?: string;
};

const API_BASE = '/api/_buscar/query';
const EVID_BASE = '/api/_buscar/_evid/';

type LogLevel = 'ok' | 'info' | 'warn' | 'error' | 'auth';

export default function Buscar() {
  const router = useRouter();

  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<Item[]>([]);
  const [count, setCount] = useState(0);

  const logRef = useRef<HTMLPreElement>(null);

  const addLog = useCallback((text: string, _level: LogLevel = 'info') => {
    const pre = logRef.current;
    if (!pre) return;
    const ts = new Date().toLocaleTimeString();
    pre.append(`[${ts}] ${text}\n`);
    pre.scrollTop = pre.scrollHeight;
  }, []);

  const buildQuery = useCallback(() => {
    const usp = new URLSearchParams();
    if (q) usp.set('q', q);
    return usp.toString() ? `${API_BASE}?${usp.toString()}` : API_BASE;
  }, [q]);

  const resolveFileHref = useCallback((r: Item) => {
    if (r.preview_url && r.preview_url.startsWith('/_download/')) {
      return `${EVID_BASE}${encodeURIComponent(r.filename)}`;
    }
    if (r.preview_url?.startsWith('/')) {
      return `/api${r.preview_url}`;
    }
    return r.preview_url || '#';
  }, []);

  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrMsg(null);
    setLoading(true);
    setRows([]);
    setCount(0);

    const url = buildQuery();
    addLog(`GET ${url}`);
    const t0 = performance.now();

    try {
      const res = await fetch(url, {
        headers: { accept: 'application/json' },
        cache: 'no-store',
        credentials: 'include',
        mode: 'same-origin',
        redirect: 'follow',
      });
      addLog(`HTTP ${res.status}`);
      const ct = res.headers.get('content-type') || '';
      const data: Resp = ct.includes('application/json')
        ? await res.json()
        : await res.text().then((t) => {
            addLog(t, 'error');
            throw new Error(t);
          });
      const t1 = performance.now();

      addLog(`Recibido: ${JSON.stringify({ count: data.count, limit: data.limit, offset: data.offset })}`);
      addLog(`Duración: ${(t1 - t0).toFixed(1)} ms`);

      if (Array.isArray(data.results)) {
        setRows(data.results);
        setCount(data.count);
      } else {
        addLog('Respuesta sin lista de resultados', 'warn');
        setErrMsg('Respuesta inesperada del servidor.');
      }
    } catch (err: any) {
      setErrMsg(err?.message || 'Error de red');
      addLog(`Error: ${err}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [addLog, buildQuery]);

  const onReset = useCallback(() => {
    setQ('');
    setRows([]);
    setCount(0);
    setErrMsg(null);
    addLog('Campos y resultados limpiados.');
  }, [addLog]);

  const onAtras = useCallback(() => {
    router.push('/menu');
  }, [router]);

  const onLogout = useCallback(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    router.push('/login');
  }, [router]);

  // Búsqueda en vivo (debounce)
  React.useEffect(() => {
    const handler = setTimeout(async () => {
      if (!q || q.length < 2) return;
      setErrMsg(null);
      const url = buildQuery();
      addLog(`(live) GET ${url}`);
      try {
        const res = await fetch(url, {
          headers: { accept: 'application/json' },
          cache: 'no-store',
          credentials: 'include',
          mode: 'same-origin',
          redirect: 'follow',
        });
        const ct = res.headers.get('content-type') || '';
        const data: Resp = ct.includes('application/json')
          ? await res.json()
          : await res.text().then((t) => {
              addLog(t, 'error');
              throw new Error(t);
            });
        if (Array.isArray(data.results)) {
          setRows(data.results);
          setCount(data.count);
        }
      } catch (e: any) {
        addLog(`Live error: ${e?.message || e}`, 'warn');
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [q, buildQuery, addLog]);

  // === Tabla original (se conserva) ===
  const table = useMemo(() => {
    return (
      <div className="results" hidden={rows.length === 0}>
        <div className="pill" id="summary">
          <span>{count} resultados (mostrando {rows.length})</span>
        </div>
        <div
          style={{
            overflow: 'auto',
            maxHeight: 420,
            border: '1px solid var(--border)',
            borderRadius: 12,
            marginTop: 10,
          }}
        >
          <table id="tbl">
            <thead>
              <tr>
                <th>filename</th>
                <th>nombre</th>
                <th>fecha</th>
                <th>hora</th>
                <th>banco</th>
                <th>valor</th>
                <th>tel</th>
                <th>ext</th>
                <th className="mono">size</th>
                <th className="mono">mtime</th>
                <th>acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const p = r.parts || {};
                const href = resolveFileHref(r);
                return (
                  <tr key={r.filename}>
                    <td>
                      <a href={href} target="_blank" rel="noreferrer">
                        {r.filename}
                      </a>
                    </td>
                    <td>{p.nombre || ''}</td>
                    <td>{p.fecha || ''}</td>
                    <td>{p.hora || ''}</td>
                    <td>{p.banco || ''}</td>
                    <td>{p.valor || ''}</td>
                    <td>{p.telefono || ''}</td>
                    <td>{r.ext}</td>
                    <td className="mono">
                      {Number.isFinite(r.size_bytes) ? r.size_bytes.toLocaleString() : r.size_bytes}
                    </td>
                    <td className="mono">{r.mtime}</td>
                    <td>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          const url = resolveFileHref(r);
                          navigator.clipboard.writeText(url);
                          addLog(`Copiada URL de ${r.filename}`, 'ok');
                        }}
                      >
                        Copiar URL
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, [rows, count, resolveFileHref, addLog]);

  // === NUEVA interfaz de resultados (lista compacta) ===
  const pretty = useMemo(() => {
    return (
      <div className="results2" hidden={rows.length === 0}>
        <div className="pill" id="summary2">
          <span>{count} resultados (mostrando {rows.length})</span>
        </div>
        <div className="rlist">
          {rows.map((r) => {
            const p = r.parts || {};
            const href = resolveFileHref(r);
            const title = p.nombre || r.filename.replace(/\.[^/.]+$/, '');
            const meta = [p.fecha, p.hora, p.banco, p.valor].filter(Boolean).join(' • ') || r.mtime;
            return (
              <a key={r.filename} href={href} target="_blank" rel="noreferrer" className="ritem">
                <div className="rtitle">{title}</div>
                <div className="rmeta">{meta}</div>
              </a>
            );
          })}
        </div>
      </div>
    );
  }, [rows, count, resolveFileHref]);

  // Dropdown desactivado por ahora (se conserva)
  const dropdown = useMemo(() => null, []);

  return (
    <>
      {/* CABECERA */}
      <header className="hero">
        <img src="/buscar.png" alt="Buscar" className="hero-img" />
        <h1 className="hero-title">Buscar Comprobante de Pago</h1>
      </header>

      {/* TARJETA PRINCIPAL */}
      <div className="wrap">
        <section className="card" aria-labelledby="vtitle">
          <h2 id="vtitle" className="sr-only">Búsqueda</h2>

          <form id="f" autoComplete="off" onSubmit={onSubmit} className="form-inline">
            <label htmlFor="q" className="lbl">Escribir aqui:</label>
            <input
              id="q"
              name="q"
              placeholder="Nombre-Banco-Valor-Fecha"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {/* Botón Meraki con LUPA */}
            <button
              className="meraki-btn"
              id="go"
              type="submit"
              disabled={loading}
              aria-label="Buscar"
              title="Buscar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="meraki-ico"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <span>Buscar</span>
            </button>

            {/* Botón Limpiar oculto (se conserva) */}
            <button className="btn" id="reset" type="button" onClick={onReset} disabled={loading} style={{ display: 'none' }}>
              Limpiar campos
            </button>
          </form>

          {errMsg && (
            <div role="alert" aria-live="polite" style={{ marginTop: 8, color: '#b91c1c' }}>
              {errMsg}
            </div>
          )}

          {false && dropdown}

          {/* === NUEVOS RESULTADOS === */}
          {pretty}

          {/* === Tabla original OCULTA (preservada) === */}
          <div style={{ display: 'none' }}>{table}</div>
        </section>
      </div>

      {/* BOTONERA 3-EN-1 */}
      <div className="btnbar">
        <div className="seg-group">
          <button type="button" className="seg-btn" onClick={onReset} disabled={loading} title="Reiniciar">
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.227V5.12M21 12a9 9 0 1 1-3.338-6.958M20.25 5.25l-4.227 4.098"/>
            </svg>
            <span>Reiniciar</span>
          </button>

          <button type="button" className="seg-btn" onClick={onAtras} disabled={loading} title="Atrás">
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
            </svg>
            <span>Atrás</span>
          </button>

          <button
            type="button"
            className="seg-btn"
            onClick={onLogout}
            disabled={loading}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9"/>
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* VERIFICACIÓN */}
      <section className="tasks-card">
        <div className="tasks-inner">
          <div className="tasks-left">
            <svg className="w-6 h-6 text-white" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M20 3.33331C10.8 3.33331 3.33337 10.8 3.33337 20C3.33337 29.2 10.8 36.6666 20 36.6666C29.2 36.6666 36.6667 29.2 36.6667 20C36.6667 10.8 29.2 3.33331 20 3.33331ZM21.6667 28.3333H18.3334V25H21.6667V28.3333ZM21.6667 21.6666H18.3334V11.6666H21.6667V21.6666Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="tasks-right">
            <div className="tasks-title">Verificación de tareas</div>
            <div className="tasks-scroll">
              <pre id="log" className="tasks-log" role="log" aria-live="polite" ref={logRef}/>
            </div>
          </div>
        </div>
      </section>

      {/* ESTILOS */}
      <style jsx>{`
        :root{
          --bg:#f7f8fb; --text:#0f172a; --muted:#6b7280; --border:#e5e7eb;
          --focus:#2563eb; --accent:#111827; --accent-ink:#ffffff; --row:#fbfbfd;
        }
        html,body{height:100%;}
        .sr-only{position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;}

        /* Hero */
        .hero{display:flex; flex-direction:column; align-items:center; gap:12px; padding-top:22px}
        .hero-img{width:min(400px, 32vw); height:auto;}
        .hero-title{font-weight:700; font-size:20px; color:#111827; text-align:center}

        /* Card búsqueda */
        .wrap{display:grid; place-items:start center; padding:12px 16px}
        .card{
          width:min(980px, 96vw); background:#ffffff; border:1px solid var(--border);
          border-radius:16px; padding:18px; box-shadow:0 10px 34px rgba(16,24,40,.08);
        }
        .form-inline{display:flex; align-items:center; gap:10px; justify-content:center;}
        .lbl{font-size:12px; color:var(--muted); margin-right:4px}
        input{
          background:#ffffff; color:#111827; border:1px solid var(--border);
          border-radius:12px; padding:10px 12px; font-size:14px; outline:none;
          min-width:min(520px, 70vw);
        }
        input:focus{border-color:var(--focus); box-shadow:0 0 0 3px #2563eb22}

        /* Botón Meraki */
        .meraki-btn{
          display:flex; align-items:center; gap:8px;
          padding:10px 16px; font-weight:600; color:#fff;
          background:#2563eb; border:0; border-radius:10px; cursor:pointer;
          transition:transform .05s ease, background .2s ease;
        }
        .meraki-btn:hover{ background:#1d4ed8; }
        .meraki-btn:disabled{ opacity:.7; cursor:not-allowed; }
        .meraki-ico{ width:20px; height:20px; }

        .btn{appearance:none; border:1px solid var(--border); background:#ffffff; color:#111827; padding:9px 14px; border-radius:12px; font-size:14px; cursor:pointer;}
        .btn:hover{background:#f3f4f6}

        /* Botonera unida (3 botones) */
        .btnbar{display:flex; justify-content:center; margin:12px 0 2px}
        .seg-group{display:flex; overflow:hidden; border:1px solid #d1d5db; border-radius:14px; background:#fff;}
        .seg-btn{display:flex; align-items:center; gap:8px; padding:10px 16px; font-size:14px; color:#4b5563; background:#fff; border:none; cursor:pointer;}
        .seg-btn + .seg-btn{border-left:1px solid #e5e7eb;}
        .seg-btn:hover{background:#f3f4f6}
        .ico{width:20px; height:20px}

        /* Resultados (tabla original) */
        .results{margin-top:14px}
        table{width:100%; border-collapse:separate; border-spacing:0; font-size:13px}
        thead th{position:sticky; top:0; background:#fafafa; z-index:1}
        th, td{border-bottom:1px solid var(--border); padding:8px 10px; text-align:left}
        tbody tr:nth-child(odd){background:var(--row)}
        .mono{font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace}
        .pill{display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border-radius:999px; border:1px solid var(--border); background:#fff}

        /* Verificación (claro) */
        .tasks-card{display:flex; justify-content:center; padding:8px 16px 24px}
        .tasks-inner{width:min(720px, 92vw); display:flex; background:#ffffff; border:1px solid var(--border); border-radius:12px; overflow:hidden; box-shadow:0 8px 28px rgba(16,24,40,.06);}
        .tasks-left{width:48px; min-width:48px; display:flex; align-items:center; justify-content:center; background:#3b82f6}
        .tasks-right{flex:1; padding:10px 12px}
        .tasks-title{font-weight:600; color:#2563eb; margin-bottom:6px}
        .tasks-scroll{max-height:200px; overflow:auto}
        .tasks-log{margin:0; white-space:pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; font-size:13px; color:#111827;}
      `}</style>

      {/* Estilos resultados NUEVOS */}
      <style jsx>{`
        .results2{ margin-top:14px; }
        .results2 .pill{ background:#ffffff; border:1px solid #e5e7eb; color:#111827; }
        .rlist{ margin-top:8px; border:1px solid #e5e7eb; background:#ffffff; border-radius:12px; box-shadow:0 10px 34px rgba(16,24,40,.08); max-height:420px; overflow:auto; }
        .ritem{ display:block; padding:12px 10px; text-decoration:none; color:#111827; border-bottom:1px solid #e5e7eb; }
        .ritem:last-child{ border-bottom:none; }
        .ritem:hover{ background:#f3f4f6; }
        .rtitle{ font-weight:600; margin:0 0 2px; }
        .rmeta{ font-size:12px; color:#6b7280; margin:0; }
      `}</style>

      {/* Estilos dropdown retenidos */}
      <style jsx>{`
        .meraki-search{ position:relative; width:min(520px, 96%); margin:8px auto 4px; }
        .meraki-input{ position:relative; }
        .meraki-dd{ position:absolute; left:0; right:0; margin-top:10px; background:#ffffff; color:#111; border:1px solid var(--border); border-radius:12px; max-height:18rem; overflow-y:auto; padding:8px 10px; box-shadow:0 12px 24px rgba(0,0,0,.12); z-index:50; }
        .meraki-item{ display:block; padding:10px 6px; text-decoration:none; color:inherit; border-radius:8px; }
        .meraki-item:hover{ background:#f4f6f8; }
        .meraki-item h3{ margin:0; font-size:14px; font-weight:600; }
        .meraki-item p{ margin:2px 0 0; font-size:12px; color:#6b7280; }
      `}</style>
    </>
  );
}
