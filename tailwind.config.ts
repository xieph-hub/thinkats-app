
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0A66C2",
          yellow: "#FFC107",
          green: "#10B981",
          dark: "#0B1220",
          light: "#F5F8FF",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(10,102,194,0.12)",
      },
      borderRadius: {
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;
