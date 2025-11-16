// app/insights/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPost } from "@/lib/cms";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: "Insight not found | Resourcin",
    };
  }

  return {
    title: `${post.title} | Insights | Resourcin`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

// Optional: pre-generate static params from Notion (safe but not required with dynamic = "force-dynamic")
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function InsightPage({ params }: PageProps) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-0">
      <article className="space-y-6">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Insights
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">{post.title}</h1>

          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {post.date && (
              <span>
                {new Date(post.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {post.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        {post.coverImage && (
          <div className="overflow-hidden rounded-2xl bg-slate-100">
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {post.contentHtml && (
          <section
            className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-a:text-[#172965] hover:prose-a:text-[#000435]"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        )}
      </article>
    </main>
  );
}
