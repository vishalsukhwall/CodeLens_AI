import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blueprint: {
          950: "#070B14",
          900: "#0B1120",
          850: "#0F1623",
          800: "#1E293B",
          700: "#334155",
        },
        brand: {
          indigo: "#6366F1",
          amber: "#F59E0B",
          rose: "#F43F5E",
          emerald: "#10B981",
          cyan: "#06B6D4",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "Consolas", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
