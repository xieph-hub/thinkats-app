// app/resources/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Resources | ThinkATS",
  description:
    "Guides, checklists and frameworks to help you design better hiring processes.",
};

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* HERO */}
      <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-sky-900/20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] text-emerald-300">
                ●
              </span>
              Resources
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Hiring frameworks you can{" "}
              <span className="text-sky-300">actually use.</span>
            </h1>

            <p className="max-w-2xl text-sm text-slate-300">
              Short, practical resources to help you design better processes,
              make clearer decisions and run hiring that respects both candidate
              time and your team&apos;s focus. Designed to sit alongside your
              ThinkATS workflows, not in a separate folder you forget about.
            </p>

            {/* Anchor chips */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px]">
              <a
                href="#playbooks"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-slate-100 shadow-sm hover:bg-slate-800"
              >
                Playbooks
              </a>
              <a
                href="#checklists"
                className="inline-flex items-center rounded-full border border-slate-700 px-4 py-1.5 text-slate-100 hover:bg-slate-900/60"
              >
                Checklists
              </a>
              <a
                href="#frameworks"
                className="inline-flex items-center rounded-full border border-slate-700 px-4 py-1.5 text-slate-100 hover:bg-slate-900/60"
              >
                Frameworks &amp; scorecards
              </a>
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              Over time, these can be delivered as PDFs, Notion-style docs or
              embedded directly into your ThinkATS workflows for specific
              roles and pipelines.
            </p>
          </div>
        </div>
      </section>

      {/* GRID: PLAYBOOKS / CHECKLISTS / FRAMEWORKS */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Playbook */}
          <article
            id="playbooks"
            className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm"
          >
            <p className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
              Playbook
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Designing a realistic interview process
            </h2>
            <p className="mt-2 flex-1 text-[12px] text-slate-300">
              Move from “CV screen + 3 interviews” to a tighter, more honest
              process that maps to how your team actually makes decisions – and
              that candidates can understand from the outside.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Mapping out stages to real decision points</li>
              <li>• Choosing the right signals per stage</li>
              <li>• Timeboxing and handling “maybe” candidates</li>
            </ul>
            <span className="mt-3 text-[11px] text-slate-400">
              PDF / article coming soon – ideal for Heads of People &amp;
              Talent Leads.
            </span>
          </article>

          {/* Checklist */}
          <article
            id="checklists"
            className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm"
          >
            <p className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
              Checklist
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Candidate experience audit
            </h2>
            <p className="mt-2 flex-1 text-[12px] text-slate-300">
              A simple audit you can run on any role – from application through
              offer – to see where candidates are confused, waiting too long or
              silently dropping off.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Application friction &amp; expectations</li>
              <li>• Communication and status updates</li>
              <li>• Interview logistics &amp; prep materials</li>
              <li>• Offer, rejection and feedback moments</li>
            </ul>
            <span className="mt-3 text-[11px] text-slate-400">
              Template coming soon – designed to be run quarterly or per
              flagship role.
            </span>
          </article>

          {/* Framework */}
          <article
            id="frameworks"
            className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm"
          >
            <p className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
              Framework
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Scorecards &amp; hiring signals
            </h2>
            <p className="mt-2 flex-1 text-[12px] text-slate-300">
              Turn vague “culture fit” into clear, observable signals that
              everyone on the panel understands – and that you can defend to
              candidates and leadership.
            </p>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <li>• Building role-specific scorecards</li>
              <li>• Separating must-haves from nice-to-haves</li>
              <li>• Capturing evidence, not gut feel comments</li>
            </ul>
            <span className="mt-3 text-[11px] text-slate-400">
              Framework coming soon – maps cleanly to ThinkATS stages &amp;
              evaluation fields.
            </span>
          </article>
        </div>

        {/* SECOND ROW: optional extra resource cards (still future-facing) */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <p className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
              Guide
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Designing stages for multi-tenant hiring
            </h2>
            <p className="mt-2 flex-1 text-[12px] text-slate-300">
              How to keep a consistent backbone across all your tenants or
              clients, while allowing for the differences that actually matter
              by role or organisation.
            </p>
            <span className="mt-3 text-[11px] text-slate-400">
              Guide coming soon – especially relevant for agencies and platforms.
            </span>
          </article>

          <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-200 shadow-sm">
            <p className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
              Template
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Interview pack for busy hiring managers
            </h2>
            <p className="mt-2 flex-1 text-[12px] text-slate-300">
              A single, shareable pack that gives hiring managers the JD,
              scorecard, sample questions and “what good looks like” in one
              place.
            </p>
            <span className="mt-3 text-[11px] text-slate-400">
              Template coming soon – easy to attach to ThinkATS roles or stages.
            </span>
          </article>
        </div>

        {/* HOW THIS WILL WIRE INTO THE PRODUCT */}
        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-100 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            How resources fit into ThinkATS
          </p>
          <div className="mt-2 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-[12px] text-slate-200">
              <p>
                Over time, this section can be wired into a CMS or a
                ThinkATS-powered content model so you can:
              </p>
              <ul className="mt-1 space-y-1.5 text-[11px] text-slate-300">
                <li>• Publish articles, checklists and templates without code</li>
                <li>• Attach specific resources to roles, pipelines or tenants</li>
                <li>• Share links with hiring managers directly from the ATS</li>
                <li>• Keep your playbooks versioned and centralised</li>
              </ul>
            </div>
            <div className="space-y-2 text-[12px] text-slate-200">
              <p>
                For now, it&apos;s intentionally light – but it signals that
                hiring craft is part of the product, not an afterthought.
              </p>
              <p className="text-[11px] text-slate-300">
                If you want these resources tailored to your own hiring setup,
                you can:
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full bg-sky-500 px-4 py-1.5 font-semibold text-slate-950 shadow-sm hover:bg-sky-400"
                >
                  Talk to us
                </Link>
                <Link
                  href="/product"
                  className="font-medium text-sky-300 hover:underline"
                >
                  Explore how ThinkATS works →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
