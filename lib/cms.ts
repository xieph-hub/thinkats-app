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

  let coverImage: string | null =
    page.cover?.external?.url || page.cover?.file?.url || null;

  // Fallback: image stored as a files property (Image / Cover / Hero)
  if (!coverImage) {
    const imageProp = props.Image || props.Cover || props.Hero;
    if (imageProp?.type === "files" && Array.isArray(imageProp.files)) {
      const file = imageProp.files[0];
      if (file) {
        coverImage =
          file.external?.url ||
          file.file?.url ||
          null;
      }
    }
  }

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
      case "image": {
        const image = b.image;
        const url =
          image?.type === "external"
            ? image.external?.url
            : image?.file?.url;
        if (url) {
          lines.push(`![](${url})`);
        }
        break;
      }
      case "callout":
        lines.push(richTextToPlainText(b.callout.rich_text));
        break;
      default:
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
    // No sort by PublishedAt to avoid validation_error if that property is missing
  });

  return response.results
    .filter((page: any) => page.object === "page")
    .map((page: any) => normalizePostFromPage(page));
}

async function getPostFromNotion(slug: string): Promise<CMSPost | null> {
  if (!notion || !notionDatabaseId) return null;

  const allPosts = await getAllPostsFromNotion();
  const base = allPosts.find((p) => p.slug === slug);
  if (!base) return null;

  let contentHtml: string | null = null;

  // 1) Try to read a long-form rich_text property
  try {
    const page: any = await notion.pages.retrieve({ page_id: base.id });
    const props = page.properties || {};

    const preferredProps = [
      "Content (paste into Notion page body)", // your exact property name
      "Content",
      "Body",
      "Article",
      "Post",
      "Text",
      "Markdown",
    ];

    let contentText = "";

    // First, check preferred property names (including your exact header)
    for (const name of preferredProps) {
      const prop: any = props[name];
      if (
        prop?.type === "rich_text" &&
        Array.isArray(prop.rich_text) &&
        prop.rich_text.length > 0
      ) {
        contentText = richTextToPlainText(prop.rich_text);
        break;
      }
    }

    // Fallback: pick the longest rich_text property that isn't obviously meta
    if (!contentText) {
      for (const key of Object.keys(props)) {
        const prop: any = props[key];
        if (
          prop?.type === "rich_text" &&
          !["Slug", "Excerpt", "Summary", "Name", "Title"].includes(key)
        ) {
          const txt = richTextToPlainText(prop.rich_text || []);
          if (txt && txt.length > contentText.length) {
            contentText = txt;
          }
        }
      }
    }

    if (contentText && contentText.trim().length > 0) {
      contentHtml = marked.parse(contentText) as string;
    }
  } catch (err) {
    console.error("Error retrieving Notion page content", err);
  }

  // 2) If property-based content is empty, fall back to Notion blocks
  if (!contentHtml) {
    try {
      const blocks = await getPageBlocks(base.id);
      const markdown = blocksToMarkdown(blocks);
      if (markdown && markdown.trim().length > 0) {
        contentHtml = marked.parse(markdown) as string;
      }
    } catch (err) {
      console.error("Error retrieving Notion page blocks", err);
    }
  }

  return {
    ...base,
    content: contentHtml,
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
