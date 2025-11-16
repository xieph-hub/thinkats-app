// app/insights/page.tsx
import Link from "next/link";
import { getAllPosts } from "@/lib/cms";

export const metadata = {
  title: "Insights | Resourcin",
  description:
    "Insights on hiring, talent, and people operations from Resourcin.",
};

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const posts = await getAllPosts();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Insights
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Ideas, playbooks & hiring notes
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Long-form thinking on recruiting, talent pipelines, and people
            operations — written for founders, HR leaders, and senior
            recruiters.
          </p>
        </div>
      </header>

      {posts.length === 0 ? (
        <p className="text-sm text-slate-500">
          No published insights yet. Once your Notion database has content, it
          will show up here automatically.
        </p>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {post.coverImage && (
                <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                  {/* Use plain img to avoid remote image config issues */}
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
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

                <h2 className="text-base font-semibold text-slate-900">
                  <Link href={`/insights/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>

                {post.excerpt && (
                  <p className="line-clamp-3 text-sm text-slate-600">
                    {post.excerpt}
                  </p>
                )}

                <div className="mt-auto pt-2">
                  <Link
                    href={`/insights/${post.slug}`}
                    className="inline-flex items-center text-sm font-medium text-[#172965] hover:underline"
                  >
                    Read insight
                    <span className="ml-1 text-xs">↗</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
