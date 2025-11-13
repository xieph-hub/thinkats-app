import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}"
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
          navy: "#172965"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(10,102,194,0.12)"
      },
      borderRadius: {
        pill: "9999px"
      }
    }
  },
  plugins: [typography]
};
export default config;
