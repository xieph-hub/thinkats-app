// app/jobs/[jobIdOrSlug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Role details | Resourcin",
  description:
    "Detailed view of an open mandate managed by Resourcin and its clients.",
};

type PageProps = {
  params: { jobIdOrSlug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

type JobRow = {
  id: string;
  slug: string | null;
  title: string;
  department: string | null;
  location: string | null;
  location_type: string | null;
  employment_type: string | null;
  experience_level: string | null;
  work_mode: string | null;
  created_at: string;
  overview: string | null;
  about_client: string | null;
  responsibilities: string | null;
  requirements: string | null;
  benefits: string | null;
  short_description: string | null;
  tags: string[] | null;
  confidential: boolean | null;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

// ---------------------------------------------------------------------------
// Formatting helpers (aligned with /jobs + JobCard)
// ---------------------------------------------------------------------------

function humanizeToken(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(
      (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join(" ");
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full Time",
  "full-time": "Full Time",
  part_time: "Part Time",
  "part-time": "Part Time",
  contract: "Contract",
  temporary: "Temporary",
  internship: "Internship",
  consulting: "Consulting / Advisory",
  consultant: "Consulting / Advisory",
};

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  entry: "Entry level / Graduate",
  junior: "Junior (1–3 years)",
  mid: "Mid-level (3–7 years)",
  senior: "Senior (7–12 years)",
  lead_principal: "Lead / Principal",
  "lead-principal": "Lead / Principal",
  manager_head: "Manager / Head of",
  "manager-head": "Manager / Head of",
  director_vp: "Director / VP",
  "director-vp": "Director / VP",
  c_level_partner: "C-level / Partner",
  "c-level-partner": "C-level / Partner",
};

const WORK_MODE_LABELS: Record<string, string> = {
  onsite: "Onsite",
  "on-site": "Onsite",
  hybrid: "Hybrid",
  remote: "Remote",
  "remote-first": "Remote-first",
  field_based: "Field-based",
  "field-based": "Field-based",
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  single_country: "Single-country role",
  multi_country: "Multi-country / Regional",
  global: "Global remit",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  executive_leadership: "Executive Leadership (CEO, MD, Country Manager)",
  general_management: "General Management / Business Unit Head",
  strategy_corporate_dev: "Strategy & Corporate Development",
  project_program_management: "Project / Program Management",
  operations_management: "Operations Management",
  sales_business_development: "Sales & Business Development",
  account_management_cs: "Account Management & Customer Success",
  partnerships_alliances: "Partnerships & Alliances",
  revenue_operations: "Revenue Operations (RevOps)",
  pre_sales_solutions: "Pre-sales & Solutions Consulting",
  growth_marketing: "Growth / Performance Marketing",
  brand_marketing: "Brand Marketing & Communications",
  product_marketing: "Product Marketing",
  content_social_media: "Content & Social Media",
  pr_corporate_comms: "PR & Corporate Communications",
  product_management: "Product Management",
  product_ownership: "Product Owner / Business Analyst",
  ux_ui_design: "UX / UI Design",
  service_design: "Service Design",
  research_insights: "User Research & Insights",
  software_engineering: "Software Engineering / Development",
  data_science_ml: "Data Science & Machine Learning",
  data_analytics: "Data Analytics / BI",
  devops_platform: "DevOps / SRE / Platform Engineering",
  cloud_infrastructure: "Cloud & Infrastructure Engineering",
  it_support: "IT Support & Helpdesk",
  cybersecurity: "Cybersecurity",
  qa_testing: "QA & Test Engineering",
  people_hr: "People / HR Generalist",
  talent_acquisition: "Talent Acquisition / Recruitment",
  people_operations: "People Operations",
  learning_development: "Learning & Development / Talent Management",
  compensation_benefits: "Compensation & Benefits",
  finance_accounting: "Finance & Accounting",
  financial_planning_analysis: "Financial Planning & Analysis (FP&A)",
  audit_control: "Audit, Controls & Reporting",
  risk_compliance: "Risk & Compliance",
  legal_corporate_secretariat: "Legal & Corporate Secretariat",
  treasury_investments: "Treasury & Investments",
  business_operations: "Business / Process Operations",
  supply_chain_procurement: "Supply Chain & Procurement",
  logistics_fulfilment: "Logistics, Fulfilment & Fleet",
  manufacturing_production: "Manufacturing & Production",
  quality_assurance_ops: "Quality Assurance & Control (Operations)",
  real_estate_investments: "Real Estate Investments & Advisory",
  real_estate_development: "Real Estate Development / Projects",
  estate_agency_leasing: "Estate Agency, Sales & Leasing",
  property_facilities_management: "Property & Facilities Management",
  valuation_asset_management: "Valuation & Asset Management",
  customer_support: "Customer Support / Service",
  contact_centre_bpo: "Contact Centre / BPO Operations",
  service_delivery: "Service Delivery & Implementation",
  creative_direction: "Creative Direction & Brand Studio",
  graphic_motion_design: "Graphic & Motion Design",
  video_photo_content: "Video, Photography & Multimedia",
  copywriting_editing: "Copywriting & Editorial",
  clinical_medical: "Clinical & Medical Practice",
  nursing_allied_health: "Nursing & Allied Health",
  public_health: "Public Health & Health Programs",
  pharmaceutical_biotech: "Pharmaceutical & Biotech",
  social_impact_nonprofit: "Social Impact & Non-profit Programs",
  teaching_education: "Teaching & Education",
  corporate_training: "Corporate Training & Facilitation",
  academic_research: "Academic & Applied Research",
  edtech_product_ops: "EdTech Product & Operations",
  executive_assistant: "Executive Assistant & EA Support",
  office_admin: "Office Administration & Front Desk",
  general_support_staff: "General Support Staff",
  multi_disciplinary: "Multi-disciplinary / Hybrid Role",
  other_specify_in_summary: "Other – described in role summary",
};

function formatEmploymentType(value?: string | null) {
  if (!value) return "";
  return EMPLOYMENT_TYPE_LABELS[value] ?? humanizeToken(value);
}

function formatExperienceLevel(value?: string | null) {
  if (!value) return "";
  return EXPERIENCE_LEVEL_LABELS[value] ?? humanizeToken(value);
}

function formatWorkMode(value?: string | null) {
  if (!value) return "";
  return WORK_MODE_LABELS[value] ?? humanizeToken(value);
}

function formatLocationType(value?: string | null) {
  if (!value) return "";
  return LOCATION_TYPE_LABELS[value] ?? humanizeToken(value);
}

function formatDepartment(value?: string | null) {
  if (!value) return "";
  return DEPARTMENT_LABELS[value] ?? humanizeToken(value);
}

function formatPostedAt(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// UUID guard
function looksLikeUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value,
  );
}

// ---------------------------------------------------------------------------

export default async function JobDetailPage({ params, searchParams }: PageProps) {
  const { jobIdOrSlug } = params;
  const isUuid = looksLikeUuid(jobIdOrSlug);

  let query = supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      department,
      location,
      location_type,
      employment_type,
      experience_level,
      work_mode,
      created_at,
      overview,
      about_client,
      responsibilities,
      requirements,
      benefits,
      short_description,
      tags,
      confidential
    `,
    )
    .eq("visibility", "public")
    .eq("status", "open");

  if (isUuid) {
    query = query.eq("id", jobIdOrSlug);
  } else {
    query = query.eq("slug", jobIdOrSlug);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error loading job detail:", error);
  }

  if (!data) {
    notFound();
  }

  const job = data as JobRow;

  const postedLabel = formatPostedAt(job.created_at);
  const displayEmploymentType = formatEmploymentType(job.employment_type);
  const displayExperienceLevel = formatExperienceLevel(job.experience_level);
  const displayWorkMode = formatWorkMode(job.work_mode);
  const displayLocationType = formatLocationType(job.location_type);
  const displayDepartment = formatDepartment(job.department);

  const canonicalPath = job.slug
    ? `/jobs/${encodeURIComponent(job.slug)}`
    : `/jobs/${encodeURIComponent(job.id)}`;
  const jobUrl = `${BASE_URL}${canonicalPath}`;

  const shareText = encodeURIComponent(
    `${job.title}${job.location ? ` – ${job.location}` : ""} (via Resourcin)`,
  );
  const encodedUrl = encodeURIComponent(jobUrl);
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`;

  const tags = job.tags ?? [];

  // 🔹 Multi-tenant tracking: carry src through to /apply
  const rawSrcParam =
    typeof searchParams?.src === "string"
      ? searchParams.src
      : Array.isArray(searchParams?.src)
      ? searchParams.src[0]
      : undefined;

  const trackingSourceParam =
    rawSrcParam && rawSrcParam.trim().length > 0
      ? rawSrcParam.trim().toUpperCase()
      : undefined;

  const applyHref =
    trackingSourceParam != null
      ? `${canonicalPath}/apply?src=${encodeURIComponent(
          trackingSourceParam,
        )}`
      : `${canonicalPath}/apply`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top breadcrumb + title */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-[#172965]/4">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 hover:text-[#172965]"
            >
              ← All roles
            </Link>
            <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
            <span>Resourcin</span>
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#172965] sm:text-3xl">
                {job.title}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {job.confidential
                  ? "Confidential search · via Resourcin"
                  : "Resourcin · Executive search & recruitment"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                {job.location && (
                  <MetaPill
                    icon={<IconLocation />}
                    label={job.location}
                    tone="primary"
                  />
                )}
                {displayWorkMode && (
                  <MetaPill icon={<IconGlobe />} label={displayWorkMode} />
                )}
                {displayEmploymentType && (
                  <MetaPill
                    icon={<IconBriefcase />}
                    label={displayEmploymentType}
                  />
                )}
                {displayExperienceLevel && (
                  <MetaPill
                    icon={<IconClock />}
                    label={displayExperienceLevel}
                  />
                )}
                {postedLabel && (
                  <MetaPill
                    icon={<IconClock />}
                    label={`Posted ${postedLabel}`}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={applyHref}
                className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
              >
                Apply for this role
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 shadow-sm">
                <span className="hidden sm:inline">Share</span>
                <a
                  href={linkedInUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100"
                  aria-label="Share on LinkedIn"
                >
                  <LinkedInIcon />
                </a>
                <a
                  href={xUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100"
                  aria-label="Share on X"
                >
                  <XIcon />
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100"
                  aria-label="Share on WhatsApp"
                >
                  <WhatsAppIcon />
                </a>
              </div>
            </div>
          </div>

          {job.short_description && (
            <p className="mt-4 max-w-3xl text-sm text-slate-700">
              {job.short_description}
            </p>
          )}

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-[#64C247]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#306B34]"
                >
                  #{tag}
                </span>
              ))}
              {tags.length > 6 && (
                <span className="text-[10px] text-slate-500">
                  +{tags.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(260px,1fr)]">
          {/* Left: description */}
          <div className="space-y-8">
            {/* Overview / role summary */}
            {job.overview && (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-[#172965]">
                  Role overview
                </h2>
                <div className="prose prose-sm mt-3 max-w-none text-slate-700 prose-p:mb-2 prose-p:mt-0">
                  {job.overview.split("\n").map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </article>
            )}

            {/* About the client */}
            {job.about_client && (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-[#172965]">
                  About the organisation
                </h2>
                <div className="prose prose-sm mt-3 max-w-none text-slate-700 prose-p:mb-2 prose-p:mt-0">
                  {job.about_client.split("\n").map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </article>
            )}

            {/* Responsibilities */}
            {job.responsibilities && (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-[#172965]">
                  Key responsibilities
                </h2>
                <RichListBlock text={job.responsibilities} />
              </article>
            )}

            {/* Requirements */}
            {job.requirements && (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-[#172965]">
                  Experience & requirements
                </h2>
                <RichListBlock text={job.requirements} />
              </article>
            )}

            {/* Benefits */}
            {job.benefits && (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-[#172965]">
                  Compensation & benefits
                </h2>
                <RichListBlock text={job.benefits} />
              </article>
            )}
          </div>

          {/* Right: key facts / sticky card */}
          <aside className="space-y-4">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Role snapshot
                </h2>
                <dl className="mt-3 space-y-2 text-xs text-slate-700">
                  {job.location && (
                    <Row label="Location" value={job.location} />
                  )}
                  {displayWorkMode && (
                    <Row label="Work pattern" value={displayWorkMode} />
                  )}
                  {displayLocationType && (
                    <Row label="Remit" value={displayLocationType} />
                  )}
                  {displayEmploymentType && (
                    <Row
                      label="Employment type"
                      value={displayEmploymentType}
                    />
                  )}
                  {displayExperienceLevel && (
                    <Row label="Role level" value={displayExperienceLevel} />
                  )}
                  {displayDepartment && (
                    <Row label="Job family" value={displayDepartment} />
                  )}
                  {postedLabel && <Row label="Posted" value={postedLabel} />}
                </dl>

                <Link
                  href={applyHref}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-center text-xs font-semibold text-white hover:bg-[#0f1c48]"
                >
                  Apply now
                </Link>
                <p className="mt-2 text-[10px] text-slate-500">
                  We review each application carefully. If your profile is a
                  close match, we&apos;ll be in touch to discuss next steps.
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-[#64C247]/40 bg-[#64C247]/5 p-4 text-[11px] text-slate-700">
                <div className="text-[11px] font-semibold text-[#306B34]">
                  Referrals welcome
                </div>
                <p className="mt-1">
                  Know someone who might be a fit? Share this role with them or
                  send an introduction when you apply.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function MetaPill({
  icon,
  label,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  tone?: "default" | "primary";
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px]";
  const palette =
    tone === "primary"
      ? "border border-[#172965]/15 bg-[#172965]/5 text-[#172965]"
      : "border border-slate-200 bg-white/70 text-slate-700";
  return (
    <span className={`${base} ${palette}`}>
      <span className="text-slate-500" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="text-right text-[11px] font-medium text-slate-800">
        {value}
      </dd>
    </div>
  );
}

/**
 * Renders responsibilities/requirements/benefits as a clean list.
 * Accepts plain text with new lines or simple bullets.
 */
function RichListBlock({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const looksLikeBullets = lines.some(
    (l) =>
      l.startsWith("- ") ||
      l.startsWith("* ") ||
      l.startsWith("• ") ||
      /^[0-9]+\./.test(l),
  );

  if (!looksLikeBullets) {
    return (
      <div className="prose prose-sm mt-3 max-w-none text-slate-700 prose-p:mb-2 prose-p:mt-0">
        {lines.map((l, idx) => (
          <p key={idx}>{l}</p>
        ))}
      </div>
    );
  }

  const cleaned = lines.map((l) =>
    l.replace(/^(-|\*|•)\s+/, "").replace(/^[0-9]+\.\s+/, ""),
  );

  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
      {cleaned.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  );
}

// ---- ICONS (copied from JobCard so visuals match /jobs) -------------------

function IconLocation() {
  return (
    <svg
      className="h-3.5 w-3.5 text-red-500"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5c0 3.038 3.287 6.87 4.063 7.69a.6.6 0 0 0 .874 0C11.213 13.87 14.5 10.038 14.5 7A4.5 4.5 0 0 0 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="10" cy="7" r="1.6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg
      className="h-3.5 w-3.5 text-slate-600"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <circle cx="10" cy="10" r="6.2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M10 3.8c-1.5 1.7-2.3 3.9-2.3 6.2 0 2.3.8 4.5 2.3 6.2m0-12.4c1.5 1.7 2.3 3.9 2.3 6.2 0 2.3-.8 4.5-2.3 6.2M4.2 10h11.6"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg
      className="h-3.5 w-3.5 text-amber-700"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="3"
        y="6"
        width="14"
        height="9"
        rx="1.7"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M7.5 6V5.4A1.9 1.9 0 0 1 9.4 3.5h1.2a1.9 1.9 0 0 1 1.9 1.9V6"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M3.5 9.5h4m5 0h4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconClock() {
  return (
    <svg
      className="h-3.5 w-3.5 text-orange-500"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <circle cx="10" cy="10" r="6.2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M10 6.4v3.5l2 1.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-[#0A66C2]"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8.25h4.56V24H.22zM8.34 8.25h4.37v2.13h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.47 3.04 5.47 6.99V24h-4.56v-7.22c0-1.72-.03-3.93-2.4-3.93-2.4 0-2.77 1.87-2.77 3.8V24H8.34z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-black"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M18.5 2h-3.1L12 7.2 8.8 2H2l6.7 10.1L2.4 22h3.1L12 14.7 16 22h6.8l-7-10.6L21.6 2h-3.1L14 8.4z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-[#25D366]"
      viewBox="0 0 32 32"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M16.04 4C9.96 4 5 8.96 5 15.02c0 2.38.72 4.6 2.09 6.5L5 28l6.63-2.07c1.84 1 3.9 1.53 6.01 1.53h.01C22.1 27.46 27 22.5 27 16.44 27 10.38 22.12 4 16.04 4zm-.01 20.9c-1.8 0-3.56-.48-5.1-1.38l-.37-.22-3.93 1.23 1.28-3.84-.24-.39A8.7 8.7 0 0 1 7.3 15c0-4.84 3.93-8.78 8.77-8.78 4.77 0 8.66 3.94 8.66 8.78 0 4.83-3.9 8.9-8.66 8.9zm4.78-6.63c-.26-.13-1.53-.76-1.77-.84-.24-.09-.41-.13-.58.12-.17.26-.67.84-.82 1-.15.17-.3.19-.56.06-.26-.13-1.09-.4-2.08-1.28-.77-.69-1.29-1.54-1.44-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.39-.8-1.9-.21-.5-.42-.44-.58-.45l-.5-.01c-.17 0-.45.06-.69.32-.24.26-.9.88-.9 2.14 0 1.26.92 2.48 1.05 2.65.13.17 1.81 2.86 4.4 4.02.62.27 1.11.43 1.49.55.63.2 1.2.17 1.65.1.5-.08 1.53-.62 1.75-1.22.22-.6.22-1.11.15-1.22-.06-.11-.24-.17-.5-.3z" />
    </svg>
  );
}
