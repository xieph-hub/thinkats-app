// app/product/features/ats/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ATS & pipelines | ThinkATS",
  description:
    "Design clear hiring pipelines, move candidates between stages and keep everyone aligned on who is where.",
};

export default function AtsFeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Hero */}
      <section className="border-b border-slate-900 bg-gradient-to-br from-slate-950 via-slate-950 to-sky-900/20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            Product · ATS &amp; pipelines
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            Pipelines that actually match how you hire.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            ThinkATS gives you structured pipelines for each role — from
            applied to hired — with stage counts, inline updates and a single
            place to see where every candidate is across jobs and tenants.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full bg-sky-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-sky-400"
            >
              Talk to us about your pipelines
            </Link>
            <Link
              href="/ats/jobs"
              className="text-xs font-medium text-sky-300 hover:underline"
            >
              View internal jobs workspace →
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Per-job pipelines, not a candidate dump
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Each role has its own pipeline view, so you can see stage counts,
              movement and risk at a glance — instead of scrolling a generic
              candidate list.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Custom stages per job, with clear order</li>
              <li>• Stage badges with candidate counts</li>
              <li>• Separation of active vs. terminal stages</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-50">
              Fast, inline changes from the job view
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Move candidates between stages, update status and leave notes
              directly from the job detail page, without bouncing between
              screens or modal mazes.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Inline stage change controls per candidate</li>
              <li>• Status updates (in process, on hold, hired, rejected)</li>
              <li>• Timeline of changes visible to the hiring team</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm md:col-span-2">
            <h2 className="text-sm font-semibold text-slate-50">
              Built for agencies, in-house teams and groups
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Because ThinkATS is multi-tenant from day one, you can run
              pipelines for your own roles and for clients — with clear
              separation but shared tooling and reporting.
            </p>
            <ul className="mt-3 grid gap-2 text-[11px] text-slate-300 sm:grid-cols-3">
              <li>• Tenant-aware jobs and applications</li>
              <li>• Optional client-aware roles for agencies</li>
              <li>• Candidate reuse without losing history</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Where this fits in the product
          </p>
          <p className="mt-2 text-[12px] text-slate-200">
            The ATS and pipeline layer underpins everything else in ThinkATS:
            career sites publish jobs from here, automation responds to pipeline
            changes and analytics reads directly from these stages — no manual
            syncing or side spreadsheets.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px]">
            <Link
              href="/product/features/automation"
              className="font-medium text-sky-300 hover:underline"
            >
              See how automation sits on top →
            </Link>
            <Link
              href="/product/features/analytics"
              className="font-medium text-sky-300 hover:underline"
            >
              View reporting &amp; insights →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
