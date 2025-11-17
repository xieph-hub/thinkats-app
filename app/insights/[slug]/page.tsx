// app/insights/[slug]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInsightBySlug } from "@/lib/notion-insights"; // or similar

export default async function InsightPage({ params }: { params: { slug: string } }) {
  const insight = await getInsightBySlug(params.slug);

  if (!insight) {
    notFound();
  }

  // render...
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

  // Fetch all posts to compute related ones
  const allPosts = await getAllPosts();

  const currentTags = ((post.tags as string[] | undefined) || []).map((t) =>
    t.toLowerCase()
  );

  // Start with "all except current"
  let relatedPosts = allPosts.filter((p) => p.slug !== post.slug);

  // If this post has tags, try to prioritize posts that share at least one tag
  if (currentTags.length > 0) {
    const withSharedTags = relatedPosts.filter((p) => {
      const tags = ((p.tags as string[] | undefined) || []).map((t) =>
        t.toLowerCase()
      );
      return tags.some((tag) => currentTags.includes(tag));
    });

    if (withSharedTags.length > 0) {
      relatedPosts = withSharedTags;
    }
  }

  // Cap to top 3 related
  relatedPosts = relatedPosts.slice(0, 3);

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
              <div
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
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Full article content is not available yet.
              </p>
            )}
          </section>

          {/* Author-style CTA card */}
          <section className="mt-10 rounded-2xl border border-slate-100 bg-[#172965] px-6 py-6 text-slate-100 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#64C247]/15 text-sm font-semibold text-[#64C247]">
                R
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64C247]">
                  Need help hiring?
                </p>
                <h2 className="text-sm font-semibold sm:text-base">
                  Turn these insights into an actual hiring plan.
                </h2>
                <p className="text-xs text-slate-200/80 sm:text-sm">
                  Resourcin partners with founders and People teams to scope
                  roles, run searches, and close the right talent across
                  markets.
                </p>
              </div>
            </div>

            <div className="mt-4 sm:mt-0">
              <Link
                href="/request-talent"
                className="inline-flex items-center rounded-full bg-[#64C247] px-4 py-2 text-sm font-semibold text-[#0b1028] shadow-sm hover:bg-[#4ba235] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#172965] focus-visible:ring-white"
              >
                Request talent
                <span className="ml-1.5 text-base" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </section>

          {/* Related insights */}
          {relatedPosts.length > 0 && (
            <section className="mt-10 border-t border-slate-100 pt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                  Related insights
                </h2>
                <Link
                  href="/insights"
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  View all
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/insights/${related.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#172965]/20 hover:bg-white"
                  >
                    {related.coverImage && (
                      <div className="relative mb-3 overflow-hidden rounded-xl bg-slate-100">
                        <div className="relative aspect-[16/9] w-full">
                          <Image
                            src={related.coverImage}
                            alt={related.title}
                            fill
                            className="object-cover transition group-hover:scale-[1.03]"
                            sizes="(min-width: 1024px) 240px, 100vw"
                          />
                        </div>
                      </div>
                    )}

                    <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                      {related.title}
                    </h3>

                    {related.excerpt && (
                      <p className="mt-1 line-clamp-3 text-xs text-slate-500">
                        {related.excerpt}
                      </p>
                    )}

                    <div className="mt-auto pt-3 inline-flex items-center text-[11px] font-medium text-[#172965]">
                      Read insight
                      <span className="ml-1" aria-hidden="true">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
    </div>
  );
}
