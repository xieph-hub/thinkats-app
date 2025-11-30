// app/sitemap.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL ?? "https://thinkats.com";

  const paths = [
    "", // home
    "/product",
    "/career-sites",
    "/solutions",
    "/pricing",
    "/resources",
    "/company",
    "/jobs",
    "/ats/dashboard",
  ];

  const lastModified = new Date().toISOString();

  return paths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
  }));
}
