// app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ThinkATS — Modern ATS & Career Sites Engine for Agencies and In-House Teams",
  description:
    "ThinkATS is a multi-tenant ATS and white-label career sites engine for recruitment agencies and in-house HR teams. Power your hiring workflows and branded career pages from a single platform.",
};

export default function Page() {
  return (
    <main className="bg-slate-50">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:items-center md:py-20 lg:px-8">
          {/* Left: copy */}
          <div className="flex-1">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-100">
              Built for agencies & growing businesses
            </span>

            <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
              The ATS that powers{" "}
              <span className="text-indigo-700">your hiring</span> <br className="hidden sm:block" />
              <span className="text-indigo-700">&amp; your career site.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm text-slate-600 sm:text-base">
              ThinkATS combines a modern applicant tracking system with white-label career sites,
              so recruitment agencies and in-house HR teams can run end-to-end hiring and branded
              career pages from one place.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800"
              >
                Start free trial
              </Link>
              <Link
                href="/career-sites"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                Explore career sites
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              No credit card required · Built for multi-client agencies, staffing firms, and internal HR teams.
            </p>

            {/* Trust strip */}
            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-[11px] text-emerald-700">
                  ✓
                </span>
                <span>White-label career sites for every client or business unit</span>
              </div>
              <div className="hidden h-4 w-px bg-slate-200 sm:block" />
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-[11px] text-indigo-700">
                  ◎
                </span>
                <span>Multi-tenant ATS, ready to scale from 1 → 1,000 clients</span>
              </div>
            </div>
          </div>

          {/* Right: product preview card */}
          <div className="flex-1">
            <div className="relative mx-auto max-w-md rounded-2xl border border-slate-200 bg-slate-900 p-4 text-xs text-slate-100 shadow-xl">
              <div className="mb-3 flex items-center justify-between text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  Live: resourcin.thinkats.com
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px]">
                  Example client career site
                </span>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-slate-200">Resourcin Careers</p>
                    <p className="text-[11px] text-slate-400">
                      Powered by <span className="font-semibold text-indigo-300">ThinkATS</span>
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-300">
                    12 open roles
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    {
                      title: "Head of Growth",
                      meta: "Lagos · Full-time · Hybrid",
                    },
                    {
                      title: "Senior Product Manager",
                      meta: "Remote · Full-time",
                    },
                    {
                      title: "People Operations Lead",
                      meta: "Nairobi · Full-time",
                    },
                  ].map((job) => (
                    <div
                      key={job.title}
                      className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2"
                    >
                      <div>
                        <p className="text-[11px] font-medium text-slate-50">{job.title}</p>
                        <p className="text-[10px] text-slate-400">{job.meta}</p>
                      </div>
                      <button className="rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-indigo-500">
                        View job
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
                <div className="rounded-xl bg-slate-800/80 p-3">
                  <p className="text-slate-300">Active jobs</p>
                  <p className="mt-1 text-lg font-semibold text-white">28</p>
                  <p className="mt-1 text-[10px] text-emerald-300">+6 this week</p>
                </div>
                <div className="rounded-xl bg-slate-800/80 p-3">
                  <p className="text-slate-300">Candidates</p>
                  <p className="mt-1 text-lg font-semibold text-white">4,120</p>
                  <p className="mt-1 text-[10px] text-slate-400">Multi-client talent pool</p>
                </div>
                <div className="rounded-xl bg-slate-800/80 p-3">
                  <p className="text-slate-300">Avg. time-to-hire</p>
                  <p className="mt-1 text-lg font-semibold text-white">19 days</p>
                  <p className="mt-1 text-[10px] text-emerald-300">−32% vs baseline</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Who ThinkATS is for */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                Built for agencies, staffing firms & in-house HR teams
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Whether you’re running a recruitment services business like Resourcin or leading
                internal hiring for a growing company, ThinkATS gives you an ATS, talent CRM and
                career site engine in one platform.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Recruitment agencies
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Multi-client ATS with white-label career sites
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Onboard every client into its own workspace, launch a branded career site, and keep
                all pipelines, scorecards and communication in one system.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                <li>• Separate pipelines per client, shared talent pools across clients.</li>
                <li>• Offer “powered by ThinkATS” career sites as a billable service.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                In-house HR & People teams
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                One source of truth for jobs, candidates & hiring managers
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Replace spreadsheets, forms and scattered inboxes with a single ATS powering your
                public career page and internal approvals.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                <li>• careers.yourcompany.com powered by ThinkATS.</li>
                <li>• Hiring managers collaborate in structured pipelines & scorecards.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Talent & outsourcing businesses
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                BPO, outsourcing & talent marketplace ops in one system
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Run high-volume hiring, remote talent benches and continuous sourcing with
                structured pipelines and branded job boards.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                <li>• Keep a live bench of vetted talent per client or program.</li>
                <li>• Launch niche career sites for each business line or geography.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Core pillars */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                Three pillars: Career sites, ATS, and multi-tenant scale
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Everything you need to run branded career pages and structured hiring workflows for
                one company — or hundreds of clients.
              </p>
            </div>
            <Link
              href="/product"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800 hover:border-indigo-200 hover:bg-indigo-50"
            >
              View full product overview →
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {/* Career Sites */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                01 · Career sites engine
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Branded career sites for every business you support
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Launch a full career site in minutes: logo, brand colors, job filters and SEO-ready
                URLs. Use clientname.thinkats.com or map to careers.clientdomain.com.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                <li>• Mobile-ready job board & job detail pages.</li>
                <li>• Hosted by ThinkATS, branded as your client.</li>
                <li>• “Powered by ThinkATS” footer (optional per plan).</li>
              </ul>
              <div className="mt-4 text-xs text-indigo-700">
                <Link href="/career-sites" className="font-semibold hover:underline">
                  Learn more about career sites →
                </Link>
              </div>
            </div>

            {/* ATS & pipelines */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                02 · Modern ATS
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Structured pipelines, scorecards & communication in one place
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Track every candidate from first touch to hire with configurable stages, email
                templates, interview scheduling and scorecards.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                <li>• Per-job pipelines and global talent pools.</li>
                <li>• Centralised email threads, notes and activity.</li>
                <li>• Pipeline and time-to-hire reporting out of the box.</li>
              </ul>
            </div>

            {/* Multi-tenant scale */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                03 · Multi-tenant by design
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                From a single team to 1,000+ client workspaces
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Each client or business unit gets its own workspace, jobs and pipelines — while your
                team manages everything securely from one admin view.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                <li>• Clear data boundaries per client.</li>
                <li>• Shared recruiter logins across multiple workspaces.</li>
                <li>• Pricing that scales with users and tenants, not chaos.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Simple “How it works” strip */}
      <section className="bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">
                Get your first client or business live in a weekend.
              </h2>
              <p className="mt-2 max-w-xl text-xs text-slate-300">
                Create a workspace, connect your domain, publish a career site and start tracking
                applications — without writing a line of code.
              </p>
            </div>
            <div className="mt-4 grid flex-1 grid-cols-1 gap-3 text-xs text-slate-100 md:mt-0 md:grid-cols-3">
              <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3">
                <p className="text-[11px] font-semibold text-emerald-300">Step 1</p>
                <p className="mt-1 font-medium">Create your workspace</p>
                <p className="mt-1 text-[11px] text-slate-300">
                  Set up your company or agency, invite your team and choose default hiring stages.
                </p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3">
                <p className="text-[11px] font-semibold text-amber-300">Step 2</p>
                <p className="mt-1 font-medium">Launch a career site</p>
                <p className="mt-1 text-[11px] text-slate-300">
                  Configure brand colors, connect a subdomain or custom domain, and publish your
                  first roles.
                </p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3">
                <p className="text-[11px] font-semibold text-indigo-300">Step 3</p>
                <p className="mt-1 font-medium">Track, collaborate, hire</p>
                <p className="mt-1 text-[11px] text-slate-300">
                  Move candidates through stages, collect feedback and keep hiring managers aligned
                  in one system.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
            >
              See pricing & plans →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
