import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Analytics & reporting | ThinkATS",
  description:
    "See jobs, pipelines, scoring and candidate flow in one place without drowning in charts.",
};

export default function AnalyticsFeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* HERO */}
      <section className="border-b border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            Product · Analytics &amp; reporting
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Simple views that answer real hiring questions.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Instead of chasing vanity metrics, ThinkATS focuses on the basics:
            where candidates come from, where they get stuck, how scores are
            trending and how fast you move from open to hired — per role, per
            tenant and per client.
          </p>
        </div>
      </section>

      {/* CORE ANALYTICS BLOCKS */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Pipeline health */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Pipeline health
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              See where candidates are in the funnel and which roles are at risk
              because the pipeline is too thin, too noisy or simply stuck.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Stage counts per job and per tenant</li>
              <li>• Quick view of stuck candidates and aging roles</li>
              <li>• Active vs. closed roles at a glance</li>
            </ul>
          </div>

          {/* Role-level insights */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Role-level insights
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              For each role, get a clear feel for time-to-fill, drop-off points
              and which channels consistently send candidates who actually move
              forward.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Time-to-fill and time-in-stage indicators</li>
              <li>• Stage-level conversion patterns</li>
              <li>• Source and channel performance views</li>
            </ul>
          </div>

          {/* Tenant & client overview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Tenant &amp; client overview
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              For agencies and multi-entity groups, step back from individual
              roles and see how hiring is performing per tenant or client.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Jobs and pipelines per tenant or client</li>
              <li>• “Where are we hiring” and “where are we slow” views</li>
              <li>• Export-friendly layouts for leadership and board packs</li>
            </ul>
          </div>
        </div>

        {/* SCORING & QUALITY LAYER */}
        <div className="mt-10 grid gap-6 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Scoring, quality &amp; shortlists
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Because scoring and shortlisting are wired into the ATS, analytics
              can show not just volume, but quality — how many candidates are a
              strong match and how that shifts over time.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Distribution of match scores per role and tenant</li>
              <li>• Shortlist vs. total applicants at each stage</li>
              <li>• Trends when you tweak role requirements or sourcing</li>
              <li>• Audit-ready trail of how shortlists were produced</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-100 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              How it fits into ThinkATS
            </p>
            <p className="mt-2 text-[12px] text-slate-200">
              Analytics read directly from the same pipelines, scores and
              applications your team works in every day. There&apos;s no second
              system to maintain and no manual spreadsheet gymnastics before
              leadership can see what&apos;s going on.
            </p>
            <p className="mt-2 text-[12px] text-slate-200">
              Use it to answer practical questions: Which roles are at risk?
              Which tenants or clients need more focus? Are we moving high-score
              candidates fast enough?
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px]">
              <Link
                href="/product/features/ats"
                className="font-medium text-sky-300 hover:underline"
              >
                See the ATS &amp; pipelines layer →
              </Link>
              <Link
                href="/product/features/automation"
                className="font-medium text-sky-300 hover:underline"
              >
                See how automation keeps data fresh →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
