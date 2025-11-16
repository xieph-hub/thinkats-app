// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Jobs | Resourcin",
  description:
    "Curated roles across Product, Engineering, People, Sales and Operations. Browse open roles or share your profile once via the Resourcin talent network.",
};

// -----------------------------------------------------------------------------
// White-label friendly job board config
// Later, this can be made tenant-specific (per employer) for the SaaS product.
// -----------------------------------------------------------------------------

const JOB_BOARD_CONFIG = {
  boardName: "Resourcin Talent Network",
  // Current brand (Resourcin); in a white-label instance this becomes the client’s brand.
  primaryColor: "#172965",
  accentColor: "#64C247",
  background: "#F1F5F9",
  // Where employers go if they want their own board / to post roles.
  employerCtaHref: "/request-talent",
  employerCtaLabel: "Use this board for your roles",
  poweredByLabel: "Powered by Resourcin",
};

type Job = {
  slug: string;
  title: string;
  employerName: string;
  employerInitials: string; // for logo circle; in SaaS you’d swap for a real logo
  location: string;
  workType: "Remote" | "Hybrid" | "On-site";
  type: "Full-time" | "Contract";
  department: string;
  seniority: "Junior" | "Mid-level" | "Senior" | "Lead";
  salaryRange?: string;
  postedAt: string;
  highlight?: string;
};

// For now these are representative searches.
// In the SaaS version, this becomes a DB/tenant-specific feed.
const jobs: Job[] = [
  {
    slug: "senior-product-manager-fintech",
    title: "Senior Product Manager – Fintech Platform",
    employerName: "Confidential Fintech (Africa)",
    employerInitials: "CF",
    location: "Lagos / Remote-friendly",
    workType: "Hybrid",
    type: "Full-time",
    department: "Product",
    seniority: "Senior",
    salaryRange: "$50,000 – $75,000 / year (guidance)",
    postedAt: "Posted 3 days ago",
    highlight: "Own roadmap for core payments & lending experiences.",
  },
  {
    slug: "backend-engineer-payments",
    title: "Backend Engineer – Payments & Wallets",
    employerName: "Growth-stage Paytech",
    employerInitials: "GP",
    location: "Remote (Africa)",
    workType: "Remote",
    type: "Full-time",
    department: "Engineering",
    seniority: "Mid-level",
    salaryRange: "₦1.5m – ₦2.3m / month (guidance)",
    postedAt: "Posted 1 week ago",
    highlight: "Node.js / TypeScript, high-volume APIs, distributed systems.",
  },
  {
    slug: "people-ops-lead-multi-country",
    title: "People Operations Lead – Multi-country",
    employerName: "Tech & Services Group",
    employerInitials: "TS",
    location: "Lagos (Hybrid)",
    workType: "Hybrid",
    type: "Full-time",
    department: "People & Operations",
    seniority: "Lead",
    salaryRange: "₦1.2m – ₦1.8m / month (guidance)",
    postedAt: "Posted 2 weeks ago",
    highlight:
      "Own people ops, policies and reporting across multiple subsidiaries.",
  },
  {
    slug: "enterprise-sales-manager-b2b-saas",
    title: "Enterprise Sales Manager – B2B SaaS",
    employerName: "B2B SaaS / Infrastructure",
    employerInitials: "SI",
    location: "Lagos / Nairobi",
    workType: "On-site",
    type: "Full-time",
    department: "Sales & Growth",
    seniority: "Senior",
    salaryRange: "$40,000 – $60,000 / year (base) + commissions",
    postedAt: "Posted 2 weeks ago",
    highlight:
      "Own pipeline from prospecting to closing bank / telco / logistics logos.",
  },
  {
    slug: "senior-data-analyst-product-ops",
    title: "Senior Data Analyst – Product & Operations",
    employerName: "Digital Financial Services",
    employerInitials: "DF",
    location: "Hybrid – Lagos",
    workType: "Hybrid",
    type: "Full-time",
    department: "Data",
    seniority: "Senior",
    salaryRange: "₦900k – ₦1.5m / month (guidance)",
    postedAt: "Posted 3 weeks ago",
    highlight:
      "Turn product & ops data into dashboards leaders actually use to decide.",
  },
  {
    slug: "customer-success-lead-enterprise",
    title: "Customer Success Lead – Enterprise Accounts",
    employerName: "Vertical SaaS",
    employerInitials: "VS",
    location: "Remote / Hybrid",
    workType: "Remote",
    type: "Full-time",
    department: "Customer Success",
    seniority: "Lead",
    salaryRange: "Competitive, plus performance bonus",
    postedAt: "Posted 1 month ago",
    highlight: "Own retention and expansion for a portfolio of enterprise clients.",
  },
];

