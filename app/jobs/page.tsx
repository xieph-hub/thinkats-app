// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Jobs | Resourcin",
  description:
    "Explore curated job opportunities with Resourcin. Product, Engineering, People, Sales and Operations roles across Africa and remote-friendly companies.",
};

type Job = {
  slug: string;
  title: string;
  company: string;
  location: string;
  workType: "Remote" | "Hybrid" | "On-site";
  type: "Full-time" | "Contract";
  department: string;
  seniority: "Junior" | "Mid-level" | "Senior" | "Lead";
  salaryRange?: string;
  postedAt: string;
  highlight?: string;
};

const jobs: Job[] = [
  {
    slug: "senior-product-manager-fintech",
    title: "Senior Product Manager – Fintech Platform",
    company: "Confidential Fintech (Africa)",
    location: "Lagos / Remote-friendly",
    workType: "Hybrid",
    type: "Full-time",
    department: "Product",
    seniority: "Senior",
    salaryRange: "$50,000 – $75,000 / year (gross, range-guidance)",
    postedAt: "Posted 3 days ago",
    highlight: "Own roadmap for core payments & lending experiences.",
  },
  {
    slug: "backend-engineer-payments",
    title: "Backend Engineer – Payments & Wallets",
    company: "Growth-stage Paytech",
    location: "Remote (Africa)",
    workType: "Remote",
    type: "Full-time",
    department: "Engineering",
    seniority: "Mid-level",
    salaryRange: "₦1.5m – ₦2.3m / month (gross, range-guidance)",
    postedAt: "Posted 1 week ago",
    highlight: "Node.js / TypeScript, distributed systems & high-volume APIs.",
  },
  {
    slug: "people-ops-lead-multi-country",
    title: "People Operations Lead – Multi-country",
    company: "Tech & Services Group",
    location: "Lagos (Hybrid)",
    workType: "Hybrid",
    type: "Full-time",
    department: "People & Operations",
    seniority: "Lead",
    salaryRange: "₦1.2m – ₦1.8m / month (gross, range-guidance)",
    postedAt: "Posted 2 weeks ago",
    highlight: "Own people ops, policies and reporting across multiple entities.",
  },
  {
    slug: "enterprise-sales-manager-b2b-saas",
    title: "Enterprise Sales Manager – B2B SaaS",
    company: "B2B SaaS/Infrastructure",
    location: "Lagos / Nairobi",
    workType: "On-site",
    type: "Full-time",
    department: "Sales & Growth",
    seniority: "Senior",
    salaryRange: "$40,000 – $60,000 / year (base) + commissions",
    postedAt: "Posted 2 weeks ago",
    highlight: "Pipeline ownership from prospecting to closing bank/telco/logistics logos.",
  },
  {
    slug: "senior-data-analyst-product-ops",
    title: "Senior Data Analyst – Product & Operations",
    company: "Digital Financial Services",
    location: "Hybrid – Lagos",
    workType: "Hybrid",
    type: "Full-time",
    department: "Data",
    seniority: "Senior",
    salaryRange: "₦900k – ₦1.5m / month (gross, range-guidance)",
    postedAt: "Posted 3 weeks ago",
    highlight: "Turn messy product & ops data into dashboards leaders actually use.",
  },
  {
    slug: "customer-success-lead-enterprise",
    title: "Customer Success Lead – Enterprise Accounts",
    company: "Vertical SaaS",
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
  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            <span className="h-2 w-2 rounded-full bg-[#64C247]" />
            For Candidates
          </div>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-[#172965] sm:text-4xl">
                Roles from teams that actually ship work.
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-600">
                Resourcin works with founders and people leaders who care about
                fit, context and growth. Browse open roles or join the talent
                network and we’ll plug you into relevant searches as they open.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 text-sm lg:items-end">
              <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  How we work with candidates
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-700">
                  No spam. No “just checking in” emails. Clear briefs, honest
                  feedback, and roles we’d consider ourselves.
                </p>
              </div>
              <Link
                href="/talent-network"
                className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-[#0f1c46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#172965]"
              >
                Join the talent network
                <span className="ml-2 text-[0.7rem]" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Summary bar */}
        <section className="mb-6">
          <div className="grid gap-3 text-xs sm:text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sample roles
              </p>
              <p className="mt-1 font-medium text-[#172965]">
                Product, Engineering, Sales, People & Ops.
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Markets
              </p>
              <p className="mt-1 text-slate-700">
                Nigeria, Kenya and remote-friendly African & global teams.
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Don&apos;t see a perfect fit?
              </p>
              <p className="mt-1 text-slate-700">
                Still join the talent network and we&apos;ll match you to future
                roles.
              </p>
            </div>
          </div>
        </section>

        {/* Jobs list */}
        <section aria-label="Open roles">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#172965]">
              Open & representative roles
            </h2>
            <p className="text-xs text-slate-500">
              These roles are representative of the kind of searches we run.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <article
                key={job.slug}
                className="flex h-full flex-col justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-[#172965]">
                        {job.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-slate-600">
                        {job.company}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[0.65rem] font-medium text-slate-600 ring-1 ring-slate-200">
                      {job.department}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.7rem] sm:text-xs text-slate-600">
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
                    <p className="mt-2 text-xs sm:text-sm text-slate-600">
                      <span className="font-medium text-slate-700">
                        Salary:
                      </span>{" "}
                      {job.salaryRange}
                    </p>
                  )}

                  {job.highlight && (
                    <p className="mt-2 text-xs sm:text-sm text-slate-700">
                      {job.highlight}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-[0.7rem] sm:text-xs text-slate-500">
                    {job.postedAt}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/talent-network?job=${encodeURIComponent(
                        job.slug
                      )}`}
                      className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-3 py-1.5 text-[0.7rem] sm:text-xs font-medium text-white shadow-sm hover:bg-[#0f1c46]"
                    >
                      View details & express interest
                      <span
                        className="ml-1 text-[0.65rem]"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-10 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#172965]">
                Not sure where you fit yet?
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Share your profile once via the talent network. When we see a
                search that matches your stack, we&apos;ll reach out with
                context, not just a job link.
              </p>
            </div>
            <Link
              href="/talent-network"
              className="inline-flex items-center justify-center rounded-lg bg-[#64C247] px-4 py-2 text-sm font-medium text-[#0b1c3d] shadow-sm hover:bg-[#4ea337]"
            >
              Join the talent network
              <span className="ml-2 text-xs" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
