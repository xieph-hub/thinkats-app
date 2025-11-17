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

  // Handle both URL + rich_text property types
  if (coverProp.type === "url") {
    return coverProp.url ?? null;
  }

  if (coverProp.type === "rich_text") {
    const val = getPlainText(coverProp.rich_text);
    return val || null;
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

function mapInsightMeta(page: PageObjectResponse): InsightMeta {
  const props = page.properties as any;

  const title =
    getPlainText(props.Title?.title) || "Untitled insight";

  const slug =
    getPlainText(props.Slug?.rich_text) ||
    page.id.replace(/-/g, "");

  const excerpt =
    getPlainText(props.Excerpt?.rich_text) || null;

  const category = props.Category?.select?.name ?? null;

  const publishedAt = props.Date?.date?.start || null;

  // Prefer CoverURL property, then page cover
  const coverFromProp = getCoverFromProperty(props);
  const coverFromPage = getCoverFromPage(page);
  const coverUrl = coverFromProp || coverFromPage;

  return {
    id: page.id,
    slug,
    title,
    category,
    excerpt,
    coverUrl,
    publishedAt,
  };
}

export async function getInsightsList(): Promise<InsightMeta[]> {
  const response = await notion.databases.query({
    database_id: INSIGHTS_DB_ID!,
    // No Status filter – you didn't define one
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
  const response = await notion.databases.query({
    database_id: INSIGHTS_DB_ID!,
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
