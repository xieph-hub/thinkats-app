// lib/notion.ts
import { Client } from "@notionhq/client";

if (!process.env.NOTION_API_KEY) {
  throw new Error("Missing NOTION_API_KEY in env");
}

export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export const INSIGHTS_DB_ID = process.env.NOTION_INSIGHTS_DATABASE_ID;

if (!INSIGHTS_DB_ID) {
  throw new Error("Missing NOTION_INSIGHTS_DATABASE_ID in env");
}
