import { Client } from "@notionhq/client";

export type InsightPost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: string | null;
  tags: string[];
  coverImage?: string | null; // optional, for OG/Twitter cards
};

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

let notion: Client | null = null;

if (NOTION_API_KEY && NOTION_DATABASE_ID) {
  notion = new Client({ auth: NOTION_API_KEY });
} else {
  // Important: log, but DO NOT throw – so builds don’t crash
  console.warn(
    "Notion env vars missing (NOTION_API_KEY or NOTION_DATABASE_ID). Insights page will show placeholder content."
  );
}

export async function fetchInsights(): Promise<InsightPost[]> {
  // If there is no Notion client or DB ID, just return an empty list
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
      const props = page.properties;

      const title =
        props.Name?.title?.[0]?.plain_text ?? "Untitled";

      const slug =
        props.Slug?.rich_text?.[0]?.plain_text ??
        page.id.replace(/-/g, "").toLowerCase();

      const summary =
        props.Summary?.rich_text?.[0]?.plain_text ??
        "No summary available yet.";

      const publishedAt = props.PublishedAt?.date?.start ?? null;

      const tags =
        props.Tags?.multi_select?.map((t: any) => t.name) ?? [];

      // Optional cover image support if you have a "CoverImage" property
      let coverImage: string | null = null;
      const coverProp = props.CoverImage;
      if (coverProp?.files?.length) {
        const file = coverProp.files[0];
        if (file.type === "external") {
          coverImage = file.external?.url ?? null;
        } else if (file.type === "file") {
          coverImage = file.file?.url ?? null;
        }
      }

      return {
        id: page.id,
        title,
        slug,
        summary,
        publishedAt,
        tags,
        coverImage,
      };
    });
  } catch (err) {
    // This is where the Notion 500s were killing your build before.
    console.error("Error fetching insights from Notion", err);
    return [];
  }
}

export async function getInsightBySlug(
  slug: string
): Promise<InsightPost | null> {
  const posts = await fetchInsights();
  const normalizedSlug = slug.toLowerCase();

  const match =
    posts.find((p) => p.slug.toLowerCase() === normalizedSlug) ??
    posts.find(
      (p) => p.id.replace(/-/g, "").toLowerCase() === normalizedSlug
    );

  return match ?? null;
}
