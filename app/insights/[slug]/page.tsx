// app/insights/[slug]/page.tsx
import { notFound } from "next/navigation";
import {
  getInsightsList,
  getInsightBySlug,
  getInsightBlocks,
} from "@/lib/insights";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import Link from "next/link";

export const revalidate = 60;

export async function generateStaticParams() {
  const insights = await getInsightsList();
  return insights.map((insight) => ({
    slug: insight.slug,
  }));
}

type PageProps = {
  params: { slug: string };
};

export default async function InsightPage({ params }: PageProps) {
  const insight = await getInsightBySlug(params.slug);

  if (!insight) {
    notFound();
  }

  // Request Talent tracking link
  const requestTalentHref = `/request-talent?via=insight&post=${encodeURIComponent(
    insight.slug
  )}`;

  // Get body blocks + all insights for "Related"
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2.2fr)_minmax(260px,1fr)]">
        {/* MAIN ARTICLE */}
        <article>
          {insight.coverUrl && (
            <div className="mb-6 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={insight.coverUrl}
                alt={insight.title}
                className="h-auto w-full object-cover"
              />
            </div>
          )}

          <header className="mb-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
              {insight.category && (
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium">
                  {insight.category}
                </span>
              )}

              {insight.publishedAt && (
                <span>
                  {new Date(insight.publishedAt).toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </span>
              )}
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--rcn-blue)]">
              {insight.title}
            </h1>

            {insight.excerpt && (
              <p className="mt-3 text-sm text-neutral-700">
                {insight.excerpt}
              </p>
            )}
          </header>

          {/* BODY */}
          <section className="space-y-4 text-[15px] leading-relaxed text-slate-800">
            {/* Prefer the Content field from Notion if present */}
            {hasContentField && (
              <ContentFromField text={insight.content!} />
            )}

            {/* If there are Notion blocks, render them too (or alone if no Content field) */}
            {!hasContentField && hasBlocks && (
              <NotionBlocks blocks={blocks} />
            )}

            {/* If both exist, we render content field first, then any additional blocks */}
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

          {/* REQUEST TALENT CTA with tracking */}
          <section className="mt-10 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--rcn-blue)]">
              Need to hire for a role like this?
            </h2>
            <p className="mt-2 text-xs text-neutral-600">
              Share your requirements and we&apos;ll respond with a tailored shortlist.
              This form will remember that you came from this insight.
            </p>
            <div className="mt-3">
              <Link
                href={requestTalentHref}
                className="inline-flex items-center justify-center rounded-full bg-[var(--rcn-blue)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#101b4a]"
              >
                Request Talent
              </Link>
            </div>
          </section>
        </article>

        {/* RELATED INSIGHTS */}
        <aside className="border-t border-neutral-200 pt-6 lg:border-t-0 lg:pt-0 lg:pl-4">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
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
                className="block rounded-lg border border-neutral-200/80 bg-white p-3 text-sm transition hover:border-[var(--rcn-blue)] hover:shadow-sm"
              >
                <p className="text-[11px] uppercase tracking-wide text-neutral-400">
                  {item.category || "Insight"}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {item.title}
                </p>
                {item.excerpt && (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-600">
                    {item.excerpt}
                  </p>
                )}
                {item.publishedAt && (
                  <p className="mt-1 text-[11px] text-neutral-400">
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
 * Render the "Content (paste into Notion page body)" text nicely.
 * We preserve line breaks using whitespace-pre-wrap.
 */
function ContentFromField({ text }: { text: string }) {
  return (
    <pre className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">
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
      return <p className="mb-3">{text}</p>;
    }

    case "heading_1": {
      const text = block.heading_1.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <h2 className="mt-8 mb-3 text-2xl font-semibold text-[var(--rcn-blue)]">
          {text}
        </h2>
      );
    }

    case "heading_2": {
      const text = block.heading_2.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <h3 className="mt-6 mb-2 text-xl font-semibold text-[var(--rcn-blue)]">
          {text}
        </h3>
      );
    }

    case "heading_3": {
      const text = block.heading_3.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <h4 className="mt-4 mb-2 text-lg font-semibold text-[var(--rcn-blue)]">
          {text}
        </h4>
      );
    }

    case "quote": {
      const text = block.quote.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <blockquote className="my-4 border-l-2 border-[var(--rcn-dark-green)] pl-4 text-neutral-700">
          {text}
        </blockquote>
      );
    }

    case "bulleted_list_item": {
      const text = block.bulleted_list_item.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <p className="mb-2 ml-4 text-[15px] leading-relaxed">
          • {text}
        </p>
      );
    }

    case "numbered_list_item": {
      const text = block.numbered_list_item.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <p className="mb-2 ml-4 text-[15px] leading-relaxed">
          • {text}
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
        <figure className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={caption || "Insight image"}
            className="rounded-lg"
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
