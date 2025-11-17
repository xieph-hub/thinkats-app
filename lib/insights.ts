// lib/insights.ts
import { notion, INSIGHTS_DB_ID } from "./notion";
import type {
  PageObjectResponse,
  BlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

// ...types + helpers unchanged...

export async function getInsightsList(): Promise<InsightMeta[]> {
  if (!notion || !INSIGHTS_DB_ID) {
    // Fail soft: no data instead of killing the build
    console.warn("Notion insights not configured");
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
    console.warn("Notion insights not configured");
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
    console.warn("Notion client not configured");
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
