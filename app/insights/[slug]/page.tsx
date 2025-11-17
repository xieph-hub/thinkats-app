// app/insights/[slug]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    };
  }

  const url = `${SITE_URL}/insights/${post.slug}`;

  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.summary,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
    },
  };
}

export default async function InsightPage({ params }: PageProps) {
  const post = await getInsightBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Insight
      </p>

      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {post.title}
      </h1>

      {post.publishedAt && (
        <p className="mt-2 text-xs text-slate-500">
          {new Date(post.publishedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      )}

      {post.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="prose prose-slate mt-8">
        <p>{post.summary}</p>
        <p className="mt-6 text-sm text-slate-500">
          Full article content will live here once you wire in a CMS or richer
          body content.
        </p>
      </div>
    </main>
  );
}
