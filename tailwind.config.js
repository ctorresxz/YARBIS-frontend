// tailwind.config.js
import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  // Rutas donde Tailwind debe escanear clases
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  // Activa DaisyUI como plugin
  plugins: [daisyui],
  // Temas DaisyUI (elige los que quieras)
  daisyui: {
    themes: ["corporate", "light", "dark"],
  },
};
