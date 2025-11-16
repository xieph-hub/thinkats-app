// app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/cms";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL || "https://resourcin.com";

  // Core static routes you have in navigation
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/jobs",
    "/talent-network",
    "/for-candidates",
    "/for-employers",
    "/services",
    "/case-studies",
    "/insights",
    "/about",
    "/contact",
    "/request-talent",
    "/login",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));

  // Dynamic Insights posts from Notion
  const posts = await getAllPosts();
  const insightRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/insights/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
  }));

  return [...staticRoutes, ...insightRoutes];
}
