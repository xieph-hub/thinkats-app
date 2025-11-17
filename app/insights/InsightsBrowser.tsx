// app/insights/InsightsBrowser.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { InsightMeta } from "@/lib/insights";

type InsightsBrowserProps = {
  insights: InsightMeta[];
};

export default function InsightsBrowser({ insights }: InsightsBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    insights.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [insights]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return insights.filter((i) => {
      const matchesCategory =
        !selectedCategory || i.category === selectedCategory;

      const searchableText = (
        i.title +
        " " +
        (i.excerpt ?? "") +
        " " +
        (i.content ?? "")
      ).toLowerCase();

      const matchesSearch = !term || searchableText.includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [insights, search, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="w-full md:max-w-sm">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
            Search insights
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, topic or content..."
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-neutral-400 focus-visible:border-[var(--rcn-blue)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--rcn-blue)]"
          />
          <p className="mt-1 text-[11px] text-neutral-400">
            Showing {filtered.length} of {insights.length} insights
          </p>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              !selectedCategory
                ? "border-[var(--rcn-blue)] bg-[var(--rcn-blue)] text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-[var(--rcn-blue)]"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat ? null : cat
                )
              }
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                selectedCategory === cat
                  ? "border-[var(--rcn-blue)] bg-[var(--rcn-blue)] text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-[var(--rcn-blue)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of insights */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((insight) => {
          const readingTime = estimateReadingTime(insight);

          return (
            <article
              key={insight.id}
              className="flex flex-col overflow-hidden rounded-xl border border-neutral-200/70 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--rcn-blue)] hover:shadow-md"
            >
              {insight.coverUrl ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={insight.coverUrl}
                    alt={insight.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="img-fallback relative aspect-[16/9] w-full" />
              )}

              <div className="flex flex-1 flex-col px-5 py-4">
                <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-500">
                  <div className="flex items-center gap-2">
                    {insight.category && (
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium">
                        {insight.category}
                      </span>
                    )}
                    {readingTime && (
                      <span className="text-[11px] text-neutral-400">
                        {readingTime} min read
                      </span>
                    )}
                  </div>

                  {insight.publishedAt && (
                    <span>
                      {new Date(
                        insight.publishedAt
                      ).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-base font-semibold leading-snug text-slate-900">
                  <Link href={`/insights/${insight.slug}`}>
                    <span className="hover:underline">
                      {insight.title}
                    </span>
                  </Link>
                </h2>

                {insight.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm text-neutral-600">
                    {insight.excerpt}
                  </p>
                )}

                <div className="mt-4">
                  <Link
                    href={`/insights/${insight.slug}`}
                    className="text-sm font-medium text-[var(--rcn-blue)] hover:underline"
                  >
                    Read more →
                  </Link>
                </div>
              </div>
            </article>
          );
        })}

        {filtered.length === 0 && (
          <p className="col-span-full mt-6 text-sm text-neutral-500">
            No insights match your search.
          </p>
        )}
      </div>
    </div>
  );
}

function estimateReadingTime(insight: InsightMeta): number | null {
  const text =
    insight.content || insight.excerpt || insight.title;
  if (!text) return null;

  // Roughly: 1 word ~ 5 chars, 200 wpm
  const charCount = text.length;
  const minutes = Math.max(1, Math.round(charCount / 1000));
  return minutes;
}
