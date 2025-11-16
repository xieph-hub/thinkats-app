import { Client } from "@notionhq/client";
import { marked } from "marked";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notion =
  NOTION_API_KEY && NOTION_DATABASE_ID
    ? new Client({ auth: NOTION_API_KEY })
    : null;

export const hasNotion = !!notion;

export type CMSPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  date: string | null;
  publishedAt: string | null;
  tags: string[];
  contentHtml?: string;
};

function mapPageToPost(page: any): CMSPost {
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
    "";

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
    slug,
    title,
    summary,
    date: publishedAt,
    publishedAt,
    tags,
  };
}

/**
 * Get all posts for listings (Insights page) and sitemap.
 */
export async function getAllPosts(): Promise<CMSPost[]> {
  if (!notion || !NOTION_DATABASE_ID) {
    console.warn(
      "Notion is not configured (NOTION_API_KEY / NOTION_DATABASE_ID missing). getAllPosts() returning empty array."
    );
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,

      // Safe sort: no hard-coded property names like "PublishedAt"
      sorts: [
        {
          timestamp: "last_edited_time",
          direction: "descending",
        },
      ],
      // If you later add a Status property and want only Published, we can add a filter here.
    });

    return response.results.map((page: any) => mapPageToPost(page));
  } catch (err) {
    console.error("getAllPosts: failed to query Notion", err);
    // Never break the build on Notion errors
    return [];
  }
}

/**
 * Get a single post by slug for /insights/[slug].
 * Tries:
 *  1) Database filter by Slug property (if it exists & works),
 *  2) Fallback to getAllPosts() and match in memory.
 * Also tries to pull basic page content via blocks → markdown → HTML.
 */
export async function getPost(slug: string): Promise<CMSPost | null> {
  if (!notion || !NOTION_DATABASE_ID) {
    console.warn(
      "Notion is not configured. getPost() returning null."
    );
    return null;
  }

  let page: any | null = null;

  // --- Try query by Slug property (if it exists) ---
  try {
    const bySlug = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        property: "Slug",
        rich_text: { equals: slug },
      },
      page_size: 1,
    });

    if (bySlug.results.length > 0) {
      page = bySlug.results[0];
    }
  } catch (err) {
    // validation_error usually means the "Slug" property doesn't exist
    console.warn(
      `getPost: failed to query Notion by Slug property for "${slug}", falling back to in-memory search.`,
      err
    );
  }

  // --- Fallback: search in all posts by slug ---
  if (!page) {
    const all = await getAllPosts();
    const match = all.find((p) => p.slug === slug);
    if (!match) {
      return null;
    }

    // We still need the Notion page object for blocks, so best-effort load by id
    try {
      const notionPage = await notion.pages.retrieve({
        page_id: match.id,
      } as any);
      page = notionPage;
    } catch (err) {
      console.warn(
        `getPost: could not retrieve Notion page for id "${match.id}". Returning basic post data only.`,
        err
      );
      return match; // Without contentHtml
    }
  }

  const base = mapPageToPost(page);

  // --- Try to fetch blocks and convert to HTML ---
  let contentHtml = "";

  try {
    const markdownLines: string[] = [];
    let cursor: string | undefined = undefined;

    while (true) {
      const resp = await notion.blocks.children.list({
        block_id: page.id,
        page_size: 100,
        start_cursor: cursor,
      });

      for (const block of resp.results as any[]) {
        const type = block.type;
        const richTexts = block[type]?.rich_text ?? [];
        const text = richTexts.map((t: any) => t.plain_text).join("");

        if (!text) continue;

        switch (type) {
          case "heading_1":
            markdownLines.push(`# ${text}`);
            break;
          case "heading_2":
            markdownLines.push(`## ${text}`);
            break;
          case "heading_3":
            markdownLines.push(`### ${text}`);
            break;
          case "bulleted_list_item":
            markdownLines.push(`- ${text}`);
            break;
          case "numbered_list_item":
            markdownLines.push(`1. ${text}`);
            break;
          default:
            markdownLines.push(text);
        }
      }

      if (!resp.has_more || !resp.next_cursor) break;
      cursor = resp.next_cursor;
    }

    const markdown = markdownLines.join("\n\n");
    contentHtml = markdown ? (marked as any)(markdown) : "";
  } catch (err) {
    console.warn(
      `getPost: failed to load Notion blocks for page "${page.id}". Returning post without contentHtml.`,
      err
    );
  }

  return {
    ...base,
    contentHtml:
      contentHtml ||
      "<p>Full article coming soon. Check back shortly.</p>",
  };
}
