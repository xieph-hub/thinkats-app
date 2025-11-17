// app/insights/page.tsx

import Link from "next/link";
import { fetchInsights } from "@/lib/insights";

export const metadata = {
  title: "Insights | Resourcin",
  description: "Ideas on hiring, talent, and the future of work.",
};

export default async function InsightsIndexPage() {
  const posts = await fetchInsights();

  if (!posts.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Insights
        </h1>
        <p className="mt-4 text-slate-600">
          Our essays on hiring, talent and the future of work will start to live
          here shortly.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Insights
      </h1>
      <p className="mt-4 text-slate-600">
        Deep dives on hiring, talent and the future of work.
      </p>

      <div className="mt-8 space-y-6">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-slate-900">
              <Link
                href={`/insights/${post.slug}`}
                className="hover:text-indigo-600 hover:underline"
              >
                {post.title}
              </Link>
            </h2>

            {post.publishedAt && (
              <p className="mt-1 text-xs text-slate-500">
                {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}

            <p className="mt-3 text-sm text-slate-700">{post.summary}</p>

            {post.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </main>
  );
}
