/** @type {import('tailwindcss').Config} */
const daisyui = require("daisyui");

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: { themes: ["corporate", "light", "dark"] },
};
