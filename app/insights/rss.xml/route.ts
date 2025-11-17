// app/insights/rss.xml/route.ts
import { getInsightsList } from "@/lib/insights";

export const revalidate = 60;

function getBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";
  if (fromEnv.startsWith("http")) return fromEnv;
  return `https://${fromEnv}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const insights = await getInsightsList();

  const items = insights
    .map((insight) => {
      const link = `${baseUrl}/insights/${insight.slug}`;
      const title = escapeXml(insight.title);
      const description = escapeXml(insight.excerpt || "");
      const pubDate = insight.publishedAt
        ? new Date(insight.publishedAt).toUTCString()
        : new Date().toUTCString();

      return `<item>
  <title>${title}</title>
  <link>${link}</link>
  <guid>${link}</guid>
  <description>${description}</description>
  <pubDate>${pubDate}</pubDate>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Resourcin Insights</title>
  <link>${baseUrl}/insights</link>
  <description>Thinking about hiring, talent and work – insights from Resourcin.</description>
  <language>en</language>
  ${items}
</channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
