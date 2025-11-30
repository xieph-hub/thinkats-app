// app/career-sites/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Career Sites | ThinkATS — White-Label Career Pages for Agencies & Employers",
  description:
    "Launch branded career sites for every client or business unit with ThinkATS. Use clientname.thinkats.com or careers.clientdomain.com, powered by one modern ATS.",
};

export default function CareerSitesPage() {
  return (
    <main className="bg-slate-50">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Career Sites
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              Career sites your candidates actually want to use.
            </h1>
            <p className="mt-4 text-sm text-slate-600 sm:text-base">
              ThinkATS turns your ATS into a full career-site engine. Launch branded, mobile-ready
              job boards for each client or business unit — with all applications flowing straight
              into structured pipelines.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800"
              >
                Start free trial
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-indigo-200 hover:bg-indigo-50"
              >
                Book a demo
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Offer career sites as a service to your clients, or power your own careers page as an
              in-house HR team.
            </p>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              Everything candidates expect from a modern careers experience.
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              No more static pages, hard-coded forms or scattered inboxes. ThinkATS gives you a job
              board, job detail pages, and application forms that connect directly to your ATS —
              for each brand you support.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Branded job board
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Beautiful, searchable job listings
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                List all open roles with filters for location, department, work type and seniority.
                Fully responsive and designed to look great on mobile.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                <li>• Candidate-friendly design, built for conversion.</li>
                <li>• SEO-friendly URLs and meta tags.</li>
                <li>• Instant updates when jobs change in the ATS.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Job detail & apply
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Clear job pages with frictionless applications
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Rich job descriptions, requirements and benefits, with a streamlined application
                form that feeds directly into your pipelines.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                <li>• CV upload, basic profile fields and custom questions.</li>
                <li>• Auto-routing to the right job and stage.</li>
                <li>• Confirmation messages and branded emails from ThinkATS.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Multi-brand ready
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                One platform, many career sites
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Launch separate career sites for each client, subsidiary or business line — all
                powered by a single ThinkATS instance.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                <li>• clientname.thinkats.com for agencies & clients.</li>
                <li>• careers.clientdomain.com for full white-label.</li>
                <li>• Different branding, one central ATS and talent database.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* For agencies vs in-house businesses */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Agencies */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                For recruitment agencies & staffing firms
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Sell career sites as a service, powered by ThinkATS.
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Turn career sites into part of your commercial offer: give each client a modern
                careers experience while your team works from one multi-tenant ATS.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li>• Set up a dedicated career site per client in minutes.</li>
                <li>• Keep client data separated, while recruiters work across accounts.</li>
                <li>• Offer “careers page + managed hiring” as a bundled product.</li>
                <li>• Upgrade to custom domains and deeper branding for premium tiers.</li>
              </ul>
            </div>

            {/* In-house HR */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                For in-house HR & People teams
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Power your own careers page without a dev team.
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Replace static careers pages and manual forms with a live, self-updating job board
                connected to a structured ATS.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li>• careers.yourcompany.com mapped to ThinkATS.</li>
                <li>• Hiring managers log into ThinkATS to review candidates & leave feedback.</li>
                <li>• Candidates always see accurate, current roles — no more stale listings.</li>
                <li>• Reporting on sources, time-to-hire and funnel health out of the box.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* URL patterns & examples */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              Simple, predictable URL patterns.
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Whether you’re running a recruitment brand like Resourcin or powering a corporate
              careers page, the URL structure is clean and easy to communicate.
            </p>
          </div>

          <div className="mt-6 grid gap-4 text-xs text-slate-700 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Default ThinkATS-hosted patterns
              </p>
              <ul className="mt-3 space-y-1.5 font-mono text-[11px]">
                <li>
                  <span className="text-slate-400">Career site:</span> clientname.thinkats.com
                </li>
                <li>
                  <span className="text-slate-400">Job board:</span> clientname.thinkats.com/jobs
                </li>
                <li>
                  <span className="text-slate-400">Job detail:</span>{" "}
                  clientname.thinkats.com/jobs/head-of-growth
                </li>
                <li>
                  <span className="text-slate-400">Apply:</span>{" "}
                  clientname.thinkats.com/jobs/head-of-growth/apply
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Custom domain patterns (white-label)
              </p>
              <ul className="mt-3 space-y-1.5 font-mono text-[11px]">
                <li>
                  <span className="text-slate-400">Career site:</span> careers.clientdomain.com
                </li>
                <li>
                  <span className="text-slate-400">Job board:</span> careers.clientdomain.com/jobs
                </li>
                <li>
                  <span className="text-slate-400">Job detail:</span>{" "}
                  careers.clientdomain.com/jobs/head-of-growth
                </li>
                <li>
                  <span className="text-slate-400">Apply:</span>{" "}
                  careers.clientdomain.com/jobs/head-of-growth/apply
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            DNS and domain setup is guided inside ThinkATS, with step-by-step instructions you can
            share with clients or your internal IT team.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">
                Ready to offer modern career sites — under your brand or your clients’?
              </h2>
              <p className="mt-2 max-w-xl text-xs text-slate-300">
                Start with your own career site, then roll out ThinkATS to your clients as a
                fully-branded hiring experience, powered by a single ATS.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
              >
                Start free trial
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-full border border-slate-500 bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-100 hover:border-slate-300 hover:bg-slate-800"
              >
                See pricing →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
