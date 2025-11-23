// app/jobs/[jobIdOrSlug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  MapPin,
  Briefcase,
  Clock,
  Building2,
  Tag as TagIcon,
} from "lucide-react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type WorkModeValue = "remote" | "hybrid" | "onsite" | "flexible";

type PageProps = {
  params: { jobIdOrSlug: string };
  searchParams?: { applied?: string };
};

type ClientCompany = {
  name: string | null;
  logo_url: string | null;
  slug: string | null;
};

type JobRow = {
  id: string;
  tenant_id: string;
  slug: string | null;
  title: string;
  short_description: string | null;
  location: string | null;
  location_type: string | null;
  employment_type: string | null;
  seniority: string | null;
  experience_level: string | null;
  department: string | null;
  description: string | null;
  status: string | null;
  visibility: string | null;
  work_mode: WorkModeValue | null;
  tags: string[] | null;
  required_skills: string[] | null;
  years_experience_min: number | null;
  years_experience_max: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_visible: boolean | null;
  education_required: string | null;
  education_field: string | null;
  internal_only: boolean | null;
  confidential: boolean | null;
  created_at: string | null;
  client_company?: ClientCompany | null;
};

type WorkModeConfig = {
  label: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// simple UUID pattern: 8-4-4-4-12 hex segments
function looksLikeUuid(value: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

function workModeFromValue(value: WorkModeValue | null): WorkModeConfig | null {
  if (!value) return null;

  switch (value) {
    case "remote":
      return {
        label: "Remote",
        bgClass: "bg-emerald-50",
        textClass: "text-emerald-700",
        dotClass: "bg-emerald-500",
      };
    case "hybrid":
      return {
        label: "Hybrid",
        bgClass: "bg-indigo-50",
        textClass: "text-indigo-700",
        dotClass: "bg-indigo-500",
      };
    case "onsite":
      return {
        label: "On-site",
        bgClass: "bg-orange-50",
        textClass: "text-orange-700",
        dotClass: "bg-orange-500",
      };
    case "flexible":
      return {
        label: "Flexible",
        bgClass: "bg-sky-50",
        textClass: "text-sky-700",
        dotClass: "bg-sky-500",
      };
    default:
      return null;
  }
}

function workModeFromText(
  employmentType: string | null,
  location: string | null
): WorkModeConfig | null {
  const source = `${employmentType || ""} ${location || ""}`.toLowerCase();

  if (source.includes("remote")) {
    return workModeFromValue("remote");
  }
  if (source.includes("hybrid")) {
    return workModeFromValue("hybrid");
  }
  if (
    source.includes("onsite") ||
    source.includes("on-site") ||
    source.includes("on site")
  ) {
    return workModeFromValue("onsite");
  }

  return null;
}

function getWorkModeConfig(job: JobRow): WorkModeConfig | null {
  return (
    workModeFromValue(job.work_mode) ||
    workModeFromText(job.employment_type, job.location)
  );
}

function inferCountryFromLocation(location: string | null): string | null {
  if (!location) return null;
  const parts = location.split(",").map((p) => p.trim());
  if (parts.length === 0) return null;
  return parts[parts.length - 1] || null;
}

function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string | null
): string | null {
  if (!min && !max) return null;

  const symbol =
    currency === "USD"
      ? "$"
      : currency === "GBP"
      ? "£"
      : currency === "EUR"
      ? "€"
      : "₦"; // default NGN

  const fmt = (v: number | null) =>
    v != null ? v.toLocaleString(undefined) : null;

  const minStr = fmt(min);
  const maxStr = fmt(max);

  if (minStr && maxStr) return `${symbol}${minStr} - ${symbol}${maxStr} per year`;
  if (minStr) return `From ${symbol}${minStr} per year`;
  if (maxStr) return `Up to ${symbol}${maxStr} per year`;

  return null;
}

export default async function JobDetailPage({
  params,
  searchParams,
}: PageProps) {
  const rawParam = params.jobIdOrSlug;

  if (!rawParam || rawParam === "undefined") {
    console.error("JobDetailPage: invalid param", rawParam);
    notFound();
  }

  const slugOrId = decodeURIComponent(rawParam);

  const baseSelect = `
    id,
    tenant_id,
    slug,
    title,
    short_description,
    location,
    location_type,
    employment_type,
    seniority,
    experience_level,
    department,
    description,
    status,
    visibility,
    work_mode,
    tags,
    required_skills,
    years_experience_min,
    years_experience_max,
    salary_min,
    salary_max,
    salary_currency,
    salary_visible,
    education_required,
    education_field,
    internal_only,
    confidential,
    created_at,
    client_company:client_companies (
      name,
      logo_url,
      slug
    )
  `;

  let job: JobRow | null = null;

  // 1) Try by slug
  const {
    data: slugData,
    error: slugError,
  } = await supabaseAdmin
    .from("jobs")
    .select(baseSelect)
    .eq("slug", slugOrId)
    .limit(1);

  if (slugError) {
    console.error("JobDetailPage: error loading job by slug", {
      slugOrId,
      error: slugError,
    });
  } else if (slugData && slugData.length > 0) {
    job = slugData[0] as JobRow;
  }

  // 2) If not found and looks like UUID, try by id
  if (!job && looksLikeUuid(slugOrId)) {
    const {
      data: idData,
      error: idError,
    } = await supabaseAdmin
      .from("jobs")
      .select(baseSelect)
      .eq("id", slugOrId)
      .limit(1);

    if (idError) {
      console.error("JobDetailPage: error loading job by id", {
        slugOrId,
        error: idError,
      });
    } else if (idData && idData.length > 0) {
      job = idData[0] as JobRow;
    }
  }

  if (!job) {
    console.error("JobDetailPage: no job found for param", slugOrId);
    notFound();
  }

  const appliedFlag = searchParams?.applied;
  const client = job.client_company ?? null;
  const workMode = getWorkModeConfig(job);
  const jobCountry = inferCountryFromLocation(job.location);
  const isRemoteJob =
    job.work_mode === "remote" ||
    job.location_type === "remote" ||
    (job.location || "").toLowerCase().includes("remote");

  const showGitHubField =
    (job.department || "").toLowerCase().includes("engineer") ||
    (job.required_skills || []).some((s) =>
      s.toLowerCase().match(/(javascript|typescript|python|java|go|devops|backend|frontend|fullstack|react|node)/)
    );

  const salaryDisplay =
    job.salary_visible && job.salary_currency
      ? formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency)
      : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/jobs"
        className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
      >
        ← Back to all jobs
      </Link>

      {appliedFlag === "1" && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Thank you. Your application has been received.
        </div>
      )}

      {appliedFlag === "0" && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          We couldn&apos;t submit your application. Please try again or email
          your CV directly.
        </div>
      )}

      {/* Header */}
      <header className="mt-6 space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          {job.title}
        </h1>

        {job.short_description && (
          <p className="text-sm text-slate-700">
            {job.short_description}
          </p>
        )}

        {/* Hiring company */}
        {client && (client.name || client.logo_url) && (
          <div className="flex items-center gap-2">
            {client.logo_url && (
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                {/* img to avoid Next/Image config issues */}
                <img
                  src={client.logo_url}
                  alt={client.name || "Client logo"}
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span className="uppercase tracking-[0.14em] text-slate-400">
                Hiring company
              </span>
              {client.name && (
                <span className="ml-1 font-medium text-slate-800 normal-case tracking-normal">
                  {job.confidential ? "Confidential company" : client.name}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-red-400" />
            {job.location || "Location flexible"}
          </span>
          {job.employment_type && (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-medium text-slate-800">
                {job.employment_type}
              </span>
            </span>
          )}
          {job.experience_level && (
            <span className="inline-flex items-center gap-1 uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {job.experience_level}
            </span>
          )}
          {workMode && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-black/5 ${workMode.bgClass} ${workMode.textClass}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${workMode.dotClass}`}
              />
              {workMode.label}
            </span>
          )}
        </div>

        {job.created_at && (
          <p className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Posted {formatDate(job.created_at)}</span>
          </p>
        )}
      </header>

      {/* Main layout: left content + right snapshot/form */}
      <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
        {/* Left: job description */}
        <div className="space-y-6">
          {job.description && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Full job description
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {job.description}
              </p>
            </section>
          )}

          {job.internal_only && (
            <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-900">
              This role is currently marked as{" "}
              <span className="font-semibold">internal only</span>. If you can
              see this page, you&apos;ve been invited to apply.
            </section>
          )}
        </div>

        {/* Right: snapshot + application form */}
        <aside className="space-y-6">
          {/* Snapshot card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Role snapshot
            </h2>
            <div className="mt-3 space-y-2 text-xs text-slate-700">
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500">Location</span>
                <span className="flex items-center gap-1 text-right">
                  <MapPin className="h-3.5 w-3.5 text-red-400" />
                  {job.location || "Location flexible"}
                </span>
              </div>
              {workMode && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500">Work mode</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${workMode.bgClass} ${workMode.textClass}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${workMode.dotClass}`}
                    />
                    {workMode.label}
                  </span>
                </div>
              )}
              {job.employment_type && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500">Job type</span>
                  <span className="flex items-center gap-1 text-right">
                    <Briefcase className="h-3.5 w-3.5 text-amber-500" />
                    {job.employment_type}
                  </span>
                </div>
              )}
              {job.department && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500">Function</span>
                  <span className="text-right">{job.department}</span>
                </div>
              )}
              {(job.years_experience_min || job.years_experience_max) && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500">Experience</span>
                  <span className="text-right">
                    {job.years_experience_min
                      ? `${job.years_experience_min} yrs`
                      : ""}
                    {job.years_experience_min && job.years_experience_max
                      ? " - "
                      : ""}
                    {job.years_experience_max
                      ? `${job.years_experience_max} yrs`
                      : ""}
                  </span>
                </div>
              )}
              {salaryDisplay && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500">Salary range</span>
                  <span className="text-right">{salaryDisplay}</span>
                </div>
              )}
              {job.education_required && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-500">Education</span>
                  <span className="text-right">
                    {job.education_required}
                    {job.education_field
                      ? ` · ${job.education_field}`
                      : ""}
                  </span>
                </div>
              )}
              {job.required_skills && job.required_skills.length > 0 && (
                <div className="pt-2">
                  <div className="mb-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <TagIcon className="h-3 w-3 text-slate-400" />
                    <span>Key skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {job.tags && job.tags.length > 0 && (
                <div className="pt-2">
                  <div className="mb-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <TagIcon className="h-3 w-3 text-slate-400" />
                    <span>Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Application form */}
          <section>
            <h2 className="text-sm font-semibold text-slate-900">
              Apply for this role
            </h2>
            <p className="mt-1 text-[11px] text-slate-600">
              Fields marked with <span className="text-red-500">*</span> are
              compulsory. You can apply without creating an account.
            </p>

            <ApplicationForm
              jobId={job.id}
              tenantId={job.tenant_id}
              slug={job.slug ?? slugOrId}
              jobCountry={jobCountry}
              isRemoteJob={isRemoteJob}
              showGitHubField={showGitHubField}
            />
          </section>
        </aside>
      </section>
    </main>
  );
}

type ApplicationFormProps = {
  jobId: string;
  tenantId: string;
  slug: string;
  jobCountry: string | null;
  isRemoteJob: boolean;
  showGitHubField: boolean;
};

function ApplicationForm(props: ApplicationFormProps) {
  const { jobId, tenantId, slug, jobCountry, isRemoteJob, showGitHubField } =
    props;

  const workPermitQuestionLabel = jobCountry
    ? `Are you legally authorized to work in ${jobCountry}?`
    : "Are you legally authorized to work in the primary country for this role?";

  return (
    <form
      action="/api/job-applications"
      method="POST"
      encType="multipart/form-data"
      className="mt-3 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="jobSlug" value={slug} />
      <input
        type="hidden"
        name="jobCountry"
        value={jobCountry ?? ""}
      />
      <input
        type="hidden"
        name="isRemoteJob"
        value={isRemoteJob ? "1" : "0"}
      />

      {/* Progress hint */}
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>Step 1 of 3 · Personal info</span>
        <span>Step 2 · Experience · Step 3 · Review & consent</span>
      </div>

      {/* SECTION 1: PERSONAL INFORMATION */}
      <div className="space-y-3 border-b border-slate-100 pb-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Personal information
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              name="fullName"
              required
              minLength={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Phone number (optional)
            </label>
            <input
              name="phone"
              placeholder="+234 803 000 0000"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Current location (optional)
            </label>
            <input
              name="location"
              placeholder="Lagos, Nigeria"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: PROFESSIONAL LINKS */}
      <div className="space-y-3 border-b border-slate-100 pb-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Professional links
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              LinkedIn profile (optional)
            </label>
            <input
              name="linkedinUrl"
              placeholder="https://linkedin.com/in/..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Portfolio / website (optional)
            </label>
            <input
              name="portfolioUrl"
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
        </div>

        {showGitHubField && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              GitHub profile (optional)
            </label>
            <input
              name="githubUrl"
              placeholder="https://github.com/..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
        )}
      </div>

      {/* SECTION 3: DOCUMENTS */}
      <div className="space-y-3 border-b border-slate-100 pb-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Documents
        </h3>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Resume / CV (PDF only) <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            name="cv"
            required
            accept=".pdf"
            className="w-full text-xs text-slate-700"
          />
          <p className="text-[11px] text-slate-500">
            Max size 5MB. If you have trouble uploading, you can also email your
            CV to us after submitting.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Cover letter (optional but recommended)
          </label>
          <textarea
            name="coverLetter"
            rows={6}
            maxLength={2000}
            placeholder="Tell us why you're interested in this role and what makes you a great fit..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
          <p className="text-[11px] text-slate-500">
            Max 2000 characters.
          </p>
        </div>
      </div>

      {/* SECTION 4: SCREENING QUESTIONS */}
      <div className="space-y-3 border-b border-slate-100 pb-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Screening questions
        </h3>

        {/* Work permit */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            {workPermitQuestionLabel}{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-700">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name="workPermitStatus"
                value="yes"
                required
                className="h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <span>Yes</span>
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name="workPermitStatus"
                value="no"
                required
                className="h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {/* Expected salary */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Expected salary range (optional)
          </label>
          <input
            name="grossAnnualExpectation"
            placeholder="e.g. ₦3,000,000 - ₦5,000,000 per year"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>

        {/* Current gross & notice period */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Current gross annual (optional)
            </label>
            <input
              name="currentGrossAnnual"
              placeholder="e.g. ₦2,400,000 per year"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              When are you available to start?{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              name="noticePeriod"
              required
              placeholder="e.g. Immediate, 2 weeks, 1 month"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
        </div>

        {/* Remote-specific question */}
        {isRemoteJob && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Do you have reliable internet and a suitable workspace for remote
              work? (optional)
            </label>
            <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-700">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="remoteSetup"
                  value="yes"
                  className="h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
                />
                <span>Yes</span>
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  name="remoteSetup"
                  value="no"
                  className="h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
                />
                <span>No</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: DIVERSITY & INCLUSION (OPTIONAL) */}
      <div className="space-y-3 border-b border-slate-100 pb-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Diversity &amp; inclusion (optional)
        </h3>
        <p className="text-[11px] text-slate-500">
          These questions are voluntary and used only for diversity reporting.
          They do not affect your application.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Gender (optional)
            </label>
            <select
              name="gender"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]/60"
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-800">
              Ethnicity (optional)
            </label>
            <input
              name="ethnicity"
              placeholder="Optional, describe in your own words"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            How did you hear about this position? (optional)
          </label>
          <select
            name="howHeard"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]/60"
          >
            <option value="">Select an option</option>
            <option value="company_website">Company website</option>
            <option value="linkedin">LinkedIn</option>
            <option value="job_board">Job board (Jobberman, Indeed, etc.)</option>
            <option value="referral">Referral from friend/employee</option>
            <option value="social_media">Social media</option>
            <option value="recruiter">Recruiter contacted me</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* SECTION 6: LEGAL & CONSENT */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Consent
        </h3>

        <div className="space-y-2 text-[11px] text-slate-700">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="dataPrivacyConsent"
              required
              className="mt-0.5 h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
            />
            <span>
              I consent to Resourcin and its clients processing my personal data
              for recruitment purposes in accordance with their Privacy Policy.
            </span>
          </label>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="termsConsent"
              required
              className="mt-0.5 h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
            />
            <span>
              I confirm that the information provided is accurate and complete.
            </span>
          </label>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="marketingOptIn"
              className="mt-0.5 h-3 w-3 border-slate-300 text-[#172965] focus:ring-[#172965]"
            />
            <span>
              I would like to receive updates about future job opportunities
              from Resourcin.
            </span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4c] focus:outline-none focus:ring-2 focus:ring-[#172965]/70 focus:ring-offset-1"
        >
          Submit application
        </button>

        <Link
          href="/jobs"
          className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
        >
          Cancel and go back to all jobs
        </Link>
      </div>
    </form>
  );
}
