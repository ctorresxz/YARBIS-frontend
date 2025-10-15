// components/Merakimenu.tsx
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Merakimenu() {
  const router = useRouter();

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    router.push("/login");
  }

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="flex flex-col w-64 h-screen px-5 py-8 overflow-y-auto bg-white border-r rtl:border-r-0 rtl:border-l dark:bg-gray-900 dark:border-gray-700">
        <Link href="#">
          <img className="w-auto h-10 sm:h-12" src="/Para fondo blanco.png" alt="Logo" />
        </Link>

        <div className="flex flex-col justify-between flex-1 mt-6">
          <nav className="-mx-3 space-y-6">
            {/* Menu principal */}
            <div className="space-y-3">
              <label className="px-3 text-xs text-gray-500 uppercase dark:text-gray-400">
                Menu principal YARVIS
              </label>

              {/* Registro de pagos (antes: Pagos) */}
              <Link
                className="flex items-center px-3 py-2 text-gray-600 rounded-lg transition-colors duration-300 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 hover:text-gray-700"
                href="/adjuntar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
                <span className="mx-2 text-sm font-medium">Registro de pagos</span>
              </Link>

              {/* Proceso manual de pagos (ícono reemplazado + orden intermedio) */}
              <Link
                className="flex items-center px-3 py-2 text-gray-600 rounded-lg transition-colors duration-300 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 hover:text-gray-700"
                href="/manualtotal"
              >
                {/* SVG que enviaste, adaptado a React (strokeWidth/className) */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                <span className="mx-2 text-sm font-medium">Proceso manual de pagos</span>
              </Link>

              {/* Informe de pagos */}
              <Link
                className="flex items-center px-3 py-2 text-gray-600 rounded-lg transition-colors duration-300 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 hover:text-gray-700"
                href="/rango"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
                <span className="mx-2 text-sm font-medium">Informe de pagos</span>
              </Link>
            </div>

            {/* Sección CONTENT: eliminada a tu solicitud */}

            {/* CUSTOMIZATION */}
            <div className="space-y-3">
              <label className="px-3 text-xs text-gray-500 uppercase dark:text-gray-400">CUSTOMIZATION</label>

              <Link className="flex items-center px-3 py-2 text-gray-600 rounded-lg transition-colors duration-300 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 hover:text-gray-700" href="/themes">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
                </svg>
                <span className="mx-2 text-sm font-medium">Por asignar</span>
              </Link>

              <Link className="flex items-center px-3 py-2 text-gray-600 rounded-lg transition-colors duration-300 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 hover:text-gray-700" href="/settings">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="mx-2 text-sm font-medium">Por asignar</span>
              </Link>
            </div>

            {/* LOGOUT */}
            <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-red-600 rounded-lg transition-colors duration-300 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900 hover:text-red-700 w-full text-left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
                </svg>
                <span className="mx-2 text-sm font-medium">Salir</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main content (bienvenida) */}
      <main className="flex-1 p-8">
        {/* Contenedor relativo para el contenido */}
        <div className="relative min-h-[70vh]">
          <div className="text-center mt-20">
            <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">
              Bienvenido a YARVIS
            </h1>
            <p className="text-gray-500 mt-2">
              Aplicación creada para gestionar todos los procesos de Visas Americanas Colombia.
            </p>
            <p className="text-gray-500 mt-2">
              Selecciona una opción del menú lateral para comenzar.
            </p>
          </div>
        </div>

        {/* PNG anclado abajo y centrado en el panel derecho.
            Ancho = 40% del panel derecho, pero con tope: altura máx = 50vh */}
        <div className="pointer-events-none select-none fixed bottom-2 -translate-x-1/2 flex justify-center w-[calc((100vw-16rem)*0.4)] left-[calc(16rem+((100vw-16rem)/2))]">
          <img
            src="/estatualibertad.png"
            alt="Estatua de la Libertad"
            className="w-full h-auto object-contain max-h-[50vh]"
          />
        </div>
      </main>
    </div>
  );
}
