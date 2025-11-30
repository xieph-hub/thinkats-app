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
    <main className="bg-slate-50">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-[#172965]/5">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#172965]">
            Product · ATS &amp; pipelines
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Pipelines that actually match how you hire.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700">
            ThinkATS gives you structured pipelines for each role — from
            &quot;applied&quot; to &quot;hired&quot; — with clear stage counts,
            inline updates and a single place to see where every candidate is.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
            >
              Start free trial
            </Link>
            <Link
              href="/ats/jobs"
              className="text-xs font-medium text-[#172965] hover:underline"
            >
              View internal pipelines →
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Per-job pipelines, not just a candidate dump
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Each role has its own pipeline view, so you can see stage counts,
              status and movement at a glance — without hunting through a
              generic candidate table.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Custom stages per job</li>
              <li>• Stage badges with candidate counts</li>
              <li>• Clear separation of active vs. terminal stages</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Fast, inline changes from the job view
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Move candidates between stages and update their status directly
              from the job detail page, without losing context or reloading
              complex screens.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Inline stage change controls</li>
              <li>• Status updates (pending, in progress, hired, rejected)</li>
              <li>• Instant feedback on what changed and where</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Built for agencies, in-house teams and founders
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Because ThinkATS is multi-tenant from day one, you can run
              pipelines for your own roles and for clients — with clear
              separation but shared tooling.
            </p>
            <ul className="mt-3 grid gap-2 text-[11px] text-slate-600 sm:grid-cols-3">
              <li>• Tenant-aware jobs and applications</li>
              <li>• Client-aware roles (where relevant)</li>
              <li>• Candidate reuse without losing history</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
