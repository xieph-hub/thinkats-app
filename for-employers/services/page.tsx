// app/for-employers/services/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services for Employers | Resourcin",
  description:
    "Resourcin helps founders and People teams hire faster and smarter across Africa and global markets — from one-off searches to embedded recruiting and EOR.",
};

const offerings = [
  {
    id: "ta",
    label: "Talent Acquisition Projects",
    badge: "Project-based hiring",
    description:
      "Scoped hiring projects for specific roles or pods — from first sales hires to full product teams.",
    scenarios: [
      "You need to fill 3–10 roles in 60–120 days.",
      "You’ve tried job boards and referrals with limited traction.",
      "You want curated shortlists and structured feedback loops.",
    ],
    outcomes: [
      "Well-defined role scorecards and interview plans.",
      "Shortlisted candidates that match your stage and context.",
      "Closed hires with clean documentation and handover.",
    ],
  },
  {
    id: "exec",
    label: "Executive & Specialist Search",
    badge: "Leadership & niche roles",
    description:
      "Targeted search for senior, scarce, or business-critical roles where context-fit matters as much as credentials.",
    scenarios: [
      "You’re hiring a GM, Country Manager, VP, or functional head.",
      "You need to map competitors and adjacent talent pools.",
      "You want a tightly managed, discreet process with clear narratives.",
    ],
    outcomes: [
      "Search strategy and calibrated target profile.",
      "Curated leadership pipeline with structured scorecards.",
      "Offer support, references, and onboarding alignment.",
    ],
  },
  {
    id: "rpo",
    label: "RPO / Embedded Recruiters",
    badge: "In-house extension",
    description:
      "Resourcin recruiters embedded into your team — running your pipeline, interviews, and reporting under your brand.",
    scenarios: [
      "You have ongoing hiring but no in-house recruiter.",
      "Your People team is overstretched and needs extra hands.",
      "You want your ATS, process, and employer brand to be used — not replaced.",
    ],
    outcomes: [
      "Cleaned-up pipelines and hiring dashboards.",
      "Standardised interview loops and better candidate experience.",
      "Lower cost-per-hire vs pure agency models over time.",
    ],
  },
  {
    id: "eor",
    label: "Employer of Record (EOR) Support",
    badge: "Cross-border hiring",
    description:
      "Structure, partners, and guidance to employ talent compliantly across borders with the right EOR stack.",
    scenarios: [
      "You want to hire in markets where you don’t have an entity.",
      "You’re comparing EOR vendors and contract structures.",
      "You need clarity on total cost of employment per market.",
    ],
    outcomes: [
      "Shortlist of vetted EOR options for your use case.",
      "Clear cost breakdowns and template agreements.",
      "Smooth onboarding, payroll coordination, and documentation.",
    ],
  },
];

export default function EmployerServicesPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-10 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
            For Employers
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Hiring support that matches your stage, not a template.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Resourcin plugs into your world — founder-led, HR-led, or
                investor-driven hiring — with a mix of search, embedded
                recruiters, and EOR guidance across Africa and global markets.
              </p>
            </div>

            <div className="mt-3 flex flex-col items-start gap-2 sm:items-end">
              <span className="rounded-full bg-[#172965] px-3 py-1 text-xs font-medium text-slate-50">
                Start with a 20-min brief call
              </span>
              <Link
                href="/request-talent"
                className="inline-flex items-center rounded-full border border-[#172965] bg-white px-4 py-2 text-xs font-semibold text-[#172965] shadow-sm hover:bg-[#172965] hover:text-white"
              >
                Request talent
                <span className="ml-1.5 text-sm" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Offerings */}
        <section className="grid gap-5 lg:grid-cols-2">
          {offerings.map((offering) => (
            <div
              key={offering.id}
              className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white/95 p-5 shadow-sm ring-1 ring-slate-100/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {offering.badge}
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-slate-900">
                    {offering.label}
                  </h2>
                </div>
              </div>

              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                {offering.description}
              </p>

              <div className="mt-4 grid gap-4 text-xs text-slate-600 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Best when…
                  </p>
                  <ul className="space-y-1.5">
                    {offering.scenarios.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Outcomes
                  </p>
                  <ul className="space-y-1.5">
                    {offering.outcomes.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[#172965]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
                <p className="text-slate-500">
                  Want to explore {offering.label.toLowerCase()}?
                </p>
                <Link
                  href={`/request-talent?service=${offering.id}`}
                  className="inline-flex items-center font-semibold text-[#172965] hover:text-[#0f1b45]"
                >
                  Share a brief
                  <span className="ml-1 text-sm" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* How we work strip */}
        <section className="mt-10 rounded-3xl bg-[#172965] px-6 py-6 text-slate-50 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64C247]">
              How we work
            </p>
            <h2 className="text-sm font-semibold sm:text-base">
              One brief, clear scope, then we go hunt.
            </h2>
            <p className="text-xs text-slate-200 sm:text-[13px]">
              We start with a short call, share a written scope (roles, markets,
              budget, timelines), then run a visible process with weekly
              updates, shortlists, and clear decision points.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-[11px] sm:mt-0 sm:w-64">
            <div className="flex items-center justify-between rounded-2xl bg-slate-900/40 px-3 py-2">
              <span className="text-slate-200">Time-to-shortlist</span>
              <span className="font-semibold text-[#64C247]">10–20 days</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-900/40 px-3 py-2">
              <span className="text-slate-200">Roles per project</span>
              <span className="font-semibold text-[#64C247]">3–10+ roles</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-900/40 px-3 py-2">
              <span className="text-slate-200">Engagement model</span>
              <span className="font-semibold text-[#64C247]">
                Retainer / success fee
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
