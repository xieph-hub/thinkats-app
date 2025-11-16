// lib/cms.ts
import { Client } from "@notionhq/client";

export type CMSPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  tags: string[];
  date?: string;
  coverImage?: string;
  contentHtml?: string;
};

// Support either NOTION_TOKEN or NOTION_API_KEY (depending on how your env is set up)
const notionToken =
  process.env.NOTION_TOKEN || process.env.NOTION_API_KEY || "";
const notionDatabaseId = process.env.NOTION_DATABASE_ID || "";

const hasNotion = !!notionToken && !!notionDatabaseId;

const notion = hasNotion
  ? new Client({
      auth: notionToken,
    })
  : null;

/**
 * Turn Notion rich_text array into plain text.
 */
function richTextToPlainText(rich: any[] | undefined): string {
  if (!rich || !Array.isArray(rich)) return "";
  return rich.map((r) => r.plain_text ?? "").join("");
}

/**
 * Best-effort extraction of a cover image:
 * 1. Page cover (page.cover)
 * 2. Properties named Cover / Image / Thumbnail (files or url)
 * 3. Any first "files" property
 */
function extractCoverImage(page: any): string | undefined {
  // 1. Page cover
  if (page.cover) {
    if (page.cover.type === "file" && page.cover.file?.url) {
      return page.cover.file.url;
    }
    if (page.cover.type === "external" && page.cover.external?.url) {
      return page.cover.external.url;
    }
  }

  const properties = page.properties ?? {};

  // 2. Named properties
  const candidateNames = ["Cover", "Image", "Thumbnail"];
  for (const name of candidateNames) {
    const prop = (properties as any)[name];
    if (!prop) continue;

    if (prop.type === "files" && Array.isArray(prop.files) && prop.files.length) {
      const f = prop.files[0];
      return f.file?.url || f.external?.url;
    }

    if (prop.type === "url" && prop.url) {
      return prop.url;
    }
  }

  // 3. Any files property
  for (const value of Object.values(properties)) {
    const prop: any = value;
    if (prop?.type === "files" && Array.isArray(prop.files) && prop.files.length) {
      const f = prop.files[0];
      return f.file?.url || f.external?.url;
    }
  }

  return undefined;
}

/**
 * Map a Notion page object to our CMSPost metadata (without contentHtml).
 */
function mapPageToPost(page: any): CMSPost {
  const properties = page.properties ?? {};

  // Title: use the "title" property (usually called "Name")
  let title = "";
  const titleProp: any =
    Object.values(properties).find((p: any) => p?.type === "title") ?? null;

  if (titleProp && Array.isArray(titleProp.title) && titleProp.title.length > 0) {
    title = titleProp.title.map((t: any) => t.plain_text ?? "").join("");
  }

  // Slug: try a "Slug" property; otherwise slugify the title
  let slug = "";
  const slugProp: any = (properties as any).Slug;

  if (slugProp?.type === "rich_text" && Array.isArray(slugProp.rich_text)) {
    const s = richTextToPlainText(slugProp.rich_text).trim();
    if (s) slug = s;
  }

  if (!slug) {
    slug = (title || "post")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Excerpt / summary
  const excerptProp: any =
    (properties as any).Excerpt ||
    (properties as any).Summary ||
    (properties as any).Description;

  const excerpt =
    excerptProp?.type === "rich_text"
      ? richTextToPlainText(excerptProp.rich_text)
      : undefined;

  // Tags
  const tagsProp: any =
    (properties as any).Tags || (properties as any).Topic || (properties as any).Category;

  const tags: string[] =
    tagsProp?.type === "multi_select"
      ? tagsProp.multi_select.map((t: any) => t.name).filter(Boolean)
      : [];

  // Date (Published / Date / Created)
  const dateProp: any =
    (properties as any).Published ||
    (properties as any).PublishedAt ||
    (properties as any).Date;

  const date: string | undefined =
    dateProp?.type === "date" ? dateProp.date?.start ?? undefined : undefined;

  const coverImage = extractCoverImage(page);

  return {
    id: page.id,
    slug,
    title: title || slug,
    excerpt,
    tags,
    date,
    coverImage,
  };
}

/**
 * Convert Notion blocks into very simple HTML.
 * We deliberately keep this minimal so it won't break builds.
 */
function blockToHtml(block: any): string {
  const type = block.type;
  const rich = block[type]?.rich_text as any[] | undefined;
  const text = richTextToPlainText(rich);

  switch (type) {
    case "heading_1":
      return `<h1>${text}</h1>`;
    case "heading_2":
      return `<h2>${text}</h2>`;
    case "heading_3":
      return `<h3>${text}</h3>`;
    case "bulleted_list_item":
      return `<p>• ${text}</p>`;
    case "numbered_list_item":
      return `<p>${text}</p>`;
    case "quote":
      return `<blockquote>${text}</blockquote>`;
    case "code":
      return `<pre><code>${text}</code></pre>`;
    case "image": {
      const img = (block as any).image;
      const url = img?.file?.url || img?.external?.url;
      if (!url) return "";
      return `<figure><img src="${url}" alt="" /></figure>`;
    }
    case "paragraph":
      return text ? `<p>${text}</p>` : "";
    default:
      return text ? `<p>${text}</p>` : "";
  }
}

async function getPageContentHtml(pageId: string): Promise<string> {
  if (!notion) return "";

  const blocks: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      start_cursor: cursor,
    });

    blocks.push(...res.results);
    cursor = res.has_more ? (res.next_cursor as string | null) ?? undefined : undefined;
  } while (cursor);

  return blocks.map(blockToHtml).join("\n");
}

/**
 * Get all posts (metadata only) from Notion.
 * We sort by last_edited_time instead of a custom property so we don't hit the
 * "PublishedAt" validation error again.
 */
export async function getAllPosts(): Promise<CMSPost[]> {
  if (!notion || !notionDatabaseId) return [];

  try {
    const res = await notion.databases.query({
      database_id: notionDatabaseId,
      sorts: [
        {
          timestamp: "last_edited_time",
          direction: "descending",
        },
      ],
    });

    return res.results
      .filter((r: any) => r.object === "page")
      .map((page: any) => mapPageToPost(page));
  } catch (err) {
    console.error("[CMS] Error fetching posts from Notion", err);
    return [];
  }
}

/**
 * Get a single post by slug, including full HTML content.
 */
export async function getPost(slug: string): Promise<CMSPost | null> {
  if (!notion || !notionDatabaseId) return null;

  try {
    const all = await getAllPosts();
    const meta = all.find((p) => p.slug === slug);
    if (!meta) return null;

    const contentHtml = await getPageContentHtml(meta.id);

    return {
      ...meta,
      contentHtml,
    };
  } catch (err) {
    console.error(`[CMS] Error fetching post "${slug}" from Notion`, err);
    return null;
  }
}
