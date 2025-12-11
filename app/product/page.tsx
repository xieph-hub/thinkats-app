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
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* HERO */}
      <section className="border-b border-slate-900 bg-gradient-to-br from-slate-950 via-slate-950 to-sky-900/20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] text-emerald-300">
                ●
              </span>
              Product
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              One platform for jobs, pipelines and career sites.
            </h1>

            <p className="max-w-2xl text-sm text-slate-300">
              ThinkATS helps you publish roles, manage candidates and present a
              clean hiring experience — in a multi-tenant system that works for
              a single organisation, a portfolio of subsidiaries or dozens of
              clients at once.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px]">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-sky-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-sky-400"
              >
                Talk to us about your setup
              </Link>
              <Link
                href="/jobs"
                className="text-xs font-medium text-sky-300 hover:underline"
              >
                See a live jobs board →
              </Link>
            </div>

            <p className="mt-2 text-[11px] text-slate-400">
              Built for agencies, in-house teams, founders and platforms that
              need serious hiring workflows without a bloated, noisy ATS.
            </p>
          </div>
        </div>
      </section>

      {/* CORE MODULES */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/product/features/ats"
            className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm hover:border-sky-400/70 hover:bg-slate-900"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              ATS &amp; pipelines
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Structured pipelines per role
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Create roles, design stages that match how you actually hire and
              move candidates from applied to hired with one shared view for the
              team.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Per-job pipelines with clear stage counts</li>
              <li>• Inline stage &amp; status changes from the job view</li>
              <li>• Single candidate record across roles and tenants</li>
            </ul>
            <p className="mt-3 text-[11px] font-medium text-sky-300">
              Learn more about pipelines →
            </p>
          </Link>

          <Link
            href="/career-sites"
            className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm hover:border-sky-400/70 hover:bg-slate-900"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Career sites engine
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Branded jobs hubs on your domains
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Turn your jobs into clean, branded hubs on your own domain or
              subdomains, with role pages and application flows powered directly
              by the ATS.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Public jobs listing with filters and search</li>
              <li>• Rich role detail pages with share links</li>
              <li>• Short, CV-first application forms</li>
            </ul>
            <p className="mt-3 text-[11px] font-medium text-sky-300">
              Explore career sites →
            </p>
          </Link>

          <Link
            href="/product/features/automation"
            className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm hover:border-sky-400/70 hover:bg-slate-900"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Automation &amp; emails
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Communication that still sounds like you
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              Keep candidates and stakeholders informed with simple, honest
              emails triggered by real changes in the pipeline — not spammy
              sequences.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Application acknowledgements &amp; status updates</li>
              <li>• Stage-based notifications where they actually help</li>
              <li>• Internal digests for hiring managers &amp; HR</li>
            </ul>
            <p className="mt-3 text-[11px] font-medium text-sky-300">
              See automation examples →
            </p>
          </Link>
        </div>

        {/* SECOND ROW: ANALYTICS + MULTI-TENANT STORY */}
        <div className="mt-8 grid gap-6 md:grid-cols-[2fr,1.5fr]">
          <Link
            href="/product/features/analytics"
            className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm hover:border-sky-400/70 hover:bg-slate-900"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Analytics &amp; reporting
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Answers to real hiring questions
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              See where candidates come from, where they get stuck and which
              roles are at risk — without drowning in dashboards you never look
              at.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Stage counts, stuck candidates and ageing roles</li>
              <li>• Role-level views for time-to-fill and drop-off</li>
              <li>• Tenant and client roll-ups for agencies &amp; groups</li>
            </ul>
            <p className="mt-3 text-[11px] font-medium text-sky-300">
              Learn more about analytics →
            </p>
          </Link>

          <Link
            href="/solutions"
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Multi-tenant by default
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              One workspace, many tenants &amp; clients
            </h2>
            <p className="mt-2 text-[12px] text-slate-300">
              ThinkATS is built for agencies, in-house teams and groups that
              manage hiring across multiple entities. You can start with one
              tenant and add more as you go.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Tenant-aware jobs, candidates and applications</li>
              <li>• Client-aware roles where needed</li>
              <li>• Clean separation + shared tooling for your team</li>
            </ul>
            <p className="mt-3 text-[11px] font-medium text-sky-300">
              See who ThinkATS is for →
            </p>
          </Link>
        </div>

        {/* CTA STRIP */}
        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-xs text-slate-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Next step
              </p>
              <p className="mt-1 text-sm text-slate-100">
                If you&apos;re running hiring for a group, an agency or a single
                organisation and want a cleaner ATS, we can map ThinkATS to your
                reality in a short call.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-sky-500 px-4 py-2 text-[11px] font-semibold text-slate-950 hover:bg-sky-400"
              >
                Book a walkthrough
              </Link>
              <Link
                href="/jobs"
                className="text-[11px] font-medium text-sky-300 hover:underline"
              >
                Browse a live jobs hub →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
