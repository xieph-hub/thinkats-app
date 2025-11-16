import { Client } from "@notionhq/client";

const notionSecret = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_INSIGHTS_DATABASE_ID;

if (!notionSecret) {
  throw new Error("NOTION_API_KEY is not set in environment variables");
}

if (!databaseId) {
  throw new Error("NOTION_INSIGHTS_DATABASE_ID is not set in environment variables");
}

const notion = new Client({ auth: notionSecret });

export type InsightPost = {
  id: string;
  slug: string;
  title: string;
  tag?: string;
  readingTime?: string;
  summary?: string;
  publishedAt?: string;
};

export async function getInsightPosts(): Promise<InsightPost[]> {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Status", // Notion property: Status
      status: { equals: "Published" },
    },
    sorts: [
      {
        property: "Published", // Notion property: Published (date)
        direction: "descending",
      },
    ],
  });

  return response.results
    .map((page: any): InsightPost | null => {
      const props = page.properties;

      const title =
        props.Name?.title?.[0]?.plain_text ??
        props.Title?.title?.[0]?.plain_text ??
        null;

      if (!title) return null;

      const slug =
        props.Slug?.rich_text?.[0]?.plain_text ??
        props.Slug?.formula?.string ??
        page.id;

      const tag = props.Tag?.select?.name;
      const readingTime =
        props["Reading time"]?.rich_text?.[0]?.plain_text ||
        props["Reading Time"]?.rich_text?.[0]?.plain_text;

      const summary =
        props.Summary?.rich_text?.[0]?.plain_text ??
        props.Description?.rich_text?.[0]?.plain_text ??
        "";

      const publishedAt = props.Published?.date?.start ?? undefined;

      return {
        id: page.id,
        slug,
        title,
        tag,
        readingTime,
        summary,
        publishedAt,
      };
    })
    .filter((p): p is InsightPost => p !== null);
}
