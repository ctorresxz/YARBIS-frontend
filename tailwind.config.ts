import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  // @ts-expect-error: clave extra para DaisyUI que TS no tipa en UserConfig
  daisyui: {
    themes: ["corporate", "light", "dark"],
  },
} satisfies Config;

export default config;
