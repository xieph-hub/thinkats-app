// app/insights/[slug]/page.tsx
import { notFound } from "next/navigation";
import {
  getInsightsList,
  getInsightBySlug,
  getInsightBlocks,
} from "@/lib/insights";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

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

  const blocks = await getInsightBlocks(insight.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
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
          <div className="flex items-center gap-3 text-xs text-neutral-500">
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

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {insight.title}
          </h1>

          {insight.excerpt && (
            <p className="mt-3 text-sm text-neutral-600">
              {insight.excerpt}
            </p>
          )}
        </header>

        <section className="prose prose-neutral max-w-none text-sm leading-relaxed">
          {blocks.map((block) => (
            <NotionBlock key={block.id} block={block} />
          ))}
        </section>
      </article>
    </main>
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
        <h2 className="mt-8 mb-3 text-2xl font-semibold">
          {text}
        </h2>
      );
    }

    case "heading_2": {
      const text = block.heading_2.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <h3 className="mt-6 mb-2 text-xl font-semibold">
          {text}
        </h3>
      );
    }

    case "heading_3": {
      const text = block.heading_3.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <h4 className="mt-4 mb-2 text-lg font-semibold">
          {text}
        </h4>
      );
    }

    case "quote": {
      const text = block.quote.rich_text
        .map((t) => t.plain_text)
        .join("");
      return (
        <blockquote className="my-4 border-l-2 border-neutral-300 pl-4 text-neutral-600">
          {text}
        </blockquote>
      );
    }

    case "bulleted_list_item": {
      const text = block.bulleted_list_item.rich_text
        .map((t) => t.plain_text)
        .join("");
      return <li className="ml-5 list-disc">{text}</li>;
    }

    case "numbered_list_item": {
      const text = block.numbered_list_item.rich_text
        .map((t) => t.plain_text)
        .join("");
      return <li className="ml-5 list-decimal">{text}</li>;
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
