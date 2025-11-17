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
            </div>
          )}

          {/* Meta */}
          <header className="mb-6">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500">
              {insight.category && (
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 font-medium">
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
                <span className="text-neutral-400">
                  {readingTimeMinutes} min read
                </span>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--rcn-blue)] sm:text-4xl">
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
          <div className="mb-8 h-px w-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-transparent" />

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
                className="block rounded-xl border border-neutral-200/80 bg-white p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--rcn-blue)] hover:shadow-md"
              >
                <p className="text-[11px] uppercase tracking-wide text-neutral-400">
                  {item.category || "Insight"}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
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
 * Social sharing bar (X, LinkedIn, WhatsApp).
 */
function ShareBar({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const tweetHref = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${title} – ${url}`
  )}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] uppercase tracking-wide text-neutral-400">
        Share
      </span>
      <div className="flex flex-wrap gap-2">
        <a
          href={tweetHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-sm transition hover:border-[var(--rcn-blue)] hover:text-[var(--rcn-blue)]"
        >
          X / Twitter
        </a>
        <a
          href={linkedinHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-sm transition hover:border-[var(--rcn-blue)] hover:text-[var(--rcn-blue)]"
        >
          LinkedIn
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-sm transition hover:border-[var(--rcn-blue)] hover:text-[var(--rcn-blue)]"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}

/**
 * Build a small "related insights" list:
 * - Prefer same category.
 * - Fallback: most recent others.
 */
function buildRelatedInsights(
  currentId: string,
  currentCategory: string | null,
  all: Awaited<ReturnType<typeof getInsightsList>>
) {
  const others = all.filter((i) => i.id !== currentId);
  if (others.length === 0) return [];

  let related: typeof others = [];

  if (currentCategory) {
    related = others.filter((i) => i.category === currentCategory);
  }

  if (related.length < 3) {
    const filler = others.filter(
      (i) => !related.some((r) => r.id === i.id)
    );
    related = [...related, ...filler].slice(0, 3);
  } else {
    related = related.slice(0, 3);
  }

  return related;
}

/**
 * Estimate reading time from content text.
 */
function estimateReadingTime(
  text: string | null | undefined
): number | null {
  if (!text) return null;
  const words = text.trim().split(/\s+/).length;
  if (!words) return null;
  const minutes = Math.max(1, Math.round(words / 200));
  return minutes;
}

/**
 * Render the "Content (paste into Notion page body)" text nicely.
 * We preserve line breaks using whitespace-pre-wrap.
 */
function ContentFromField({ text }: { text: string }) {
  return (
    <pre className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800 sm:text-[16px]">
      {text}
    </pre>
  );
}

/**
 * Simple renderer for Notion blocks (paragraphs, headings, quotes, lists, images).
 */
function NotionBlocks({ blocks }: { blocks: BlockObjectResponse[] }) {
  return (
    <>
      {blocks.map((block) => (
        <NotionBlock key={block.id} block={block} />
      ))}
    </>
  );
}

function NotionBlock({ block }: { block: BlockObjectResponse }) {
  const { type } = block;

  switch (type) {
    case "paragraph": {
      const text = block.paragraph.rich_text
        .map((t) => t.plain_text)
        .join("");
      if (!text.trim()) return null;
      return <p className="mb-4">{text}</p>;
    }

    case "heading_1": {
      const text = block.heading_1.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <h2 className="mt-10 mb-4 text-2xl font-semibold text-[var(--rcn-blue)]">
          {text}
        </h2>
      );
    }

    case "heading_2": {
      const text = block.heading_2.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <h3 className="mt-8 mb-3 text-xl font-semibold text-[var(--rcn-blue)]">
          {text}
        </h3>
      );
    }

    case "heading_3": {
      const text = block.heading_3.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <h4 className="mt-6 mb-2 text-lg font-semibold text-[var(--rcn-blue)]">
          {text}
        </h4>
      );
    }

    case "quote": {
      const text = block.quote.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <blockquote className="my-5 border-l-2 border-[var(--rcn-dark-green)] pl-4 text-[15px] italic text-neutral-700">
          {text}
        </blockquote>
      );
    }

    case "bulleted_list_item": {
      const text = block.bulleted_list_item.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <p className="mb-2 ml-5 text-[15px] leading-relaxed before:mr-2 before:inline-block before:content-['•']">
          {text}
        </p>
      );
    }

    case "numbered_list_item": {
      const text = block.numbered_list_item.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <p className="mb-2 ml-5 text-[15px] leading-relaxed before:mr-2 before:inline-block before:content-['•']">
          {text}
        </p>
      );
    }

    case "image": {
      const src =
        block.image.type === "external"
          ? block.image.external.url
          : block.image.file.url;

      const caption =
        block.image.caption?.map((t) => t.plain_text).join("") ?? "";

      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={caption || "Insight image"}
            className="w-full rounded-xl"
          />
          {caption && (
            <figcaption className="mt-2 text-center text-xs text-neutral-500">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    default:
      return null;
  }
}
