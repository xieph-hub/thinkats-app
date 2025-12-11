// app/product/features/analytics/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics & reporting | ThinkATS",
  description:
    "See jobs, pipelines and candidate flow in one place without drowning in charts.",
};

export default function AnalyticsFeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
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
            where candidates come from, where they get stuck and how fast you
            move from open to hired — per role, per tenant and per client.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Pipeline health
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Understand how many candidates are in each stage and which roles
              are at risk because the funnel is too thin, too noisy or simply
              stuck.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Stage counts per job</li>
              <li>• Quick view of stuck candidates</li>
              <li>• Active vs. closed roles at a glance</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Role-level insights
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              For each role, get a feel for time-to-fill, drop-off points and
              where your best candidates are coming from — without needing a
              data analyst to interpret the charts.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Source breakdown (coming soon)</li>
              <li>• Stage-level conversion insights</li>
              <li>• Historical pipeline snapshots per job</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Tenant &amp; client overview
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              For agencies and multi-entity groups, roll up views per tenant or
              client without losing the detail of individual roles and
              candidates underneath.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Jobs and pipelines per tenant</li>
              <li>• “Where are we hiring” overview across entities</li>
              <li>• Ready for exports &amp; leadership / board decks</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            What this page will show later
          </p>
          <p className="mt-2 text-[12px] text-slate-200">
            When you&apos;re ready, this page can showcase real charts and
            screenshots from the internal ATS dashboards — right now it&apos;s a
            safe, non-breaking placeholder aligned with the rest of your
            marketing and the data model you&apos;re already building.
          </p>
        </div>
      </section>
    </main>
  );
}
