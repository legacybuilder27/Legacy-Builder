import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#f6f1e7",
          2: "#efe6d6",
          3: "#e6d9c4",
        },
        ink: {
          DEFAULT: "#241f1a",
          soft: "#5e564c",
          faint: "#7d7468",
        },
        line: "#ddd2c0",
        clay: {
          DEFAULT: "#8d4b34",
          deep: "#6f3826",
        },
        pine: "#24543d",
        mark: "#f3e2b8",
      },
      fontFamily: {
        sans: ['"Source Sans 3"', "Segoe UI", "sans-serif"],
        serif: ['"Source Serif 4"', "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.7) inset, 0 12px 30px rgba(70, 48, 24, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
