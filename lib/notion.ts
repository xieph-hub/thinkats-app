// lib/notion.ts
import { Client } from "@notionhq/client";

// Notion API key from env
const NOTION_API_KEY = process.env.NOTION_API_KEY || "";

// Database ID for the Insights DB.
// Supports BOTH:
// - NOTION_INSIGHTS_DATABASE_ID (what I suggested earlier)
// - NOTION_DATABASE_ID (what you actually set in Vercel)
const NOTION_DB_ID =
  process.env.NOTION_INSIGHTS_DATABASE_ID ||
  process.env.NOTION_DATABASE_ID ||
  null;

// Create a Notion client only if we have an API key
export const notion = NOTION_API_KEY
  ? new Client({ auth: NOTION_API_KEY })
  : null;

// Exported DB id used everywhere else
export const INSIGHTS_DB_ID: string | null = NOTION_DB_ID;

// Small helper if you ever want to check config in logs
export function isNotionInsightsConfigured(): boolean {
  return Boolean(notion && INSIGHTS_DB_ID);
}
