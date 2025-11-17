// app/insights/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { fetchInsights } from "@/lib/insights";

export const metadata: Metadata = {
  title: "Insights | Resourcin",
  description:
    "Resourcin perspectives on recruitment, talent selection, and people operations.",
};

export default async function InsightsPage() {
  const posts = await fetchInsights();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Intro / hero */}
      <section className="mb-10 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
          Insights
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Thinking about hiring, talent and work.
        </h1>

        {/* 🔴 Paste your original text here (from before all the changes) */}
        <div className="prose prose-slate max-w-none text-sm sm:text-base">
          <p>
            Resourcin exists to help founders, hiring managers and HR leaders
            make sharper, faster and more honest hiring decisions.
          </p>
          <p>
            This page collects practical thinking on topics like senior hiring,
            interview design, scorecards, compensation, and the realities of the
            talent market across Nigeria, Africa and beyond.
          </p>
          <p>
            Replace this copy with the exact text you had previously – this is
            just placeholder structure.
          </p>
        </div>
      </section>

      {/* Notion-driven posts */}
      {posts.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          <p className="font-medium text-slate-800">
            No published insights yet.
          </p>
          <p className="mt-1">
            Once you publish entries in your Notion CMS (Status ={" "}
            <span className="rounded bg-slate-200 px-1 text-xs font-medium">
              Published
            </span>
            ), they will appear here automatically.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Latest from the Resourcin desk
          </h2>

          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Link
                  href={`/insights/${post.slug}`}
                  className="block focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-slate-900">
                      {post.title}
                    </h3>
                    {post.publishedAt && (
                      <p className="text-xs text-slate-500">
                        {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>

                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                    {post.summary}
                  </p>

                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <span className="mt-3 inline-flex items-center text-xs font-medium text-sky-700">
                    Read insight
                    <span aria-hidden="true" className="ml-1">
                      →
                    </span>
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
