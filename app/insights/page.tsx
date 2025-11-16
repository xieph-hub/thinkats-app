import Link from "next/link";
import { fetchInsights } from "@/lib/notion";
import type { InsightPost } from "@/lib/notion";

export const metadata = {
  title: "Insights | Resourcin",
  description:
    "Operator-led hiring, people operations, and talent insights from Resourcin – practical notes for founders and HR leaders.",
};

export default async function InsightsPage() {
  const posts: InsightPost[] = await fetchInsights();
  const hasPosts = posts && posts.length > 0;

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
            Insights
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Notes from the talent and people trenches.
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Short, practical pieces on hiring, embedded people ops, and
            building teams across Nigeria, Africa and remote markets — written
            from the perspective of operators, not armchair theorists.
          </p>
        </header>

        {/* Content */}
        {hasPosts ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/insights/${post.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#172965]/60 hover:shadow-md"
              >
                <div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <h2 className="text-sm font-semibold text-slate-900 group-hover:text-[#172965]">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-xs text-slate-600">
                    {post.summary}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "Draft"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#172965]">
                    Read insight
                    <span aria-hidden>↗</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-sm text-slate-600">
            <p className="font-medium text-slate-800">
              Insights are coming soon.
            </p>
            <p className="mt-2 text-xs text-slate-600">
              We&apos;re wiring this space to your Notion database. Once{" "}
              <code className="rounded bg-slate-100 px-1 py-[1px] text-[11px]">
                NOTION_API_KEY
              </code>{" "}
              and{" "}
              <code className="rounded bg-slate-100 px-1 py-[1px] text-[11px]">
                NOTION_DATABASE_ID
              </code>{" "}
              are set in your Vercel environment, new posts published in Notion
              will appear here automatically.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
