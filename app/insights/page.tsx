// app/insights/page.tsx
import type { Metadata } from "next";
import { getInsightsList } from "@/lib/insights";
import InsightsBrowser from "./InsightsBrowser";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Insights | Resourcin",
  description:
    "Thinking about hiring, talent and work. Resourcin shares practical insights on senior hiring, interview design, scorecards, compensation, and the realities of the talent market.",
};

export default async function InsightsPage() {
  const insights = await getInsightsList();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 font-sans lg:py-16">
      {/* Hero */}
      <section className="mb-8 rounded-2xl border border-[#1729651a] bg-gradient-to-br from-[#000435] via-[#172965] to-[#000435] px-5 py-7 text-white shadow-sm sm:px-7 sm:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[#FFC000]">
              Insights
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Thinking about hiring, talent and work.
            </h1>
            <p className="mt-3 text-sm text-slate-100/90 sm:text-[15px]">
              Resourcin exists to help founders, hiring managers and HR leaders
              make sharper, faster and more honest hiring decisions. This is
              where we document what we&apos;re learning.
            </p>
          </div>

          <div className="mt-2 flex flex-col items-start gap-2 text-xs text-slate-100/80 md:items-end">
            <p>Topics across Nigeria, Africa and beyond:</p>
            <ul className="space-y-1">
              <li>• Senior hiring &amp; leadership benches</li>
              <li>• Interview design &amp; scorecards</li>
              <li>• Compensation, offers &amp; closing</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Browser (search + filters + grid) */}
      <InsightsBrowser insights={insights} />
    </main>
  );
}
