// app/insights/page.tsx

import Link from "next/link";
import type { Metadata } from "next";
import { getAllPostsCMS } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Insights | Resourcin",
  description:
    "Insights, playbooks, and commentary on recruiting, talent strategy, and people operations from Resourcin.",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function InsightsPage() {
  // This is the ONLY place we read posts for the listing page
  const posts = await getAllPostsCMS();

  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:#306B34]">
            Insights
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Insights for hiring leaders & talent teams
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Short, practical notes on recruiting, people operations, and the
            realities of hiring in emerging markets.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-sm text-slate-600">
            No articles yet. Check back soon — we’re curating our first set of
            briefs.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => {
              const date = formatDate(post.publishedAt || post.date);

              return (
                <Link
                  key={post.id}
                  href={`/insights/${post.slug}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:border-[color:#172965] hover:shadow-md"
                >
                  {date && (
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
                      {date}
                    </p>
                  )}

                  <h2 className="mt-2 text-base font-semibold text-slate-900 group-hover:text-[color:#172965]">
                    {post.title}
                  </h2>

                  {post.summary && (
                    <p className="mt-2 line-clamp-3 text-xs text-slate-600">
                      {post.summary}
                    </p>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
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

                  <span className="mt-3 inline-flex items-center text-xs font-medium text-[color:#172965] group-hover:underline">
                    Read insight
                    <span className="ml-1 text-[10px]">↗</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
