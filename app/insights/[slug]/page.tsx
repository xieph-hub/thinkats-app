// app/insights/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getInsightsList,
  getInsightBySlug,
  getInsightBlocks,
} from "@/lib/insights";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import Link from "next/link";

export const revalidate = 60;

type PageParams = { slug: string };

function getBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";
  if (fromEnv.startsWith("http")) return fromEnv;
  return `https://${fromEnv}`;
}

export async function generateStaticParams() {
  const insights = await getInsightsList();
  return insights.map((insight) => ({
    slug: insight.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const insight = await getInsightBySlug(params.slug);
  const baseUrl = getBaseUrl();

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
        description: fallbackDescription,
      },
      alternates: {
        canonical: `${baseUrl.replace(/\/$/, "")}/insights`,
      },
    };
  }

  const baseTitle = `${insight.title} | Insights | Resourcin`;
  const description =
    insight.excerpt ||
    "Thinking about hiring, talent and work – insights from Resourcin.";

  const canonicalUrl = `${baseUrl.replace(
    /\/$/,
    ""
  )}/insights/${insight.slug}`;

  const ogImages = insight.coverUrl
    ? [{ url: insight.coverUrl }]
    : undefined;

  return {
    title: baseTitle,
    description,
    openGraph: {
      title: baseTitle,
      description,
      type: "article",
      url: canonicalUrl,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: baseTitle,
      description,
      images: insight.coverUrl ? [insight.coverUrl] : undefined,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

type PageProps = {
  params: PageParams;
};

export default async function InsightPage({ params }: PageProps) {
  const insight = await getInsightBySlug(params.slug);

  if (!insight) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl.replace(
    /\/$/,
    ""
  )}/insights/${insight.slug}`;

  // Fetch body blocks + all insights for "Related"
  const [blocks, allInsights] = await Promise.all([
    getInsightBlocks(insight.id),
    getInsightsList(),
  ]);

  const related = buildRelatedInsights(
    insight.id,
    insight.category,
    allInsights
  );

  const hasBlocks = blocks && blocks.length > 0;
  const hasContentField = Boolean(insight.content);

  const readingTimeMinutes = estimateReadingTime(
    insight.content || insight.excerpt || insight.title
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 font-sans lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2.4fr)_minmax(260px,1fr)]">
        {/* MAIN ARTICLE */}
        <article className="max-w-3xl">
          {/* Breadcrumb */}
          <nav className="mb-4 text-xs text-neutral-500">
            <Link
              href="/insights"
              className="inline-flex items-center gap-1 hover:text-[var(--rcn-blue)]"
            >
              <span aria-hidden>←</span>
              <span>Back to insights</span>
            </Link>
          </nav>

          {insight.coverUrl && (
            <div className="mb-8 overflow-hidden rounded-2xl shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={insight.coverUrl}
                alt={insight.title}
                className="h-auto w-full object-cover"
              />
