// app/insights/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import {
  getInsightsList,
  getInsightBySlug,
  getInsightBlocks,
} from "@/lib/insights";

export const revalidate = 60;

type PageParams = { slug: string };

function getBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";
  if (fromEnv.startsWith("http")) return fromEnv;
  return `https://${fromEnv}`;
}

// ✅ Make static params resilient to Notion timeouts
export async function generateStaticParams() {
  try {
    const insights = await getInsightsList();
    return insights.map((insight) => ({
      slug: insight.slug,
    }));
  } catch (error) {
    console.error(
      "Error loading insights list in generateStaticParams (Notion issue?):",
      error
    );
    // When Notion is down, don't pre-generate any insight detail pages
    return [];
  }
}

// ✅ Make metadata resilient – fall back to generic if Notion fails
export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const baseUrl = getBaseUrl();

  try {
    const insight = await getInsightBySlug(params.slug);

    if (!insight) {
      const fallbackTitle = "Insights | Resourcin";
      const fallbackDescription =
        "Thinking about hiring, talent and work – insights from Resourcin.";

      return {
        title: fallbackTitle,
        description: fallbackDescription,
        openGraph: {
          title: fallbackTitle,
          description: fallbackDescription,
          type: "article",
          url: `${baseUrl.replace(/\/$/, "")}/insights`,
        },
        twitter: {
          card: "summary_large_image",
          title: fallbackTitle,
          descript
