// app/product/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Product Overview | ThinkATS — ATS, Career Sites & Multi-Tenant Workspaces",
  description:
    "Get a complete view of the ThinkATS platform: ATS & pipelines, white-label career sites, multi-tenant workspaces, automation, analytics and integrations.",
};

export default function ProductPage() {
  return (
    <main className="bg-slate-50">
      {/* Hero / intro */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Product overview
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              One platform for ATS, career sites and multi-client recruitment.
            </h1>
            <p className="mt-4 text-sm text-slate-600 sm:text-base">
              ThinkATS combines a modern applicant tracking system, a white-label career sites
              engine and multi-tenant workspaces, so you can run recruitment for your own company —
              or dozens of clients — from a single, coherent system.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-[#1E40AF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1D3A9A]"
              >
                Start free trial
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-indigo-200 hover:bg-indigo-50"
              >
                Book a live demo
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Built for recruitment agencies, staffing firms and in-house HR teams.
            </p>
          </div>
        </div>
      </section>

      {/* High-level “pillars” summary */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                ATS & pipelines
              </p>
              <h2 className="mt-2 text-sm font-semibold text-slate-900">
                Modern ATS for structured, collaborative hiring.
              </h2>
              <p className="mt-2 text-xs text-slate-600">
                Track every candidate across roles, clients and stages with configurable pipelines,
                scorecards and communication tools.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                <li>• Per-job pipelines with drag-and-drop stages.</li>
                <li>• Candidate profiles with full history and notes.</li>
                <li>• Centralised email threads and activity timelines.</li>
              </ul>
              <div className="mt-3 text-xs">
                <Link
                  href="/product/features/ats"
                  className="font-semibold text-[#1E40AF] hover:underline"
                >
                  Explore ATS features →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Career sites engine
              </p>
              <h2 className="mt-2 text-sm font-semibold text-slate-900">
                Branded career sites for each client or business.
              </h2>
              <p className="mt-2 text-xs text-slate-600">
                Launch white-label career sites with job listings, job detail pages and application
                forms, built directly on top of ThinkATS.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                <li>• clientname.thinkats.com or careers.clientdomain.com.</li>
                <li>• SEO-friendly, mobile-ready job boards.</li>
                <li>• All applications flow into the right pipelines.</li>
              </ul>
              <div className="mt-3 text-xs">
                <Link
                  href="/career-sites"
                  className="font-semibold text-[#1E40AF] hover:underline"
                >
                  Learn about career sites →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Multi-tenant workspaces
              </p>
              <h2 className="mt-2 text-sm font-semibold text-slate-900">
                Scale from one team to hundreds of client accounts.
              </h2>
              <p className="mt-2 text-xs text-slate-600">
                Give each client or business unit its own workspace, while your team works across
                accounts from a single login.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                <li>• Clear data boundaries between clients.</li>
                <li>• Shared recruiters across multiple workspaces.</li>
                <li>• Central reporting across jobs and tenants.</li>
              </ul>
              <div className="mt-3 text-xs">
                <Link
                  href="/solutions/multi-client"
                  className="font-semibold text-[#1E40AF] hover:underline"
                >
                  See multi-client solution →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep dive: core modules */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[1.4fr,1fr]">
            {/* Left: ATS detail */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                ATS built for agencies and in-house HR teams.
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                ThinkATS keeps your whole hiring process in one place: job creation, approvals,
                candidate pipelines, email, interviews and offers.
              </p>

              <div className="mt-5 grid gap-4 text-xs text-slate-700 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold text-slate-900">
                    Jobs & pipelines
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    <li>• Create jobs with templates and structured fields.</li>
                    <li>• Configure stages per job or per workflow.</li>
                    <li>• Drag-and-drop candidates across stages.</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold text-slate-900">
                    Candidate profiles & talent pools
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    <li>• Rich candidate profiles with CV, notes and history.</li>
                    <li>• Global search across clients, roles and tags.</li>
                    <li>• Build reusable talent pools for future briefs.</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold text-slate-900">
                    Collaboration & scorecards
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    <li>• Structured scorecards per role.</li>
                    <li>• Interview feedback from hiring managers in one place.</li>
                    <li>• Activity feeds so no one misses key updates.</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold text-slate-900">
                    Email & communication
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    <li>• Send branded emails without leaving ThinkATS.</li>
                    <li>• Use templates for interviews, offers and rejections.</li>
                    <li>• Keep conversations linked to the right candidate & job.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right: simple “UI summary” card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-xs text-slate-100 shadow-lg">
              <p className="text-[11px] font-semibold text-slate-200">
                Example: pipeline for “Head of Growth — Resourcin”
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2 text-[10px]">
                {[
                  { label: "Applied", count: 48 },
                  { label: "Screening", count: 16 },
                  { label: "Interviews", count: 7 },
                  { label: "Offer", count: 2 },
                ].map((stage) => (
                  <div
                    key={stage.label}
                    className="rounded-xl bg-slate-800/80 p-2"
                  >
                    <p className="text-slate-300">{stage.label}</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {stage.count}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-800/80 p-3">
                <div>
                  <p className="text-[11px] text-slate-300">
                    Time-to-hire (last 90 days)
                  </p>
                  <p className="mt-1 text-xl font-semibold text-emerald-300">
                    21 days
                  </p>
                  <p className="mt-1 text-[10px] text-emerald-400">
                    29% faster than previous tools
                  </p>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <p>Top sources this quarter:</p>
                  <p>• Career site (44%)</p>
                  <p>• Referrals (29%)</p>
                  <p>• Job boards (17%)</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-slate-400">
                All examples here are illustrative. You’ll see your own data in real time once you
                switch to ThinkATS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Automation & integrations */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Automation */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Automation & communication
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Let workflows and templates do the repetitive work.
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Automate status updates, reminders and key candidate communication, while keeping
                full control over tone and timing.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li>• Email templates for every stage of the funnel.</li>
                <li>• Automated acknowledgements and basic rejections.</li>
                <li>• Internal reminders for overdue feedback or interviews.</li>
                <li>• Future-ready for AI-assisted matching and suggestions.</li>
              </ul>
              <div className="mt-3 text-xs">
                <Link
                  href="/product/features/automation"
                  className="font-semibold text-[#1E40AF] hover:underline"
                >
                  See automation roadmap →
                </Link>
              </div>
            </div>

            {/* Integrations */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Integrations
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Connect ThinkATS to the tools you already use.
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Start with the basics (email, calendar and video) and grow into background checks,
                assessments and HRIS systems as your needs expand.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li>• Email & calendar (Gmail, Outlook).</li>
                <li>• Video interviews (Zoom, Teams, Google Meet).</li>
                <li>• Job board distribution (future phases).</li>
                <li>• HRIS and payroll hooks via API & webhooks.</li>
              </ul>
              <div className="mt-3 text-xs">
                <Link
                  href="/product/features/integrations"
                  className="font-semibold text-[#1E40AF] hover:underline"
                >
                  View integration strategy →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For agencies vs in-house again, but focused */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              Designed for both service businesses and internal HR teams.
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              ThinkATS treats Resourcin as client zero — the same platform that powers your
              recruitment services business can power your clients’ careers pages and internal
              hiring too.
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Recruitment & talent businesses
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Run your agency or talent outsourcing practice on ThinkATS.
              </h3>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                <li>• One platform for all client briefs, jobs and candidates.</li>
                <li>• Offer “careers page + ATS” as a premium product to clients.</li>
                <li>• Keep a centralised talent pool while protecting client data.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                In-house HR & People teams
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Give hiring managers a clean, opinionated tool — not spreadsheets.
              </h3>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                <li>• Hiring managers review candidates in one shared ATS.</li>
                <li>• Everyone sees the same pipelines and scorecards.</li>
                <li>• Reporting connects hiring outcomes to business goals.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">
                Ready to make ThinkATS the engine behind your hiring and career sites?
              </h2>
              <p className="mt-2 max-w-xl text-xs text-slate-300">
                Start by running your own recruitment on ThinkATS — just like Resourcin — then roll
                it out to clients and business units as you grow.
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
                View pricing →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
