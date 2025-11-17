// lib/notion.ts
import { Client } from "@notionhq/client";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_INSIGHTS_DATABASE_ID = process.env.NOTION_INSIGHTS_DATABASE_ID || null;

// Create a client only if we have an API key
export const notion = NOTION_API_KEY
  ? new Client({ auth: NOTION_API_KEY })
  : null;

// Database ID for the Insights DB (or null if not configured)
export const INSIGHTS_DB_ID: string | null = NOTION_INSIGHTS_DATABASE_ID;

// Helper so you can quickly sanity check in logs if needed
export function isNotionInsightsConfigured(): boolean {
  return Boolean(notion && INSIGHTS_DB_ID);
}
