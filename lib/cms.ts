// lib/cms.ts
import { Client } from "@notionhq/client";
import { marked } from "marked";

export type CMSPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string | null;
  date?: string | null;
  tags?: string[];
  content?: string | null;
};

const notionToken = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

const hasNotion = !!notionToken && !!notionDatabaseId;

const notion = hasNotion
  ? new Client({
      auth: notionToken!,
    })
  : null;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function richTextToPlainText(richText: any[] = []): string {
  return richText.map((r) => r.plain_text || "").join("");
}

function normalizePostFromPage(page: any): CMSPost {
  const props = page.properties || {};

  const title =
    props.Name?.title?.[0]?.plain_text ||
    props.Title?.title?.[0]?.plain_text ||
    "Untitled";

  const slugSource =
    props.Slug?.rich_text?.[0]?.plain_text ||
    props.Slug?.title?.[0]?.plain_text ||
    title;

  const slug = slugify(slugSource);

  const date =
    props.PublishedAt?.date?.start ||
    props.Date?.date?.start ||
    null;

  const excerpt =
    props.Excerpt?.rich_text?.[0]?.plain_text ||
    props.Summary?.rich_text?.[0]?.plain_text ||
    "";

  const tags =
    props.Tags?.multi_select?.map((t: any) => t.name) ||
    (props.Tags?.select ? [props.Tags.select.name] : []);

  const coverImage =
    page.cover?.external?.url ||
    page.cover?.file?.url ||
    null;

  return {
    id: page.id,
    slug,
    title,
    date,
    excerpt,
    tags,
    coverImage,
  };
}

async function getPageBlocks(pageId: string): Promise<any[]> {
  if (!notion) return [];
  const all: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      start_cursor: cursor,
    });
    all.push(...response.results);
    cursor = response.has_more
      ? (response.next_cursor as string | undefined)
      : undefined;
  } while (cursor);

  return all;
}

function blocksToMarkdown(blocks: any[]): string {
  const lines: string[] = [];

  for (const block of blocks) {
    const b: any = block;

    switch (b.type) {
      case "paragraph":
        lines.push(richTextToPlainText(b.paragraph.rich_text));
        break;
      case "heading_1":
        lines.push("# " + richTextToPlainText(b.heading_1.rich_text));
        break;
      case "heading_2":
        lines.push("## " + richTextToPlainText(b.heading_2.rich_text));
        break;
      case "heading_3":
        lines.push("### " + richTextToPlainText(b.heading_3.rich_text));
        break;
      case "bulleted_list_item":
        lines.push(
          "- " + richTextToPlainText(b.bulleted_list_item.rich_text)
        );
        break;
      case "numbered_list_item":
        lines.push(
          "1. " + richTextToPlainText(b.numbered_list_item.rich_text)
        );
        break;
      case "quote":
        lines.push("> " + richTextToPlainText(b.quote.rich_text));
        break;
      case "code":
        lines.push(
          "```" +
            (b.code.language || "") +
            "\n" +
            richTextToPlainText(b.code.rich_text) +
            "\n```"
        );
        break;
      default:
        // Fallback for any other block that still has rich_text
        if (b[b.type]?.rich_text) {
          lines.push(richTextToPlainText(b[b.type].rich_text));
        }
        break;
    }
  }

  return lines.join("\n\n");
}

async function getAllPostsFromNotion(): Promise<CMSPost[]> {
  if (!notion || !notionDatabaseId) return [];

  const response = await notion.databases.query({
    database_id: notionDatabaseId as string,
    // No sorts here so we don't hit the "PublishedAt" validation_error again
  });

  return response.results
    .filter((page: any) => page.object === "page")
    .map((page: any) => normalizePostFromPage(page));
}

async function getPostFromNotion(slug: string): Promise<CMSPost | null> {
  if (!notion || !notionDatabaseId) return null;

  // Reuse the same mapping logic to find the page by slug
  const allPosts = await getAllPostsFromNotion();
  const base = allPosts.find((p) => p.slug === slug);
  if (!base) return null;

  const blocks = await getPageBlocks(base.id);
  const markdown = blocksToMarkdown(blocks);
  const html = markdown ? (marked.parse(markdown) as string) : "";

  return {
    ...base,
    content: html,
  };
}

export async function getAllPosts(): Promise<CMSPost[]> {
  if (!hasNotion) {
    return [];
  }
  return getAllPostsFromNotion();
}

export async function getPost(slug: string): Promise<CMSPost | null> {
  if (!hasNotion) {
    return null;
  }
  return getPostFromNotion(slug);
}
