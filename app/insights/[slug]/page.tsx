import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostCMS } from "@/lib/cms";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const post = await getPostCMS(params.slug);

  if (!post) {
    return {
      title: "Post not found | Insights",
      description: "The requested insight could not be found.",
    };
  }

  const title = `${post.title} | Insights`;
  const description =
    post.summary ||
    `Read “${post.title}” on ${SITE_NAME} Insights.`;

  const url = `${SITE_URL}/insights/${post.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function InsightPage({ params }: Props) {
  const post = await getPostCMS(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <article className="prose prose-slate max-w-none">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Insight
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {post.title}
          </h1>

          {post.publishedAt && (
            <p className="mt-2 text-sm text-slate-500">
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {post.contentHtml ? (
          <div
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        ) : (
          <p className="text-sm text-slate-600">
            Full article content will be available soon.
          </p>
        )}
      </article>
    </main>
  );
}
