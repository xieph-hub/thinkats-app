// lib/insights.ts
import { notion, INSIGHTS_DB_ID } from "./notion";
import type {
  PageObjectResponse,
  BlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

export type InsightMeta = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
  content: string | null; // <- main body from "Content (paste into Notion page body)"
};

export type InsightWithBlocks = InsightMeta & {
  blocks: BlockObjectResponse[];
};

function getPlainText(
  rich?: { plain_text: string }[] | null
): string {
  if (!rich || rich.length === 0) return "";
  return rich.map((r) => r.plain_text).join("");
}

function getCoverFromProperty(props: any): string | null {
  const coverProp = props.CoverURL;
  if (!coverProp) return null;

  // If CoverURL is a "url" property
  if (coverProp.type === "url") {
    return coverProp.url || null;
  }

  // If CoverURL is a "rich_text" property
  if (coverProp.type === "rich_text") {
    const fromRich = getPlainText(coverProp.rich_text);
    return fromRich || null;
  }

  return null;
}

function getCoverFromPage(page: PageObjectResponse): string | null {
  const cover = page.cover;
  if (!cover) return null;

  if (cover.type === "external") return cover.external.url;
  if (cover.type === "file") return cover.file.url;
  return null;
}

function getContentFromProperty(props: any): string | null {
  // Property name EXACTLY as it appears in the Notion DB:
  // "Content (paste into Notion page body)"
  const field = props["Content (paste into Notion page body)"];
  if (!field) return null;

  if (field.type === "rich_text") {
    const txt = getPlainText(field.rich_text);
    return txt || null;
  }

  // If you ever change it to "text" or "title", you can expand handling here.
  return null;
}

function mapInsightMeta(page: PageObjectResponse): InsightMeta {
  const props = page.properties as any;

  // Title (Title property)
  const title =
    getPlainText(props.Title?.title) || "Untitled insight";

  // Slug (rich_text or fallback to page id)
  const slug =
    getPlainText(props.Slug?.rich_text) ||
    page.id.replace(/-/g, "");

  // Excerpt (rich_text)
  const excerpt =
    getPlainText(props.Excerpt?.rich_text) || null;

  // Category (select)
  const category = props.Category?.select?.name ?? null;

  // Date (date field)
  const publishedAt = props.Date?.date?.start || null;

  // Prefer explicit CoverURL property, then page cover
  const coverFromProp = getCoverFromProperty(props);
  const coverFromPage = getCoverFromPage(page);
  const coverUrl = coverFromProp || coverFromPage;

  // Main content from "Content (paste into Notion page body)" property
  const content = getContentFromProperty(props);

  return {
    id: page.id,
    slug,
    title,
    category,
    excerpt,
    coverUrl,
    publishedAt,
    content,
  };
}

export async function getInsightsList(): Promise<InsightMeta[]> {
  if (!notion || !INSIGHTS_DB_ID) {
    console.warn(
      "[insights] Notion not configured – returning empty insights list."
    );
    return [];
  }

  const response = await notion.databases.query({
    database_id: INSIGHTS_DB_ID,
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

  return pages.map(mapInsightMeta);
}

export async function getInsightBySlug(
  slug: string
): Promise<InsightMeta | null> {
  if (!notion || !INSIGHTS_DB_ID) {
    console.warn(
      "[insights] Notion not configured – getInsightBySlug returning null."
    );
    return null;
  }

  const response = await notion.databases.query({
    database_id: INSIGHTS_DB_ID,
    filter: {
      property: "Slug",
      rich_text: {
        equals: slug,
      },
    },
    page_size: 1,
  });

  if (response.results.length === 0) return null;

  const page = response.results[0] as PageObjectResponse;
  return mapInsightMeta(page);
}

export async function getInsightBlocks(
  pageId: string
): Promise<BlockObjectResponse[]> {
  if (!notion) {
    console.warn(
      "[insights] Notion not configured – getInsightBlocks returning empty array."
    );
    return [];
  }

  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined = undefined;

  while (true) {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    const typed = res.results.filter(
      (b): b is BlockObjectResponse => b.object === "block"
    );

    blocks.push(...typed);

    if (!res.has_more || !res.next_cursor) break;
    cursor = res.next_cursor;
  }

  return blocks;
}
