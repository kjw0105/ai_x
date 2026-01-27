import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

export default {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#22c55e",
        "primary-content": "#ffffff",
        secondary: "#fbbf24",
        "background-light": "#f8fafc",
        "background-dark": "#111827",
        "surface-dark": "#1f2937",
        "chat-bg": "#eef2ff",
        "chat-bubble-ai": "#ffffff",
        "chat-bubble-user": "#22c55e"
      },
      fontFamily: {
        display: ["Manrope", "sans-serif", "Apple SD Gothic Neo", "Malgun Gothic", "Dotum"]
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        full: "9999px"
      }
    }
  },
  plugins: [forms, containerQueries]
} satisfies Config;
