// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ThinkATS – Modern ATS & Career Sites Engine",
    short_name: "ThinkATS",
    description:
      "ThinkATS is a modern, multi-tenant ATS and white-label career sites engine for recruitment agencies and in-house HR teams.",

    // Where the PWA starts when “installed”
    start_url: "/",
    scope: "/",

    display: "standalone", // looks like a native app (no browser chrome)
    orientation: "portrait-primary",

    // Brand theming for the install UI & browser UI
    theme_color: "#2563EB",      // Electric Blue – primary CTA colour
    background_color: "#F9FAFB", // Surface White – app background

    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      // optional: if you later create a maskable version
      // {
      //   src: "/icon-512-maskable.png",
      //   sizes: "512x512",
      //   type: "image/png",
      //   purpose: "maskable",
      // },
    ],
  };
}
