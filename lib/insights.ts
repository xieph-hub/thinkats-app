// lib/insights.ts

export type InsightPost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string | null;
  tags: string[];
};

// For now we keep this local & static.
// You can later move this to a CMS or Notion again if you want.
const STATIC_INSIGHTS: InsightPost[] = [
  {
    id: "ai-in-hr-trends-2026",
    slug: "ai-in-hr-trends-2026",
    title: "AI in HR: Trends to Watch in 2026",
    summary:
      "How AI will reshape recruiting, performance, and workforce planning over the next 24 months.",
    publishedAt: "2025-01-01",
    tags: ["AI", "HR", "Future of Work"],
  },
  // Add more posts here as you create them
];

export async function fetchInsights(): Promise<InsightPost[]> {
  // Keep this async so you can later swap in a real data source.
  return STATIC_INSIGHTS;
}

export async function getInsightBySlug(
  slug: string
): Promise<InsightPost | null> {
  const post = STATIC_INSIGHTS.find((p) => p.slug === slug);
  return post ?? null;
}
