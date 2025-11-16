// app/for-employers/case-studies/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Case Studies | Resourcin",
  description:
    "Proof of work from searches, embedded recruiting, and cross-border hiring projects led by Resourcin.",
};

type CaseStudy = {
  slug: string;
  title: string;
  clientType: string;
  region: string;
  headlineResult: string;
  summary: string;
  tags: string[];
};

const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "fintech-sales-and-ops-pod",
    title: "Building a sales + ops pod for an African fintech",
    clientType: "VC-backed fintech (Series A)",
    region: "Nigeria + remote Africa",
    headlineResult: "7 hires in 90 days across sales, ops, and customer success.",
    summary:
      "Founder-led team needed to professionalise go-to-market without losing speed. We scoped roles, built scorecards, and ran a structured search across competing fintechs and adjacent sectors.",
    tags: ["Talent Acquisition", "Fintech", "Africa"],
  },
  {
    slug: "exec-search-country-manager",
    title: "Country Manager search for travel-tech expansion",
    clientType: "Travel / transport tech",
    region: "Kenya",
    headlineResult:
      "Shortlist of 5 P&L leaders; role closed with a candidate from adjacent mobility sector.",
    summary:
      "The company needed a GM-level leader with both operator relationships and bank/telco partnership experience. We mapped airlines, bus operators, OTAs, and fintech ecosystems to source candidates.",
    tags: ["Executive Search", "Country Manager", "East Africa"],
  },
  {
    slug: "embedded-rpo-growth-stage",
    title: "Embedded recruiter to stabilise growth-stage hiring",
    clientType: "B2B SaaS (growth stage)",
    region: "Remote / multi-country",
    headlineResult:
      "Cleaned up ATS, standardised interview loops, and filled priority roles in product, sales, and CS.",
    summary:
      "Internal People team was overstretched. We embedded a recruiter under their brand, running intakes, sourcing, and weekly hiring standups while cleaning up data and reporting.",
    tags: ["RPO", "Embedded", "SaaS"],
  },
];

export default function CaseStudiesPage() {
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
                Case studies and proof of work.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                A snapshot of how Resourcin supports different types of
                companies – founders, HR leaders, and investors – across hiring
                projects and geographies.
              </p>
            </div>

            <div className="mt-3 flex flex-col items-start gap-2 sm:items-end">
              <span className="rounded-full bg-slate-900/5 px-3 py-1 text-[11px] font-medium text-slate-600">
                Anonymous but specific enough to be useful.
              </span>
              <Link
                href="/request-talent"
                className="inline-flex items-center rounded-full border border-[#172965] bg-[#172965] px-4 py-2 text-xs font-semibold text-slate-50 shadow-sm hover:bg-[#0f1b45]"
              >
                Discuss a similar mandate
                <span className="ml-1.5 text-sm" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Grid of case studies */}
        <section className="grid gap-5 lg:grid-cols-3">
          {CASE_STUDIES.map((cs) => (
            <article
              key={cs.slug}
              className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white/95 p-5 shadow-sm ring-1 ring-slate-100/60"
            >
              <div className="mb-3 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="rounded-full bg-slate-50 px-2.5 py-0.5 font-medium">
                  {cs.clientType}
                </span>
                <span className="text-slate-400">{cs.region}</span>
              </div>

              <h2 className="text-sm font-semibold text-slate-900">
                {cs.title}
              </h2>
              <p className="mt-2 text-[13px] font-medium text-[#172965]">
                {cs.headlineResult}
              </p>

              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-600">
                {cs.summary}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
                {cs.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-50 px-2 py-0.5 text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <p>Want a deeper breakdown or metrics?</p>
                <Link
                  href="/contact"
                  className="inline-flex items-center font-semibold text-[#172965] hover:text-[#0f1b45]"
                >
                  Contact us to share more detail
                  <span className="ml-1 text-sm" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
