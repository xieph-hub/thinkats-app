// app/product/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Product | ThinkATS",
  description:
    "See how ThinkATS combines ATS pipelines, career sites, automation and analytics into one modern recruiting platform.",
};

export default function ProductPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-[#172965]/5">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#172965]">
            Product
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            One platform for jobs, pipelines and career sites.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700">
            ThinkATS helps you publish roles, manage candidates and present a
            clean career experience — all in one multi-tenant system that can
            grow from “one tenant” (Resourcin) to dozens of clients.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
            >
              Start free trial
            </Link>
            <Link
              href="/jobs"
              className="text-xs font-medium text-[#172965] hover:underline"
            >
              See a live career site →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              ATS &amp; pipelines
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Create roles, build bespoke stages and move candidates from
              &quot;applied&quot; to &quot;hired&quot; with inline status
              changes, structured notes and a clear pipeline view per job.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Per-job pipelines with stage counts</li>
              <li>• Inline stage &amp; status updates</li>
              <li>• Single candidate view across all jobs</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Career sites engine
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Turn your jobs into a clean, branded careers page on your domain
              or a subdomain, without hacking together landing pages or forms.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Public jobs listing with filters</li>
              <li>• Beautiful role detail pages</li>
              <li>• Short, frictionless application flow</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Automation &amp; insights
            </h2>
            <p className="mt-2 text-xs text-slate-600">
              Keep candidates updated and internal stakeholders in the loop with
              consistent email flows and simple dashboards for jobs and
              applications.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
              <li>• Candidate acknowledgements</li>
              <li>• Internal notifications for new applicants</li>
              <li>• Tenant-level dashboards for jobs &amp; pipelines</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
