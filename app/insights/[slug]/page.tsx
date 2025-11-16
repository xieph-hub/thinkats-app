// app/insights/[slug]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostCMS, getAllPostsCMS } from "@/lib/cms";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Props = {
  params: { slug: string };
};

export const dynamic = "force-dynamic"; // render per-request

export async function generateStaticParams() {
  const posts = await getAllPostsCMS();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const post = await getPostCMS(params.slug);

  if (!post) {
    return {
      title: "Not found | Insights",
      description: "The requested article could not be found.",
    };
  }

  const title = `${post.title} | Insights`;
  const description =
    post.summary ??
    "Insights from Resourcin on recruiting, talent, and people operations.";

  const url = `${SITE_URL}/insights/${post.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function InsightPostPage({ params }: Props) {
  const post = await getPostCMS(params.slug);

  if (!post) {
    notFound();
  }

  const formattedDate =
    post.publishedAt &&
    new Date(post.publishedAt).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <article className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <header className="mb-6 border-b border-slate-100 pb-4">
            {formattedDate && (
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
                {formattedDate}
              </p>
            )}
            <h1 className="mt-2 text-2xl font-bold leading-snug text-slate-900">
              {post.title}
            </h1>
            {post.summary && (
              <p className="mt-3 text-sm text-slate-600">{post.summary}</p>
            )}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <section
            className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-[color:#172965] prose-strong:text-slate-900 prose-li:text-slate-700"
            dangerouslySetInnerHTML={{
              __html: post.contentHtml ?? "",
            }}
          />
        </article>
      </main>
    </div>
  );
}
