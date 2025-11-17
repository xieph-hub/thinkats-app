// lib/insights.ts (or wherever this lives now)
// No Notion imports. Completely local / static for now.

export type InsightPost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string | null;
  tags: string[];
};

// Temporary local “blog database” so builds never touch Notion.
// Add/edit posts here as needed.
const LOCAL_INSIGHTS: InsightPost[] = [
  {
    id: "ai-in-hr-trends-2026",
    title: "AI in HR: Trends for 2026",
    slug: "ai-in-hr-trends-2026",
    summary:
      "A placeholder article on how AI is reshaping hiring, performance and learning. Full content will ship once we rebuild the insights stack.",
    publishedAt: "2025-01-01",
    tags: ["AI", "HR", "Trends"],
  },
  // You can add more posts here later:
  // {
  //   id: "another-post-id",
  //   title: "Some other topic",
  //   slug: "some-other-topic",
  //   summary: "Short summary...",
  //   publishedAt: "2025-02-15",
  //   tags: ["Strategy"],
  // },
];

/**
 * List all insights.
 * Used by the /insights index page, generateStaticParams, etc.
 */
export async function fetchInsights(): Promise<InsightPost[]> {
  // In future, you can swap this to fetch from a DB / MDX / wherever.
  return LOCAL_INSIGHTS;
}

/**
 * Get a single insight by slug.
 * Safe helper for the [slug] page.
 */
export async function getInsightBySlug(
  slug: string
): Promise<InsightPost | null> {
  const posts = await fetchInsights();
  return posts.find((p) => p.slug === slug) ?? null;
}
