// app/product/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Product | ThinkATS",
  description:
    "See how ThinkATS combines ATS pipelines, career sites, automation, analytics and integrations into one modern recruiting platform.",
};

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* HERO */}
      <section className="border-b border-slate-900 bg-gradient-to-br from-slate-950 via-slate-950 to-[#172965]/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            Product
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            One engine for jobs, pipelines and career sites.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            ThinkATS powers multi-tenant ATS workspaces, branded job hubs and
            clean application flows on your own domains and subdomains — built
            for agencies, in-house teams and modern platforms running hiring
            for more than one brand.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full bg-sky-500 px-5 py-2 font-semibold text-slate-950 shadow-md shadow-sky-500/40 hover:bg-sky-400"
            >
              Talk to the ThinkATS team
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/60 px-4 py-2 font-semibold text-slate-100 hover:border-sky-400 hover:text-sky-100"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* NAV OVERVIEW OF MODULES */}
      <section className="border-b border-slate-900 bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-slate-400">Explore the product:</span>
            <Link
              href="/product/features/ats"
              className="rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 font-medium text-slate-100 hover:border-sky-400 hover:text-sky-100"
            >
              ATS &amp; pipelines
            </Link>
            <Link
              href="/career-sites"
              className="rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 font-medium text-slate-100 hover:border-sky-400 hover:text-sky-100"
            >
              Career sites engine
            </Link>
            <Link
              href="/product/features/automation"
              className="rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 font-medium text-slate-100 hover:border-sky-400 hover:text-sky-100"
            >
              Automation &amp; emails
            </Link>
            <Link
              href="/product/features/analytics"
              className="rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 font-medium text-slate-100 hover:border-sky-400 hover:text-sky-100"
            >
              Analytics &amp; reporting
            </Link>
            <Link
              href="/product/features/integrations"
              className="rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 font-medium text-slate-100 hover:border-sky-400 hover:text-sky-100"
            >
              Integrations
            </Link>
          </div>
        </div>
      </section>

      {/* CORE PILLARS */}
      <section className="border-b border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
              Core product
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
              Everything you expect from a modern ATS — built for multi-tenant
              setups from day one.
            </h2>
            <p className="mt-3 text-[12px] text-slate-400">
              Instead of stitching together separate tools for jobs, pipelines
              and career sites, ThinkATS gives you one shared engine with
              tenants, clients and brands modelled in the database — not just in
              spreadsheets.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3 text-[11px]">
            {/* ATS & Pipelines */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="text-xs font-semibold text-slate-50">
                ATS &amp; pipelines
              </h3>
              <p className="mt-2 text-slate-300 text-[12px]">
                Per-job pipelines from applied to hired, with candidates tied to
                tenants and roles instead of one flat table.
              </p>
              <ul className="mt-3 space-y-1.5 text-slate-300">
                <li>• Custom stages per job, with stage counts</li>
                <li>• Single candidate view across all jobs</li>
                <li>• Notes, decisions and basic activity history</li>
                <li>• Support for internal and external roles</li>
              </ul>
              <div className="mt-4">
                <Link
                  href="/product/features/ats"
                  className="text-[11px] font-semibold text-sky-300 hover:text-sky-200 hover:underline"
                >
                  Learn more about ATS &amp; pipelines →
                </Link>
              </div>
            </div>

            {/* Career Sites */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="text-xs font-semibold text-slate-50">
                Career sites &amp; job hubs
              </h3>
              <p className="mt-2 text-slate-300 text-[12px]">
                Branded jobs hubs on your own domains and subdomains, powered by
                the same data your ATS uses — no duplicate forms.
              </p>
              <ul className="mt-3 space-y-1.5 text-slate-300">
                <li>• Tenant-branded hubs and job pages</li>
                <li>• Filters for location, function and keywords</li>
                <li>• CV-first application flow with secure storage</li>
                <li>• Clean experience on desktop and mobile</li>
              </ul>
              <div className="mt-4">
                <Link
                  href="/career-sites"
                  className="text-[11px] font-semibold text-sky-300 hover:text-sky-200 hover:underline"
                >
                  Explore the career sites engine →
                </Link>
              </div>
            </div>

            {/* Automation & Analytics */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="text-xs font-semibold text-slate-50">
                Automation, analytics &amp; context
              </h3>
              <p className="mt-2 text-slate-300 text-[12px]">
                Simple, honest communication and lightweight analytics so you
                always know where roles and candidates stand.
              </p>
              <ul className="mt-3 space-y-1.5 text-slate-300">
                <li>• Application acknowledgements and key updates</li>
                <li>• Stage and status changes that stay in sync</li>
                <li>• Basic views of pipeline health and job status</li>
                <li>• Export-friendly snapshots for leadership reviews</li>
              </ul>
              <div className="mt-4 space-y-1">
                <Link
                  href="/product/features/automation"
                  className="block text-[11px] font-semibold text-sky-300 hover:text-sky-200 hover:underline"
                >
                  Automation &amp; emails →
                </Link>
                <Link
                  href="/product/features/analytics"
                  className="block text-[11px] font-semibold text-sky-300 hover:text-sky-200 hover:underline"
                >
                  Analytics &amp; reporting →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW DIFFERENT TEAMS USE IT */}
      <section className="border-b border-slate-900 bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                How teams use ThinkATS
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                The same engine, tuned for agencies, in-house teams and
                platforms.
              </h2>
            </div>
            <p className="max-w-md text-[12px] text-slate-400">
              Multi-tenant structure is built into the data model, so you can
              start with one tenant and grow into multiple brands, clients or
              entities without migrating tools.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3 text-[11px]">
            {/* In-house */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="text-xs font-semibold text-slate-50">
                In-house HR &amp; People teams
              </h3>
              <p className="mt-2 text-[12px] text-slate-300">
                Keep hiring managers aligned, reduce back-and-forth and keep
                every role visible — from leadership positions to specialist
                hires.
              </p>
              <ul className="mt-3 space-y-1.5 text-slate-300">
                <li>• Clear pipelines for critical roles</li>
                <li>• Shared candidate history across departments</li>
                <li>• Simple dashboards for HR leadership</li>
                <li>• Candidate communication that still feels human</li>
              </ul>
            </div>

            {/* Agencies */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="text-xs font-semibold text-slate-50">
                Recruitment &amp; search agencies
              </h3>
              <p className="mt-2 text-[12px] text-slate-300">
                Run multiple mandates and clients from one place, with clear
                separation by tenant and shared tooling across the whole desk.
              </p>
              <ul className="mt-3 space-y-1.5 text-slate-300">
                <li>• Tenants per client, brand or portfolio</li>
                <li>• Client-ready shortlists without extra spreadsheets</li>
                <li>• Shared talent pool for repeated roles</li>
                <li>• Branded job hubs for each client</li>
              </ul>
            </div>

            {/* Platforms & founders */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="text-xs font-semibold text-slate-50">
                Founders, platforms &amp; group structures
              </h3>
              <p className="mt-2 text-[12px] text-slate-300">
                Whether you&apos;re hiring across a group of companies or
                embedding hiring into a platform, ThinkATS gives you one place
                to run jobs and see what&apos;s live.
              </p>
              <ul className="mt-3 space-y-1.5 text-slate-300">
                <li>• Shared engine across multiple entities</li>
                <li>• Clear view of “who is hiring what, where”</li>
                <li>• Hubs that live on your existing domains</li>
                <li>• Ready to feed leadership and board reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS STRIP */}
      <section className="border-b border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)] items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                Integrations
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-50">
                Fits into your existing HR and collaboration stack.
              </h2>
              <p className="mt-2 text-[12px] text-slate-400">
                ThinkATS is designed to sit neatly between sourcing and your
                people systems — connecting to email, calendars, document
                storage and HR tools instead of trying to replace everything.
              </p>
              <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
                <li>• Email and calendar-friendly hiring flows</li>
                <li>• Secure CV and document storage with clear links</li>
                <li>• Exportable views for HR hand-off</li>
                <li>• API-first mindset for deeper connections</li>
              </ul>
              <div className="mt-4">
                <Link
                  href="/product/features/integrations"
                  className="text-[11px] font-semibold text-sky-300 hover:text-sky-200 hover:underline"
                >
                  See how integrations work →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-[11px] text-slate-300">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                One engine, multiple tenants
              </p>
              <p className="mt-2 text-[12px] text-slate-200">
                Under the hood, tenants, jobs, candidates and hubs are all
                linked. That means:
              </p>
              <ul className="mt-3 space-y-1.5">
                <li>• No duplicate configuration per client</li>
                <li>• Shared infrastructure with clear boundaries</li>
                <li>• Consistent data model for analytics</li>
                <li>• Space to layer on scoring and automation over time</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-6 text-[12px] text-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-50">
                Ready to map ThinkATS to your hiring setup?
              </p>
              <p className="mt-1 max-w-lg text-[12px] text-slate-300">
                A short walkthrough is usually enough to see how tenants, jobs,
                pipelines and hubs line up with your current teams and brands.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-sky-500 px-5 py-2 text-[11px] font-semibold text-slate-950 hover:bg-sky-400"
              >
                Talk to the ThinkATS team
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-[11px] font-semibold text-slate-100 hover:border-sky-400 hover:text-sky-100"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
