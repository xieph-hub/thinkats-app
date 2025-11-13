import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

export async function GET() {
  const token = process.env.NOTION_TOKEN;
  const db = process.env.NOTION_DATABASE_ID;

  if (!token || !db) {
    return NextResponse.json(
      {
        ok: false,
        step: "env",
        message: "Missing NOTION_TOKEN or NOTION_DATABASE_ID",
        haveToken: !!token,
        haveDatabaseId: !!db,
      },
      { status: 400 }
    );
  }

  try {
    const notion = new Client({ auth: token });
    // No sorts here (some DBs don't have a Date property)
    const res = await notion.databases.query({
      database_id: db,
      page_size: 5,
    });

    const items = res.results.map((page: any) => {
      const props = page.properties || {};
      const title = props?.Title?.title?.[0]?.plain_text ?? null;
      const slug = props?.Slug?.rich_text?.[0]?.plain_text ?? null;
      const dateProp = props?.Date?.date?.start ?? null;
      const category =
        props?.Category?.select?.name ??
        props?.Category?.rich_text?.[0]?.plain_text ??
        null;

      // Fallback to last_edited_time if Date is missing
      const date = dateProp || page.last_edited_time || null;

      return { id: page.id, title, slug, date, category };
    });

    // Sort newest-first by whichever date we have
    items.sort((a: any, b: any) => Date.parse(b.date || "") - Date.parse(a.date || ""));

    return NextResponse.json({
      ok: true,
      step: "query",
      databaseId: db,
      count: res.results.length,
      sample: items,
      hint:
        "Title and Slug should exist. Date is optional; we fall back to last_edited_time if missing.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        step: "query",
        message: err?.message || String(err),
        note:
          "Common causes: integration not connected; wrong workspace; wrong database_id; property names don't match (Title, Slug, Category).",
      },
      { status: 500 }
    );
  }
}
