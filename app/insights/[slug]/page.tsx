// app/insights/[slug]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPost } from "@/lib/cms";
import { SITE_URL, SITE_NAME } from "@/lib/site";

type PageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: "Insight not found | Resourcin",
      description: "The requested insight could not be found.",
    };
  }

  const title = `${post.title} | Insights`;
  const description =
    post.excerpt ||
    `Insights from ${SITE_NAME} on hiring, talent, and workforce strategy.`;
  const url = `${SITE_URL}/insights/${post.slug}`;
  const images = post.coverImage ? [{ url: post.coverImage }] : undefined;

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
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb / back link */}
        <div className="mb-4">
          <Link
            href="/insights"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <span className="mr-1">←</span> Back to Insights
          </Link>
        </div>

        <article className="rounded-3xl bg-white/95 p-6 shadow-sm ring-1 ring-slate-100 sm:p-10">
          {/* Title + meta */}
          <header className="space-y-3 border-b border-slate-100 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
              Resourcin Insights
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {post.date && (
                <span>
                  {new Date(post.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Cover image */}
          {post.coverImage && (
            <div className="relative mt-6 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-100">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 768px, 100vw"
                />
              </div>
            </div>
          )}

          {/* Body */}
          <section className="mt-8">
            {post.content ? (
              <article
                className="
                  prose prose-slate max-w-none
                  prose-headings:text-slate-900
                  prose-h1:text-3xl prose-h1:font-semibold
                  prose-h2:text-2xl prose-h2:mt-8
                  prose-h3:text-xl prose-h3:mt-6
                  prose-p:text-[15px] prose-p:leading-relaxed
                  prose-a:text-[#172965] hover:prose-a:text-[#0f1b45]
                  prose-strong:text-slate-900
                  prose-blockquote:border-l-4 prose-blockquote:border-[#172965]/20
                  prose-blockquote:text-slate-700
                  prose-li:marker:text-slate-400
                  prose-img:rounded-2xl prose-img:border prose-img:border-slate-200
                  prose-table:rounded-xl prose-table:border prose-table:border-slate-200
                  prose-th:bg-slate-50
                "
              >
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </article>
            ) : (
              <p className="text-sm text-slate-500">
                Full article content is not available yet.
              </p>
            )}
          </section>
        </article>
      </main>
    </div>
  );
}
