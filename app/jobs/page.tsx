// app/jobs/page.tsx
import type { Metadata } from "next";
import type { ReactNode, SVGProps } from "react";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Jobs | Resourcin",
  description:
    "Curated roles across Product, Engineering, People, Sales and Operations. Browse open roles or share your profile once via the Resourcin talent network.",
};

// -----------------------------------------------------------------------------
// UTM constants for static CTAs
// -----------------------------------------------------------------------------

const TALENT_NETWORK_HERO_URL =
  "/talent-network?utm_source=resourcin_job_board&utm_medium=hero_cta&utm_campaign=talent_network";

const TALENT_NETWORK_BOTTOM_URL =
  "/talent-network?utm_source=resourcin_job_board&utm_medium=bottom_cta&utm_campaign=talent_network";

const EMPLOYER_CTA_URL =
  "/request-talent?utm_source=resourcin_job_board&utm_medium=employer_cta&utm_campaign=request_talent";

// -----------------------------------------------------------------------------
// White-label friendly job board config
// -----------------------------------------------------------------------------

const JOB_BOARD_CONFIG = {
  boardName: "Resourcin Talent Network",
  primaryColor: "#172965",
  accentColor: "#64C247",
  background: "#F1F5F9",
  employerCtaLabel: "Use this board for your roles",
  poweredByLabel: "Powered by Resourcin",
};

type Job = {
  slug: string;
  title: string;
  employerName: string;
  employerInitials: string;
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

// -----------------------------------------------------------------------------
// Icon components (with classic colors)
// -----------------------------------------------------------------------------

function LocationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-red-500 ${props.className ?? ""}`}
    >
      <path
        d="M12 2.75a6.25 6.25 0 0 0-6.25 6.25c0 4.39 4.76 9.19 5.96 10.37a.9.9 0 0 0 1.26 0c1.2-1.18 5.98-5.98 5.98-10.37A6.25 6.25 0 0 0 12 2.75Zm0 9.25a3 3 0 1 1 0-6.001 3 3 0 0 1 0 6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-amber-800 ${props.className ?? ""}`}
    >
      <path
        d="M9 4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6h3.25A1.75 1.75 0 0 1 20 7.75v9.5A1.75 1.75 0 0 1 18.25 19H5.75A1.75 1.75 0 0 1 4 17.25v-9.5A1.75 1.75 0 0 1 5.75 6H9V4.5Zm1.5.25v1.25h3V4.75h-3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-yellow-400 ${props.className ?? ""}`}
    >
      <path
        d="M12 3.25 13.4 7l3.6 1.4L13.4 9.8 12 13.5 10.6 9.8 7 8.4 10.6 7 12 3.25Zm6.5 7.25.75 2 2 0.75-2 .75-.75 2-.75-2-2-.75 2-.75.75-2Zm-13 4.5.9 2.4 2.35.9-2.35.9-.9 2.35-.9-2.35L3.25 19l2.25-.9.9-2.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CurrencyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-emerald-500 ${props.className ?? ""}`}
    >
      <path
        d="M11 4.75h2a.75.75 0 0 1 0 1.5h-1.25v2h.5a4.25 4.25 0 1 1 0 8.5H11a.75.75 0 0 1 0-1.5h1.25v-2h-.5a4.25 4.25 0 1 1 0-8.5Zm.75 4v6.5h1a2.75 2.75 0 0 0 0-5.5h-1Zm-1.5 0h-1a2.75 2.75 0 0 0 0 5.5h1V8.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-sky-500 ${props.className ?? ""}`}
    >
      <path
        d="M12 3.25a8.75 8.75 0 1 0 0 17.5 8.75 8.75 0 0 0 0-17.5Zm-.75 4.5a.75.75 0 0 1 1.5 0V12l2.22 2.22a.75.75 0 1 1-1.06 1.06l-2.5-2.5A.75.75 0 0 1 11.25 12V7.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-[#0A66C2] ${props.className ?? ""}`}
    >
      <path
        d="M5.16 4.5a1.91 1.91 0 1 1 0 3.82 1.91 1.91 0 0 1 0-3.82ZM4 9h2.32v10.5H4V9Zm5.18 0H11.4v1.46h.03c.31-.59 1.1-1.21 2.27-1.21 2.43 0 2.88 1.6 2.88 3.68v6.57h-2.32v-5.83c0-1.39-.03-3.18-1.94-3.18-1.94 0-2.24 1.51-2.24 3.07v5.94H9.18V9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-slate-900 ${props.className ?? ""}`}
    >
      <path
        d="M5.25 4h3.02l3.02 4.33L14.83 4h3.92l-5 6.72L19 20h-3.02l-3.26-4.71L9 20H5.08l5.08-6.9L5.25 4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={`h-3.5 w-3.5 text-[#25D366] ${props.className ?? ""}`}
    >
      <path
        d="M12.04 3.25A8.76 8.76 0 0 0 3.25 12a8.7 8.7 0 0 0 1.26 4.52L3 21l4.61-1.47A8.76 8.76 0 1 0 12.04 3.25Zm0 1.5a7.25 7.25 0 0 1 6.16 11.11l-.18.28a7.24 7.24 0 0 1-9.19 2.37l-.2-.1-2.7.86.9-2.61-.13-.21A7.24 7.24 0 0 1 12.04 4.75Zm-3.1 3.3c-.17 0-.44.05-.68.34-.24.3-.9.88-.9 2.13 0 1.24.92 2.45 1.05 2.62.13.17 1.8 2.87 4.46 3.9 2.2.87 2.65.79 3.13.74.48-.04 1.54-.63 1.76-1.23.22-.6.22-1.12.16-1.23-.06-.11-.24-.18-.5-.32-.26-.13-1.54-.76-1.78-.84-.24-.09-.41-.13-.6.13-.19.25-.69.84-.85 1.02-.16.18-.32.2-.59.07-.26-.13-1.11-.41-2.11-1.31-.78-.7-1.3-1.56-1.46-1.82-.16-.25-.02-.4.12-.54.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37 0-.51-.06-.13-.53-1.35-.73-1.84-.18-.45-.37-.46-.54-.47Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Simple pill component for icon + label
