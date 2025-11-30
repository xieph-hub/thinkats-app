// app/product/features/analytics/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics & reporting | ThinkATS",
  description:
    "See jobs, pipelines and candidate flow in one place without drowning in charts.",
};

export default function AnalyticsFeaturesPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#172965]">
            Product · Analytics &amp; reporting
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Simple views that answer real hiring questions.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700">
            Instead of chasing vanity metrics, ThinkATS focuses on: where
            candidates come from, where they get stuck, and how fast you move
            from open to hired.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Pipeline health
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Understand how many candidates are in each stage and which roles
              are at risk because the funnel is too thin or too noisy.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Stage counts per job</li>
              <li>• Quick view of stuck candidates</li>
              <li>• Active vs. closed roles</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Role-level insights
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              For each role, get a feel for time-to-fill, drop-off points and
              where your best candidates are coming from.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Source breakdown (coming soon)</li>
              <li>• Stage-level conversion insights</li>
              <li>• Historical pipeline snapshots</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Tenant &amp; client overview
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              For agencies and multi-entity groups, roll up views per tenant or
              client without losing the detail of individual roles.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Jobs and pipelines per tenant</li>
              <li>• &quot;Where are we hiring&quot; overview</li>
              <li>• Ready for exports &amp; board decks</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-xs text-slate-700">
          <p>
            When you&apos;re ready, this page can showcase real charts and
            screenshots from the internal ATS dashboards — right now it&apos;s a
            safe, non-breaking placeholder aligned with the rest of your
            marketing.
          </p>
        </div>
      </section>
    </main>
  );
}
