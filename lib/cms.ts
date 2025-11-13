import { Client } from "@notionhq/client";
import { marked } from "marked";
import { getAllPosts as getAllFromFiles, getPost as getFromFiles } from "./insights";

const hasNotion = !!process.env.NOTION_TOKEN && !!process.env.NOTION_DATABASE_ID;

export type CMSPost = {
  slug: string;
  title: string;
  excerpt?: string;
  date?: string;       // ISO
  category?: string;
  cover?: string;
  html?: string;
};

function toISO(input: any): string | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export async function getAllPostsCMS(): Promise<CMSPost[]> {
  if (!hasNotion) {
    return getAllFromFiles().map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      date: p.date,
      category: p.category,
      cover: p.cover,
    }));
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN! });
  const dbId = process.env.NOTION_DATABASE_ID!;

  // No explicit sort (DB may not have a "Date" property)
  const res = await notion.databases.query({ database_id: dbId });

  const posts: CMSPost[] = res.results.map((page: any) => {
    const props = page.properties || {};
    const title = props?.Title?.title?.[0]?.plain_text ?? "Untitled";
    const slug =
      props?.Slug?.rich_text?.[0]?.plain_text ??
      title.toLowerCase().replace(/\s+/g, "-");
    const excerpt = props?.Excerpt?.rich_text?.[0]?.plain_text ?? "";
    const category =
      props?.Category?.select?.name ??
      props?.Category?.rich_text?.[0]?.plain_text ??
      undefined;

    // Prefer explicit Date; fallback to last_edited_time
    const dateRaw = props?.Date?.date?.start ?? page.last_edited_time;
    const dateISO = toISO(dateRaw);

    // Cover: page cover first, property second
    let cover: string | undefined;
    if (page.cover?.external?.url) cover = page.cover.external.url;
    else if (page.cover?.file?.url) cover = page.cover.file.url;
    else {
      const files = props?.Cover?.files ?? [];
      if (files[0]?.external?.url) cover = files[0].external.url;
      if (files[0]?.file?.url) cover = files[0].file.url;
    }

    return { slug, title, excerpt, category, date: dateISO, cover };
  });

  // Sort newest first
  posts.sort((a, b) => Date.parse(b.date || "") - Date.parse(a.date || ""));
  return posts;
}

export async function getPostCMS(
  slug: string
): Promise<{ frontmatter: any; html: string } | null> {
  if (!hasNotion) {
    const file = getFromFiles(slug);
    if (!file) return null;

    // marked.parse can be Promise<string> in v12
    const htmlParsed = await marked.parse(file.content ?? "");
    const html = typeof htmlParsed === "string" ? htmlParsed : String(htmlParsed);

    return {
      frontmatter: file.frontmatter,
      html,
    };
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN! });
  const dbId = process.env.NOTION_DATABASE_ID!;

  // Find the page by Slug exact match
  const found = await notion.databases.query({
    database_id: dbId,
    filter: { property: "Slug", rich_text: { equals: slug } },
    page_size: 1,
  });

  const page = found.results[0] as any;
  if (!page) return null;

  // Pull blocks for content
  const blocks: any[] = [];
  let cursor: string | undefined;
  do {
    const r = await notion.blocks.children.list({
      block_id: page.id,
      start_cursor: cursor,
    });
    blocks.push(...r.results);
    cursor = r.has_more ? (r.next_cursor as string) : undefined;
  } while (cursor);

  function plain(rt: any[] = []): string {
    return rt.map((t: any) => t?.plain_text ?? "").join("");
  }

  // Very simple block → HTML mapping (extend later if needed)
  const htmlParts: string[] = [];
  let inBulleted = false;
  let inNumbered = false;

  const closeLists = () => {
    if (inBulleted) {
      htmlParts.push("</ul>");
      inBulleted = false;
    }
    if (inNumbered) {
      htmlParts.push("</ol>");
      inNumbered = false;
    }
  };

  for (const b of blocks) {
    const t = b.type;
    const o = (b as any)[t];
    if (!o) continue;

    if (t === "paragraph") {
      closeLists();
      htmlParts.push(`<p>${plain(o.rich_text)}</p>`);
    } else if (t === "heading_1") {
      closeLists();
      htmlParts.push(`<h1>${plain(o.rich_text)}</h1>`);
    } else if (t === "heading_2") {
      closeLists();
      htmlParts.push(`<h2>${plain(o.rich_text)}</h2>`);
    } else if (t === "heading_3") {
      closeLists();
      htmlParts.push(`<h3>${plain(o.rich_text)}</h3>`);
    } else if (t === "bulleted_list_item") {
      if (!inBulleted) {
        closeLists();
        htmlParts.push("<ul>");
        inBulleted = true;
      }
      htmlParts.push(`<li>${plain(o.rich_text)}</li>`);
    } else if (t === "numbered_list_item") {
      if (!inNumbered) {
        closeLists();
        htmlParts.push("<ol>");
        inNumbered = true;
      }
      htmlParts.push(`<li>${plain(o.rich_text)}</li>`);
    } else if (t === "quote") {
      closeLists();
      htmlParts.push(`<blockquote>${plain(o.rich_text)}</blockquote>`);
    } else if (t === "divider") {
      closeLists();
      htmlParts.push(`<hr/>`);
    } else if (t === "image") {
      closeLists();
      const src = o.type === "external" ? o.external.url : o.file.url;
      const cap = plain(o.caption || []);
      htmlParts.push(
        `<figure><img src="${src}" alt="${cap || ""}"/><figcaption>${cap || ""}</figcaption></figure>`
      );
    } else {
      // Fallback: treat as paragraph if rich_text exists
      if (o.rich_text) {
        closeLists();
        htmlParts.push(`<p>${plain(o.rich_text)}</p>`);
      }
    }
  }
  closeLists();

  const props = page.properties || {};
  const frontmatter = {
    title: props?.Title?.title?.[0]?.plain_text ?? "Untitled",
    category:
      props?.Category?.select?.name ??
      props?.Category?.rich_text?.[0]?.plain_text ??
      undefined,
    date: props?.Date?.date?.start ?? page.last_edited_time ?? undefined,
    cover: page.cover?.external?.url || page.cover?.file?.url || undefined,
  };

  const html = htmlParts.join("\n");
  return { frontmatter, html };
}
