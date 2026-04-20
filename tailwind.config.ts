import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FF5722",
          "orange-light": "#FF7043",
          "orange-dark": "#E64A19",
          cream: "#FFF8F3",
          "cream-dark": "#F5EDE4",
          warm: "#FFF3E0",
        },
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
        "spin-slow": "spin 2s linear infinite",
        shimmer: "shimmer 1.5s infinite",
        "tab-fade": "tabFadeIn 0.3s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        tabFadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "orange-sm": "0 2px 10px rgba(255,87,34,0.12)",
        "orange-md": "0 4px 16px rgba(255,87,34,0.25)",
        "orange-lg": "0 6px 24px rgba(255,87,34,0.35)",
        "card": "0 2px 20px rgba(255,87,34,0.10), 0 1px 4px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
