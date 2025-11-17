// lib/insights.ts
import { Client } from "@notionhq/client";

export type InsightPost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string | null;
  tags: string[];
};

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

let notion: Client | null = null;

if (NOTION_API_KEY && NOTION_DATABASE_ID) {
  notion = new Client({ auth: NOTION_API_KEY });
} else {
  // Important: log, but DO NOT throw – so builds don’t crash
  console.warn(
    "Notion env vars missing (NOTION_API_KEY or NOTION_DATABASE_ID). Insights will fall back to empty lists."
  );
}

/**
 * Fetch all published insight posts from Notion.
 * Safe: on any error, returns [] instead of throwing.
 */
export async function fetchInsights(): Promise<InsightPost[]> {
  if (!notion || !NOTION_DATABASE_ID) {
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      sorts: [
        {
          property: "PublishedAt",
          direction: "descending",
        },
      ],
      filter: {
        property: "Status",
        status: { equals: "Published" },
      },
    });

    return response.results.map((page: any) => {
      const props = page.properties ?? {};

      const title =
        props.Name?.title?.[0]?.plain_text ??
        "Untitled";

      const slug =
        props.Slug?.rich_text?.[0]?.plain_text ??
        page.id.replace(/-/g, "").toLowerCase();

      const summary =
        props.Summary?.rich_text?.[0]?.plain_text ??
        "No summary available yet.";

      const publishedAt = props.PublishedAt?.date?.start ?? null;

      const tags =
        props.Tags?.multi_select?.map((t: any) => t.name) ?? [];

      return {
        id: page.id,
        title,
        slug,
        summary,
        publishedAt,
        tags,
      } as InsightPost;
    });
  } catch (err) {
    console.error("[Notion] fetchInsights failed:", err);
    // Critical: never break build – just return empty
    return [];
  }
}

/**
 * Find a single insight by slug.
 * Safe: returns null on error or not found.
 */
export async function getInsightBySlug(
  slug: string
): Promise<InsightPost | null> {
  const posts = await fetchInsights();
  return posts.find((p) => p.slug === slug) ?? null;
}
