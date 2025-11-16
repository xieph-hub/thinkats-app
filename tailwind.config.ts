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
         blue: "#172965",
        yellow: "#FFC000",
        greenDark: "#306B34",
        green: "#64C247",
        navy: "#000435",
      },
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
