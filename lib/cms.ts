// lib/cms.ts

import { Client } from "@notionhq/client";
import { marked } from "marked";

export type CMSPost = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  date: string | null;
  publishedAt: string | null;
  tags: string[];
  contentHtml: string | null;
};

const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

const hasNotion = !!notionApiKey && !!notionDatabaseId;
const notion = hasNotion ? new Client({ auth: notionApiKey }) : null;

/**
 * Map a Notion page into our CMSPost shape
 */
function mapPageToPost(page: any): CMSPost | null {
  if (!page || !page.properties) return null;

  const props = page.properties;

  const titleProp = props.Name || props.Title;
  const slugProp = props.Slug;
  const summaryProp = props.Summary || props.Description;
  const publishedProp = props.PublishedAt || props.Published || props.Date;
  const contentProp = props.Content || props.Body;

  const title =
    titleProp?.title?.[0]?.plain_text ??
    titleProp?.rich_text?.[0]?.plain_text ??
    "";

  const slug =
    slugProp?.rich_text?.[0]?.plain_text ??
    slugProp?.title?.[0]?.plain_text ??
    "";

  const summary =
    summaryProp?.rich_text?.[0]?.plain_text ??
    summaryProp?.title?.[0]?.plain_text ??
    null;

  const publishedAt =
    publishedProp?.date?.start ??
    page.created_time ??
    null;

  const tags =
    (props.Tags?.multi_select ?? []).map((t: any) => t.name) ?? [];

  let contentHtml: string | null = null;
  if (contentProp?.rich_text?.length) {
    const markdown = contentProp.rich_text
      .map((t: any) => t.plain_text)
      .join("\n\n");
    contentHtml = marked.parse(markdown) as string;
  }

  if (!slug || !title) return null;

  return {
    id: page.id,
    slug,
    title,
    summary,
    date: publishedAt,
    publishedAt,
    tags,
    contentHtml,
  };
}

/**
 * Fetch all posts from Notion.
 * - Sorts by created_time (so we don’t depend on a custom property).
 * - If Notion misbehaves, we just return [] so the build doesn’t fail.
 */
export async function getAllPostsCMS(): Promise<CMSPost[]> {
  if (!notion || !notionDatabaseId) {
    console.warn(
      "[cms] Notion is not configured (NOTION_API_KEY / NOTION_DATABASE_ID missing). Returning empty posts list."
    );
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: notionDatabaseId,
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
      // You can add a filter here later, e.g. Status = "Published"
    });

    return response.results
      .map((page: any) => mapPageToPost(page))
      .filter((p): p is CMSPost => !!p);
  } catch (error) {
    console.error("[cms] Error fetching posts from Notion:", error);
    return [];
  }
}

/**
 * Fetch a single post by slug.
 */
export async function getPostCMS(slug: string): Promise<CMSPost | null> {
  if (!notion || !notionDatabaseId) {
    console.warn(
      "[cms] Notion is not configured (NOTION_API_KEY / NOTION_DATABASE_ID missing). Returning null for post."
    );
    return null;
  }

  try {
    const response = await notion.databases.query({
      database_id: notionDatabaseId,
      filter: {
        property: "Slug",
        rich_text: {
          equals: slug,
        },
      },
      page_size: 1,
    });

    const page = response.results[0] as any;
    if (!page) return null;

    return mapPageToPost(page);
  } catch (error) {
    console.error(`[cms] Error fetching post with slug "${slug}" from Notion:`, error);
    return null;
  }
}
