import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        risk: {
          low: "#3b82f6",
          sweet: "#22c55e",
          caution: "#f59e0b",
          high: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
