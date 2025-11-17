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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  );

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
    <section className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200/80 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="w-full md:max-w-sm">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Search insights
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <SearchIcon className="h-3.5 w-3.5 text-neutral-400" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, topic or content..."
              className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-neutral-400 focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            Showing {filtered.length} of {insights.length} insights
          </p>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={
              "rounded-full border px-3 py-1 text-xs font-medium transition " +
              (!selectedCategory
                ? "border-[#FFC000] bg-[#FFC000] text-[#000435]"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-[#172965] hover:text-[#172965]")
            }
          >
            All topics
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
              className={
                "rounded-full border px-3 py-1 text-xs font-medium transition " +
                (selectedCategory === cat
                  ? "border-[#172965] bg-[#172965] text-white"
                  : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-[#172965] hover:bg-white hover:text-[#172965]")
              }
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
              className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#172965] hover:shadow-md"
            >
              {/* Image */}
              {insight.coverUrl ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={insight.coverUrl}
                    alt={insight.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              ) : (
                <div className="img-fallback relative aspect-[16/9] w-full" />
              )}

              {/* Body */}
              <div className="flex flex-1 flex-col px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
                <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-500">
                  <div className="flex items-center gap-2">
                    {insight.category && (
                      <span className="inline-flex items-center rounded-full bg-[#1729650d] px-2 py-0.5 font-medium text-[#172965]">
                        {insight.category}
                      </span>
                    )}
                    {readingTime && (
                      <span className="rounded-full bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-500">
                        {readingTime} min read
                      </span>
                    )}
                  </div>
                  {insight.publishedAt && (
                    <span className="text-[11px] text-neutral-400">
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

                <h2 className="mt-3 text-[15px] font-semibold leading-snug text-[#000435]">
                  <Link href={`/insights/${insight.slug}`}>
                    <span className="bg-gradient-to-r from-[#172965] to-[#306B34] bg-clip-text text-transparent group-hover:text-[#172965]">
                      {insight.title}
                    </span>
                  </Link>
                </h2>

                {insight.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm text-neutral-600">
                    {insight.excerpt}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between text-[12px]">
                  <Link
                    href={`/insights/${insight.slug}`}
                    className="inline-flex items-center gap-1 font-medium text-[#172965] hover:text-[#000435]"
                  >
                    Read insight
                    <span aria-hidden className="transition group-hover:translate-x-0.5">
                      →
                    </span>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}

        {filtered.length === 0 && (
          <p className="col-span-full mt-6 text-sm text-neutral-500">
            No insights match your filters yet.
          </p>
        )}
      </div>
    </section>
  );
}

/** tiny search icon */
function SearchIcon(props: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={props.className}
    >
      <path
        fill="currentColor"
        d="M15.5 14h-.79l-.28-.27a6 6 0 1 0-.71.71l.27.28v.79L19 20.5 20.5 19l-5-5zm-5.5 1a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
      />
    </svg>
  );
}

function estimateReadingTime(insight: InsightMeta): number | null {
  const text =
    insight.content || insight.excerpt || insight.title;
  if (!text) return null;

  const words = text.trim().split(/\s+/).length;
  if (!words) return null;
  const minutes = Math.max(1, Math.round(words / 200));
  return minutes;
}
