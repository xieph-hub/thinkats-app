// app/jobs/[jobIdOrSlug]/apply/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import JobApplyForm from "../JobApplyForm";

export const dynamic = "force-dynamic";

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

// Helpers (same as in detail page)
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

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value,
  );
}

export default async function JobApplyPage({
  params,
  searchParams,
}: PageProps) {
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
    console.error("Error loading job in apply page:", error);
  }

  if (!data) {
    notFound();
  }

  const job = data as JobRow;

  const canonicalPath = job.slug
    ? `/jobs/${encodeURIComponent(job.slug)}`
    : `/jobs/${encodeURIComponent(job.id)}`;

  const postedLabel = formatPostedAt(job.created_at);
  const displayEmploymentType = formatEmploymentType(job.employment_type);
  const displayExperienceLevel = formatExperienceLevel(job.experience_level);
  const displayWorkMode = formatWorkMode(job.work_mode);
  const displayLocationType = formatLocationType(job.location_type);
  const displayDepartment = formatDepartment(job.department);

  // 🔹 Internal tracking source for multi-tenant analytics
  const rawSrcParam =
    typeof searchParams?.src === "string"
      ? searchParams.src
      : Array.isArray(searchParams?.src)
      ? searchParams.src[0]
      : undefined;

  const trackingSource =
    rawSrcParam && rawSrcParam.trim().length > 0
      ? rawSrcParam.trim().toUpperCase()
      : "CAREERS_SITE";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header / breadcrumbs */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-[#172965]/4">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 hover:text-[#172965]"
            >
              ← All roles
            </Link>
            <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
            <Link
              href={canonicalPath}
              className="inline-flex items-center gap-1 hover:text-[#172965]"
            >
              Back to role page
            </Link>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#172965] sm:text-3xl">
            Apply: {job.title}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-700">
            {job.confidential
              ? "Confidential search · via Resourcin"
              : "Resourcin · Executive search & recruitment"}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
            {job.location && (
              <MetaPill icon="📍" label={job.location} tone="primary" />
            )}
            {displayWorkMode && (
              <MetaPill icon="🌐" label={displayWorkMode} />
            )}
            {displayEmploymentType && (
              <MetaPill icon="💼" label={displayEmploymentType} />
            )}
            {displayExperienceLevel && (
              <MetaPill icon="🎯" label={displayExperienceLevel} />
            )}
            {postedLabel && (
              <MetaPill icon="🕒" label={`Posted ${postedLabel}`} />
            )}
          </div>

          {job.short_description && (
            <p className="mt-4 max-w-3xl text-sm text-slate-700">
              {job.short_description}
            </p>
          )}
        </div>
      </section>

      {/* Main content: form + side card */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(260px,1fr)]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#172965]">
                  Submit your application
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Share a recent CV and a few details. We&apos;ll review and get
                  back to you if there&apos;s a close match.
                </p>
              </div>
              <div className="hidden text-[11px] text-slate-500 sm:block">
                Powered by{" "}
                <span className="font-semibold text-[#172965]">
                  ThinkATS
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <JobApplyForm jobId={job.id} source={trackingSource} />
            </div>
          </article>

          <aside className="space-y-4 lg:pt-2">
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
                href={canonicalPath}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-[#172965] hover:bg-slate-50"
              >
                Back to full description
              </Link>
              <p className="mt-2 text-[10px] text-slate-500">
                You can review the full role summary, responsibilities and
                requirements before or after submitting your application.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-[#64C247]/40 bg-[#64C247]/5 p-4 text-[11px] text-slate-700">
              <div className="text-[11px] font-semibold text-[#306B34]">
                Referrals welcome
              </div>
              <p className="mt-1">
                Know someone who might be a fit? Share the role link or mention
                referrals in your note when applying.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function MetaPill({
  icon,
  label,
  tone = "default",
}: {
  icon: string;
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
      <span aria-hidden="true">{icon}</span>
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
