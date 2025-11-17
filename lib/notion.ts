// lib/notion.ts
import { Client } from "@notionhq/client";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_INSIGHTS_DATABASE_ID = process.env.NOTION_INSIGHTS_DATABASE_ID;

// Only create the client if we have a key
export const notion = NOTION_API_KEY
  ? new Client({ auth: NOTION_API_KEY })
  : null;

export const INSIGHTS_DB_ID = NOTION_INSIGHTS_DATABASE_ID || null;
