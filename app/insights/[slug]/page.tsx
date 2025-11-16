// app/insights/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CMSPost, getAllPosts, getPost } from "@/lib/cms";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  { params }: { params: Params }
): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: "Insight not found | Resourcin",
      description: "The article you’re looking for could not be found.",
    };
  }

  const baseUrl = SITE_URL || "https://resourcin.com";
  const title = `${post.title} | Insights`;
  const description =
    post.excerpt ||
    "Insights on hiring, talent, and people operations from Resourcin.";
  const url = `${baseUrl}/insights/${post.slug}`;
  const image = post.coverImage;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME || "Resourcin",
      type: "article",
      images: image ? [{ url: image, alt: post.title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function InsightPostPage({ params }: { params: Params }) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="bg-slate-50">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {post!.coverImage && (
            <div className="relative h-56 w-full sm:h-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post!.coverImage}
                alt={post!.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="px-6 pb-8 pt-6 sm:px-8 sm:pt-8">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {post!.date && (
                <span>
                  {new Date(post!.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}

              {post!.tags && post!.tags.length > 0 && (
                <>
                  <span className="mx-1 h-1 w-1 rounded-full bg-slate-300" />
                  <div className="flex flex-wrap gap-1">
                    {post!.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-3">
              {post!.title}
            </h1>

            {post!.excerpt && (
              <p className="text-slate-600 text-sm sm:text-base mb-6">
                {post!.excerpt}
              </p>
            )}

            {post!.content && (
              <div className="prose prose-slate max-w-none prose-a:text-[#172965] prose-a:no-underline hover:prose-a:underline prose-headings:text-slate-900 prose-img:rounded-xl prose-img:border prose-img:border-slate-200">
                <div
                  dangerouslySetInnerHTML={{ __html: post!.content }}
                />
              </div>
            )}

            {!post!.content && (
              <p className="text-sm text-slate-500">
                Full article content is not available yet.
              </p>
            )}
          </div>
        </article>
      </main>
    </div>
  );
}
