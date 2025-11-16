import Link from "next/link";
import { getInsightPosts, type InsightPost } from "@/lib/notion";

export const metadata = {
  title: "Insights | Resourcin",
  description:
    "People, hiring, and leadership insights for founders, HR leaders, and investors scaling teams across Africa and beyond.",
};

// Revalidate periodically so Notion updates show up without redeploy
export const revalidate = 300; // 5 minutes

export default async function InsightsPage() {
  let posts: InsightPost[] = [];

  try {
    posts = await getInsightPosts();
  } catch (error) {
    console.error("Failed to fetch Notion insights:", error);
  }

  const hasPosts = posts && posts.length > 0;

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
            Insights
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            People, hiring, and leadership notes from the field.
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Short, useful pieces for founders, HR leaders, and investors
            navigating hiring, people-costs, and culture in high-growth
            environments.
          </p>
        </header>

        {!hasPosts ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-sm text-slate-600">
            <p className="font-medium text-slate-800">No insights yet.</p>
            <p className="mt-1">
              Once your Notion database has published entries, they&apos;ll
              appear here automatically. Check that:
            </p>
            <ul className="mt-2 list-disc pl-5 text-xs text-slate-500">
              <li>Items are in the correct database (NOTION_INSIGHTS_DATABASE_ID).</li>
              <li>
                Their <span className="font-semibold">Status</span> is set to{" "}
                <span className="font-semibold">Published</span>.
              </li>
            </ul>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
              >
                {post.tag && (
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#172965]">
                    {post.tag}
                  </p>
                )}
                <h2 className="mt-2 text-sm font-semibold text-slate-900">
                  {post.title}
                </h2>
                {post.summary && (
                  <p className="mt-2 flex-1 text-sm text-slate-600">
                    {post.summary}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {post.readingTime
                      ? post.readingTime
                      : post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString()
                      : ""}
                  </span>
                  {/* When you’re ready to do full article pages via /insights/[slug],
                      you can swap 'Coming soon' for a real Link */}
                  <span className="text-xs font-semibold text-[#172965]">
                    Coming soon →
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