function InfoPill({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[0.7rem] font-medium text-slate-600 ring-1 ring-slate-200">
      <span className="flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </span>
  );
}

// -----------------------------------------------------------------------------

export default function JobsPage() {
  const brand = JOB_BOARD_CONFIG;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: brand.background }}
    >
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Board header */}
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
                  href={TALENT_NETWORK_HERO_URL}
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

        {/* Summary row */}
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

        {/* Job cards */}
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
            {jobs.map((job) => {
              // Per-job UTM logic
              const jobSlug = encodeURIComponent(job.slug);
              const utmBase = `utm_source=resourcin_job_board&utm_campaign=job_${jobSlug}`;

              // Candidate CTA from card
              const ctaHref = `/talent-network?job=${jobSlug}&${utmBase}&utm_medium=cta`;

              // Social landing URLs (what people land on when they click shared links)
              const linkedInLandingUrl = `${SITE_URL}/talent-network?job=${jobSlug}&${utmBase}&utm_medium=social&utm_content=linkedin`;
              const xLandingUrl = `${SITE_URL}/talent-network?job=${jobSlug}&${utmBase}&utm_medium=social&utm_content=x`;
              const whatsAppLandingUrl = `${SITE_URL}/talent-network?job=${jobSlug}&${utmBase}&utm_medium=social&utm_content=whatsapp`;

              const encodedLinkedInLanding = encodeURIComponent(linkedInLandingUrl);
              const encodedXLanding = encodeURIComponent(xLandingUrl);

              const shareText = encodeURIComponent(
                `${job.title} – via Resourcin`
              );

              const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLinkedInLanding}`;
              const xShareUrl = `https://twitter.com/intent/tweet?url=${encodedXLanding}&text=${shareText}`;
              const whatsAppMessage = encodeURIComponent(
                `${job.title} – via Resourcin\n${whatsAppLandingUrl}`
              );
              const whatsAppShareUrl = `https://wa.me/?text=${whatsAppMessage}`;

              return (
                <article
                  key={job.slug}
                  className="relative overflow-hidden rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200/80 transition transform hover:-translate-y-0.5 hover:shadow-md hover:ring-slate-300 sm:px-5"
                >
                  {/* Accent bar */}
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-1"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg,#64C247,#172965)",
                    }}
                  />

                  <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left section */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        {/* Employer avatar (future: replace with logo in white-label mode) */}
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-semibold text-white shadow-sm sm:h-11 sm:w-11"
                          style={{ backgroundColor: brand.primaryColor }}
                        >
                          {job.employerInitials}
                        </div>

                        <div className="space-y-1.5">
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

                      {/* Icon pills */}
                      <div className="flex flex-wrap items-center gap-2 text-[0.7rem] sm:text-xs">
                        <InfoPill
                          icon={<LocationIcon />}
                          label={job.location}
                        />
                        <InfoPill
                          icon={<BriefcaseIcon />}
                          label={`${job.workType} • ${job.type}`}
                        />
                        <InfoPill
                          icon={<SparklesIcon />}
                          label={`${job.seniority} level`}
                        />
                        {job.salaryRange && (
                          <InfoPill
                            icon={<CurrencyIcon />}
                            label={job.salaryRange}
                          />
                        )}
                      </div>

                      {/* Short highlight */}
                      {job.highlight && (
                        <p className="mt-1.5 text-xs text-slate-700 sm:text-sm">
                          {job.highlight}
                        </p>
                      )}

                      {/* Social sharing */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.7rem] text-slate-500 sm:text-xs">
                        <span className="font-medium text-slate-600">
                          Share:
                        </span>
                        <a
                          href={linkedInShareUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200 hover:bg-slate-100"
                        >
                          <LinkedInIcon />
                          <span>LinkedIn</span>
                        </a>
                        <a
                          href={xShareUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200 hover:bg-slate-100"
                        >
                          <XIcon />
                          <span>X</span>
                        </a>
                        <a
                          href={whatsAppShareUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200 hover:bg-slate-100"
                        >
                          <WhatsAppIcon />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* Right section */}
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <div className="inline-flex items-center gap-1.5 text-[0.7rem] text-slate-500 sm:text-xs">
                        <ClockIcon />
                        <span>{job.postedAt}</span>
                      </div>

                      <Link
                        href={ctaHref}
                        className="inline-flex items-center justify-center rounded-lg px-3.5 py-1.5 text-[0.7rem] font-medium text-white shadow-sm sm:text-xs"
                        style={{ backgroundColor: brand.primaryColor }}
                      >
                        View details & express interest
                        <span
                          className="ml-1.5 text-[0.65rem]"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
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
              href={TALENT_NETWORK_BOTTOM_URL}
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

        {/* For employers – SaaS hint */}
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
            href={EMPLOYER_CTA_URL}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 sm:text-sm"
          >
            {JOB_BOARD_CONFIG.employerCtaLabel}
            <span className="ml-1.5 text-[0.7rem]" aria-hidden="true">
              →
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}
