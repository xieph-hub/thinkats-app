// app/insights/[slug]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchInsights, getInsightBySlug } from "@/lib/insights";
import { SITE_URL } from "@/lib/site";

type PageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const posts = await fetchInsights();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const post = await getInsightBySlug(params.slug);

  if (!post) {
    return {
      title: "Insight not found | Resourcin",
      description: "The requested insight could not be found.",
    };
  }

  const title = post.title;
  const description = post.summary;
  const url = `${SITE_URL}/insights/${post.slug}`;

  return {
    title,
    description,
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
    alternates: {
      canonical: url,
    },
  };
}

export default async function InsightPage({ params }: PageProps) {
  const post = await getInsightBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <nav className="mb-6 text-xs text-slate-500">
        <Link
          href="/insights"
          className="inline-flex items-center hover:text-slate-700"
        >
          ← Back to insights
        </Link>
      </nav>

      <article className="space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
            Insight
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {post.publishedAt && (
              <span>
                {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
            {post.tags.length > 0 && (
              <span className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700 ring-1 ring-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </span>
            )}
          </div>
        </header>

        {/* For now we render summary as the body.
           If your Notion CMS has rich content per page, we can layer in a block renderer later. */}
        <section className="prose prose-slate max-w-none text-sm sm:text-base">
          <p>{post.summary}</p>
        </section>
      </article>
    </main>
  );
}
