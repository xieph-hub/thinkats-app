// app/insights/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getInsightsList } from "@/lib/insights";
import InsightsBrowser from "./InsightsBrowser";
import EmailCaptureInline from "./EmailCaptureInline";

export const revalidate = 60;

function getBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";
  if (fromEnv.startsWith("http")) return fromEnv;
  return `https://${fromEnv}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const title = "Insights | Resourcin";
  const description =
    "Thinking about hiring, talent and work. Resourcin exists to help founders, hiring managers and HR leaders make sharper, faster and more honest hiring decisions.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/insights`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/insights`,
    },
  };
}

export default async function InsightsPage() {
  const insights = await getInsightsList();
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const rssUrl = `${baseUrl}/insights/rss.xml`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 font-sans lg:py-16">
      {/* Hero / intro */}
      <section className="mb-8 border-b border-neutral-200 pb-6 lg:mb-10 lg:pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFC000]">
          Insights
        </p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#000435] sm:text-4xl">
              Thinking about hiring, talent and work.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-neutral-700 sm:text-[15px]">
              Resourcin exists to help founders, hiring managers and HR
              leaders make sharper, faster and more honest hiring
              decisions. This page collects practical thinking on topics
              like senior hiring, interview design, scorecards,
              compensation, and the realities of the talent market across
              Nigeria, Africa and beyond.
            </p>
          </div>

          <div className="mt-4 flex flex-col items-start gap-2 text-xs text-neutral-500 lg:items-end">
            <Link
              href={rssUrl}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium text-[#172965] shadow-sm transition hover:border-[#FFC000] hover:bg-[#172965] hover:text-white"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFC000]" />
              <span>RSS feed</span>
            </Link>
            <p className="text-[11px] text-neutral-400">
              Updated as new insights are published.
            </p>
          </div>
        </div>
      </section>

      {/* Browser (search, filters, grid) wrapped in Suspense for useSearchParams */}
      <Suspense fallback={<InsightsBrowserSkeleton />}>
        <InsightsBrowser insights={insights} />
      </Suspense>

      {/* Email capture at the bottom of the page, before the footer */}
      <div className="mt-10 lg:mt-12">
        <EmailCaptureInline />
      </div>
    </main>
  );
}

/**
 * Lightweight fallback while the client bundle + search params hydrate.
 */
function InsightsBrowserSkeleton() {
  return (
    <section className="space-y-6">
      {/* Skeleton controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200/80 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:max-w-sm">
          <div className="mb-1 h-3 w-24 rounded-full bg-neutral-100" />
          <div className="h-9 w-full rounded-full bg-neutral-100" />
          <div className="mt-1 h-3 w-32 rounded-full bg-neutral-50" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-7 w-20 rounded-full bg-neutral-100" />
          <div className="h-7 w-24 rounded-full bg-neutral-100" />
          <div className="h-7 w-24 rounded-full bg-neutral-100" />
        </div>
      </div>

      {/* Skeleton cards */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <article
            key={idx}
            className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm"
          >
            <div className="relative aspect-[16/9] w-full bg-neutral-100" />
            <div className="flex flex-1 flex-col px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 rounded-full bg-neutral-100" />
                  <div className="h-4 w-12 rounded-full bg-neutral-100" />
                </div>
                <div className="h-3 w-16 rounded-full bg-neutral-100" />
              </div>
              <div className="mt-3 h-4 w-3/4 rounded-full bg-neutral-100" />
              <div className="mt-2 h-3 w-full rounded-full bg-neutral-50" />
              <div className="mt-1 h-3 w-5/6 rounded-full bg-neutral-50" />
              <div className="mt-4 h-3 w-24 rounded-full bg-neutral-100" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
