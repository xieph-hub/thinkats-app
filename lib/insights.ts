// lib/insights.ts
import { Client } from "@notionhq/client";
import type {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

const notionToken =
  process.env.NOTION_API_KEY ||
  process.env.NOTION_TOKEN ||
  process.env.NOTION_SECRET;

if (!notionToken) {
  throw new Error(
    "Missing Notion API key. Set NOTION_API_KEY (or NOTION_TOKEN / NOTION_SECRET) in your env."
  );
}

const notion = new Client({
  auth: notionToken,
});

const databaseId = process.env.NOTION_DATABASE_ID;

if (!databaseId) {
  throw new Error("Missing NOTION_DATABASE_ID in env");
}

export type InsightMeta = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
  content: string | null;
};

export async function getInsightsList(): Promise<InsightMeta[]> {
  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [
      {
        property: "Date",
        direction: "descending",
      },
    ],
  });

  const pages = response.results.filter(
    (r): r is PageObjectResponse => r.object === "page"
  );

  const insights = await Promise.all(pages.map(mapPageToInsight));

  // Only keep pages that actually have a slug + title
  return insights.filter((i) => i.slug && i.title);
}

export async function getInsightBySlug(
  slug: string
): Promise<InsightMeta | null> {
  if (!slug) return null;

  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Slug",
      rich_text: {
        equals: slug,
      },
    },
    page_size: 1,
  });

  if (!response.results.length) return null;
  const page = response.results[0] as PageObjectResponse;
  return await mapPageToInsight(page);
}

export async function getInsightBlocks(
  pageId: string
): Promise<BlockObjectResponse[]> {
  if (!pageId) return [];

  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;

  while (true) {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    blocks.push(
      ...response.results.filter(
        (b): b is BlockObjectResponse => b.object === "block"
      )
    );

    if (!response.has_more || !response.next_cursor) break;
    cursor = response.next_cursor;
  }

  return blocks;
}

async function mapPageToInsight(
  page: PageObjectResponse
): Promise<InsightMeta> {
  const title =
    getTextProperty(page, "Title") ?? "Untitled insight";
  const slug = getTextProperty(page, "Slug") ?? "";
  const excerpt = getTextProperty(page, "Excerpt");
  const content = getTextProperty(
    page,
    "Content (paste into Notion page body)"
  );
  const coverUrl = getTextProperty(page, "CoverURL (optional)");
  const publishedAt = getDateProperty(page, "Date");
  const category = await getCategoryProperty(page);

  return {
    id: page.id,
    title,
    slug,
    excerpt,
    content,
    coverUrl,
    publishedAt,
    category,
  };
}

// ---------- helpers ----------

function getTextProperty(
  page: PageObjectResponse,
  propertyName: string
): string | null {
  const prop = (page.properties as any)[propertyName];
  if (!prop) return null;

  if (prop.type === "title") {
    const text = prop.title.map((t: any) => t.plain_text).join("");
    return text.trim() || null;
  }

  if (prop.type === "rich_text") {
    const text = prop.rich_text
      .map((t: any) => t.plain_text)
      .join("");
    return text.trim() || null;
  }

  if (prop.type === "url") {
    return prop.url ?? null;
  }

  if (prop.type === "formula" && prop.formula.type === "string") {
    return prop.formula.string ?? null;
  }

  return null;
}

function getDateProperty(
  page: PageObjectResponse,
  propertyName: string
): string | null {
  const prop = (page.properties as any)[propertyName];
  if (!prop || prop.type !== "date" || !prop.date?.start) return null;
  return prop.date.start;
}

/**
 * Category can be:
 * - select / multi_select
 * - relation to a Category table
 * - plain rich_text (fallback)
 */
async function getCategoryProperty(
  page: PageObjectResponse
): Promise<string | null> {
  const prop = (page.properties as any)["Category"];
  if (!prop) return null;

  // Simple select
  if (prop.type === "select") {
    return prop.select?.name ?? null;
  }

  // Multi-select (we take the first option for now)
  if (prop.type === "multi_select") {
    if (!prop.multi_select.length) return null;
    return prop.multi_select[0].name ?? null;
  }

  // Relation to Category table – use the related page's title
  if (prop.type === "relation") {
    if (!prop.relation || !prop.relation.length) return null;
    const first = prop.relation[0];
    try {
      const related = await notion.pages.retrieve({
        page_id: first.id,
      });

      if (related.object === "page") {
        const name = extractTitleFromAnyPage(
          related as PageObjectResponse
        );
        return name;
      }
    } catch (err) {
      console.error("Error resolving category relation", err);
    }
    return null;
  }

  // Fallback: treat as text
  if (prop.type === "rich_text") {
    const text = prop.rich_text
      .map((t: any) => t.plain_text)
      .join("");
    return text.trim() || null;
  }

  return null;
}

function extractTitleFromAnyPage(
  page: PageObjectResponse
): string | null {
  const props = page.properties as any;
  for (const key of Object.keys(props)) {
    const prop = props[key];
    if (prop?.type === "title") {
      const text = prop.title.map((t: any) => t.plain_text).join("");
      return text.trim() || null;
    }
  }
  return null;
}