export default function JobsPage() {
  const brand = JOB_BOARD_CONFIG;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: brand.background }}
    >
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Board header – can be swapped per tenant in SaaS */}
        <section className="mb-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: brand.accentColor }}
              />
              For Candidates
            </div>

            <div className="flex items-center gap-2 text-[0.7rem] text-slate-500 sm:text-xs">
              <span className="hidden sm:inline">Job board:</span>
              <span className="font-medium text-slate-700">
                {brand.boardName}
              </span>
              <span className="text-slate-400">·</span>
              <span>{brand.poweredByLabel}</span>
            </div>
          </div>

          <div
            className="rounded-2xl px-5 py-6 text-white shadow-sm sm:px-7 sm:py-8"
            style={{
              backgroundImage:
                "linear-gradient(120deg, #172965, #172965 55%, #203b99)",
            }}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Roles from teams that actually ship work.
                </h1>
                <p className="mt-3 text-sm text-slate-100/90 sm:text-base">
                  This board hosts searches across product, engineering, data,
                  people, sales and operations. In a white-label setup, the same
                  layout becomes a branded careers page for a single employer.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 text-xs lg:items-end">
                <div className="rounded-xl bg-white/10 px-4 py-3 text-slate-50 ring-1 ring-white/15">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-100">
                    How we work with candidates
                  </p>
                  <p className="mt-1 text-[0.75rem]">
                    No spam. Clear briefs, honest feedback, and roles that make
                    sense for your experience, not just your keywords.
                  </p>
                </div>
                <Link
                  href="/talent-network"
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold text-[#0b1c3d] shadow-sm hover:brightness-105"
                  style={{ backgroundColor: brand.accentColor }}
                >
                  Join the talent network
                  <span className="ml-2 text-[0.7rem]" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* High-level summary – keeps it generic for SaaS */}
        <section className="mb-6">
          <div className="grid gap-3 text-xs sm:grid-cols-3 sm:text-sm">
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                Functions
              </p>
              <p className="mt-1 text-slate-700">
                Product, Engineering, Data, People, Ops, Sales & Customer Success.
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                Markets
              </p>
              <p className="mt-1 text-slate-700">
                Nigeria, Kenya and remote-friendly African & global teams.
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                Don&apos;t see your exact role?
              </p>
              <p className="mt-1 text-slate-700">
                Share your profile once. We match you to live and upcoming briefs.
              </p>
            </div>
          </div>
        </section>

        {/* Job list – designed like a reusable “board” component */}
        <section aria-label="Open roles" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-[#172965] sm:text-lg">
              Representative searches & open roles
            </h2>
            <p className="text-[0.7rem] text-slate-500 sm:text-xs">
              Titles may be anonymised; full details are shared at screening.
            </p>
          </div>

          <div className="space-y-3">
            {jobs.map((job) => (
              <article
                key={job.slug}
                className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200 sm:px-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left section – employer + role */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      {/* Employer avatar – in white-label mode this can become the tenant logo */}
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold text-white sm:h-10 sm:w-10"
                        style={{ backgroundColor: brand.primaryColor }}
                      >
                        {job.employerInitials}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-[#172965] sm:text-base">
                            {job.title}
                          </h3>
                          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[0.65rem] font-medium text-slate-600 ring-1 ring-slate-200">
                            {job.department}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 sm:text-sm">
                          {job.employerName}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.7rem] text-slate-600 sm:text-xs">
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                        {job.location}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                        {job.workType} • {job.type}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                        {job.seniority} level
                      </span>
                    </div>

                    {job.salaryRange && (
                      <p className="mt-2 text-xs text-slate-600 sm:text-sm">
                        <span className="font-medium text-slate-700">
                          Compensation (guidance):
                        </span>{" "}
                        {job.salaryRange}
                      </p>
                    )}

                    {job.highlight && (
                      <p className="mt-2 text-xs text-slate-700 sm:text-sm">
                        {job.highlight}
                      </p>
                    )}
                  </div>

                  {/* Right section – time & CTA */}
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <p className="text-[0.7rem] text-slate-500 sm:text-xs">
                      {job.postedAt}
                    </p>
                    <Link
                      href={`/talent-network?job=${encodeURIComponent(
                        job.slug
                      )}`}
                      className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-[0.7rem] font-medium text-white shadow-sm sm:text-xs"
                      style={{ backgroundColor: brand.primaryColor }}
                    >
                      View details & express interest
                      <span className="ml-1 text-[0.65rem]" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Bottom candidate CTA */}
        <section className="mt-10 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#172965]">
                Not sure which role fits yet?
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Use the talent network once. When we run a search that matches
                your profile, we reach out with context and a clear brief.
              </p>
            </div>
            <Link
              href="/talent-network"
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-[#0b1c3d] shadow-sm hover:brightness-105"
              style={{ backgroundColor: brand.accentColor }}
            >
              Join the talent network
              <span className="ml-2 text-xs" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </section>

        {/* For employers – light SaaS hint */}
        <section className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:px-6 sm:text-sm">
          <div>
            <p className="font-semibold text-slate-700">
              For employers & talent teams
            </p>
            <p className="mt-1 max-w-xl">
              Use this board to run searches with Resourcin, or white-label the
              experience as your own careers page — with self-serve posting for
              busy hiring managers.
            </p>
          </div>
          <Link
            href={brand.employerCtaHref}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 sm:text-sm"
          >
            {brand.employerCtaLabel}
            <span className="ml-1.5 text-[0.7rem]" aria-hidden="true">
              →
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}
