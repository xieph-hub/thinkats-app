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
  console.warn(
    "Notion env vars missing (NOTION_API_KEY or NOTION_DATABASE_ID). Insights page will show placeholder content."
  );
}

export async function fetchInsights(): Promise<InsightPost[]> {
  if (!notion || !NOTION_DATABASE_ID) {
    // No Notion config → just show “coming soon” UI
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,

      // ✅ SAFE SORT: no custom property names, just last_edited_time
      sorts: [
        {
          timestamp: "last_edited_time",
          direction: "descending",
        },
      ],

      // ✅ Filter only if the database actually has a Status property
      // If your DB doesn't have "Status", just temporarily remove this filter.
      filter: {
        property: "Status",
        status: { equals: "Published" },
      },
    });

    return response.results.map((page: any) => {
      const props = page.properties ?? {};

      const title =
        props.Name?.title?.[0]?.plain_text ??
        props.Title?.title?.[0]?.plain_text ??
        "Untitled";

      const slug =
        props.Slug?.rich_text?.[0]?.plain_text ??
        page.id.replace(/-/g, "").toLowerCase();

      const summary =
        props.Summary?.rich_text?.[0]?.plain_text ??
        props.Description?.rich_text?.[0]?.plain_text ??
        "No summary available yet.";

      const publishedAt =
        props.PublishedAt?.date?.start ??
        props.Date?.date?.start ??
        page.created_time ??
        page.last_edited_time ??
        null;

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
    // ✅ Never let Notion errors break your build
    console.error("Failed to fetch insights from Notion", err);
    return [];
  }
}
