// app/insights/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { fetchInsights, getInsightBySlug } from "@/lib/insights";

type PageProps = {
  params: { slug: string };
};

// Static params so Next can pre-generate insight pages
export async function generateStaticParams() {
  const posts = await fetchInsights();
  return posts.map((post) => ({ slug: post.slug }));
}

// Metadata for SEO / social cards
export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const post = await getInsightBySlug(params.slug);

  if (!post) {
    return {
      title: "Insight not found | Resourcin",
      description: "This insight is no longer available.",
    };
  }

  const title = `${post.title} | Insights | Resourcin`;
  const description =
    post.summary ??
    "Deep thinking on hiring, leadership and careers from Resourcin.";

  const url = `${SITE_URL}/insights/${post.slug}`;

  // Optional cover image support if you later add it to InsightPost
  const images = post.coverImage ? [post.coverImage] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
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
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/insights"
        className="mb-4 inline-flex items-center text-xs text-slate-500 hover:text-slate-800"
      >
        ← Back to insights
      </Link>

      <article className="prose prose-slate max-w-none">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">
          {post.title}
        </h1>

        {post.publishedAt && (
          <p className="text-xs text-slate-500">
            Published{" "}
            {new Date(post.publishedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}

        {post.summary && (
          <p className="mt-4 text-sm text-slate-700">{post.summary}</p>
        )}

        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
          Full long-form content will live here once the CMS is wired up. For
          now, this keeps the SEO and navigation structure intact.
        </div>

        {post.tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-1 text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </main>
  );
}
