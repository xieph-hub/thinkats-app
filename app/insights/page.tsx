// app/insights/page.tsx
import Link from "next/link";
import { getInsightsList } from "@/lib/insights";

export const revalidate = 60; // ISR

export default async function InsightsPage() {
  const insights = await getInsightsList();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => (
          <article
            key={insight.id}
            className="flex flex-col overflow-hidden rounded-xl border border-neutral-200/70 bg-white shadow-sm"
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
              <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
                {insight.category && (
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium">
                    {insight.category}
                  </span>
                )}

                {insight.publishedAt && (
                  <span className="ml-auto">
                    {new Date(insight.publishedAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
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
        ))}
      </div>

      {insights.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">
          No insights found.
        </p>
      )}
    </main>
  );
}
