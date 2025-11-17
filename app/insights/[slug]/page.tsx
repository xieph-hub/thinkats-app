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
              className="inline-flex items-center gap-1 hover:text-[#172965]"
            >
              <span aria-hidden>←</span>
              <span>Back to insights</span>
            </Link>
          </nav>

          {insight.coverUrl && (
            <div className="mb-8 overflow-hidden rounded-2xl border border-neutral-200/80 bg-[#000435]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={insight.coverUrl}
                alt={insight.title}
                className="h-auto w-full object-cover opacity-[0.96]"
              />
            </div>
          )}

          {/* Meta */}
          <header className="mb-6">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500">
              {insight.category && (
                <span className="inline-flex items-center rounded-full bg-[#1729650d] px-2.5 py-0.5 font-medium text-[#172965]">
                  {insight.category}
                </span>
              )}

              {insight.publishedAt && (
                <span className="uppercase tracking-wide text-neutral-400">
                  {new Date(
                    insight.publishedAt
                  ).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}

              {readingTimeMinutes && (
                <span className="rounded-full bg-neutral-50 px-2 py-0.5 text-neutral-500">
                  {readingTimeMinutes} min read
                </span>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#000435] sm:text-4xl">
              {insight.title}
            </h1>

            {insight.excerpt && (
              <p className="mt-4 text-sm text-neutral-700 sm:text-base">
                {insight.excerpt}
              </p>
            )}
          </header>

          {/* Share bar */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-neutral-400">
              {/* reserved for future author/byline */}
            </div>
            <ShareBar url={canonicalUrl} title={insight.title} />
          </div>

          {/* Divider */}
          <div className="mb-8 h-px w-full bg-gradient-to-r from-[#1729651a] via-neutral-100 to-transparent" />

          {/* BODY */}
          <section className="space-y-4 text-[15px] leading-relaxed text-slate-800 sm:text-[16px]">
            {/* Prefer the Content field from Notion if present */}
            {hasContentField && (
              <ContentFromField text={insight.content!} />
            )}

            {/* If there are Notion blocks, render them too (or alone if no Content field) */}
            {!hasContentField && hasBlocks && (
              <NotionBlocks blocks={blocks} />
            )}

            {/* If both exist, render content field first, then any additional blocks */}
            {hasContentField && hasBlocks && (
              <div className="pt-4">
                <NotionBlocks blocks={blocks} />
              </div>
            )}

            {!hasContentField && !hasBlocks && (
              <p className="text-sm text-neutral-500">
                No content available for this insight yet.
              </p>
            )}
          </section>
        </article>

        {/* RELATED INSIGHTS */}
        <aside className="border-t border-neutral-200 pt-6 lg:border-t-0 lg:pt-0 lg:pl-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Related insights
          </h2>

          {related.length === 0 && (
            <p className="text-xs text-neutral-500">
              No related insights yet.
            </p>
          )}

          <div className="space-y-4">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/insights/${item.slug}`}
                className="block rounded-xl border border-neutral-200/80 bg-white p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-[#172965] hover:shadow-md"
              >
                <p className="text-[11px] uppercase tracking-wide text-neutral-400">
                  {item.category || "Insight"}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#000435]">
                  {item.title}
                </p>
                {item.excerpt && (
                  <p className="mt-1 line-clamp-3 text-[12px] text-neutral-600">
                    {item.excerpt}
                  </p>
                )}
                {item.publishedAt && (
                  <p className="mt-2 text-[11px] text-neutral-400">
                    {new Date(
                      item.publishedAt
                    ).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}

/**
 * Social sharing bar (X, LinkedIn, WhatsApp) with icons.
 */
function ShareBar({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const tweetHref = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${title} – ${url}`
  )}`;

  const baseBtn =
    "inline-flex items-center justify-center h-8 w-8 rounded-full border border-neutral-200 bg-white text-[#172965] shadow-sm transition hover:border-[#FFC000] hover:bg-[#172965] hover:text-white";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[11px] uppercase tracking-wide text-neutral-400">
        Share
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={tweetHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X / Twitter"
          className={baseBtn}
        >
          <XIcon />
        </a>
        <a
          href={linkedinHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
          className={baseBtn}
        >
          <LinkedInIcon />
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
          className={baseBtn}
        >
          <WhatsAppIcon />
        </a>
      </div>
    </div>
  );
}

/** X / Twitter icon */
function XIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
    >
      <path
        fill="currentColor"
        d="M18.25 4.5h-2.02l-3.1 4.13L9.02 4.5H4.5l5.06 6.9L4.7 19.5h2.02l3.39-4.5 3.29 4.5h4.52l-5.1-6.92L18.25 4.5z"
      />
    </svg>
  );
}

/** LinkedIn icon */
function LinkedInIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
    >
      <path
        fill="currentColor"
        d="M4.98 3.5C3.87 3.5 3 4.37 3 5.48c0 1.1.87 1.98 1.98 1.98h.02c1.11 0 1.98-.88 1.98-1.98A1.99 1.99 0 0 0
