// app/jobs/[jobIdOrSlug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Role details | Resourcin",
  description:
    "Detailed view of an open mandate managed by Resourcin and its clients.",
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

type ClientCompanyRow = {
  name: string;
  logo_url: string | null;
  slug: string | null;
};

type JobRow = {
  id: string;
  slug: string | null;
  title: string;
  short_description: string | null;
  description: string | null;
  department: string | null;
  location: string | null;
  location_type: string | null;
  employment_type: string | null;
  experience_level: string | null;
  years_experience_min: number | null;
  years_experience_max: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_visible: boolean | null;
  required_skills: string[] | null;
  education_required: string | null;
  education_field: string | null;
  internal_only: boolean | null;
  confidential: boolean | null;
  status: string | null;
  visibility: string | null;
  work_mode: string | null;
  tags: string[] | null;
  created_at: string;
  client_company: ClientCompanyRow[] | null;
};

type DescriptionSections = {
  overview: string[];
  responsibilities: string[];
  requirements: string[];
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatEmploymentType(value: string | null) {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === "full-time" || lower === "full_time") return "Full-time";
  if (lower === "part-time" || lower === "part_time") return "Part-time";
  if (lower === "contract") return "Contract";
  if (lower === "internship") return "Internship";
  return value;
}

function formatWorkMode(job: JobRow): string | null {
  if (job.work_mode) {
    const lower = job.work_mode.toLowerCase();
    if (lower === "remote") return "Remote";
    if (lower === "hybrid") return "Hybrid";
    if (lower === "onsite" || lower === "on-site") return "On-site";
    if (lower === "flexible") return "Flexible";
  }

  const loc = (job.location || "").toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase());

  if (loc.includes("remote") || tags.includes("remote")) return "Remote";
  if (loc.includes("hybrid") || tags.includes("hybrid")) return "Hybrid";
  if (loc.includes("flexible") || tags.includes("flexible")) return "Flexible";
  if (loc.includes("on-site") || loc.includes("onsite")) return "On-site";

  return null;
}

function formatExperienceLevel(value: string | null) {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.includes("entry")) return "Entry level";
  if (lower.includes("mid")) return "Mid level";
  if (lower.includes("senior")) return "Senior level";
  if (lower.includes("lead") || lower.includes("principal"))
    return "Lead / Principal";
  if (lower.includes("exec") || lower.includes("c-level"))
    return "Executive";
  return value;
}

function formatNumber(n: number) {
  return Math.round(n).toLocaleString();
}

function currencySymbol(code: string | null) {
  if (!code) return "";
  const upper = code.toUpperCase();
  if (upper === "NGN" || upper === "₦") return "₦";
  if (upper === "USD" || upper === "$") return "$";
  if (upper === "GBP" || upper === "£") return "£";
  if (upper === "EUR" || upper === "€") return "€";
  return upper;
}

function formatSalary(job: JobRow): string | null {
  if (!job.salary_visible) return null;
  const { salary_min, salary_max, salary_currency } = job;
  if (!salary_min && !salary_max) return null;

  const sym = currencySymbol(salary_currency);

  if (salary_min && salary_max) {
    return `${sym}${formatNumber(salary_min)} – ${sym}${formatNumber(
      salary_max
    )} per year`;
  }

  if (salary_min) {
    return `From ${sym}${formatNumber(salary_min)} per year`;
  }

  if (salary_max) {
    return `Up to ${sym}${formatNumber(salary_max)} per year`;
  }

  return null;
}

/**
 * Smarter description splitter:
 * - Detects headings for "Responsibilities" / "Requirements" in different phrasings
 * - Strips bullets like "-", "*", "•"
 * - Defaults everything else into Overview
 */
function splitDescription(raw: string | null): DescriptionSections {
  if (!raw) {
    return { overview: [], responsibilities: [], requirements: [] };
  }

  const sections: DescriptionSections = {
    overview: [],
    responsibilities: [],
    requirements: [],
  };

  let mode: keyof DescriptionSections = "overview";

  const lines = raw.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();

    // Switch to Responsibilities
    if (
      lower.startsWith("responsibil") ||
      lower.startsWith("key responsibilities") ||
      lower.startsWith("main responsibilities") ||
      lower.startsWith("what you'll do") ||
      lower.startsWith("what you’ll do") ||
      lower.startsWith("what you will do")
    ) {
      mode = "responsibilities";
      continue;
    }

    // Switch to Requirements
    if (
      lower.startsWith("requirements") ||
      lower.startsWith("requirement") ||
      lower.startsWith("what you'll need") ||
      lower.startsWith("what you’ll need") ||
      lower.startsWith("what you need") ||
      lower.startsWith("who you are")
    ) {
      mode = "requirements";
      continue;
    }

    // Strip leading bullets / markdown list markers
    const cleaned = line.replace(/^[-*•\u2022]\s*/, "");

    sections[mode].push(cleaned);
  }

  return sections;
}

/** Small meta pill with icon + label */
function MetaItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-700">
      <span className="text-slate-500" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}

/** Icons (kept minimal, same aesthetic as /jobs page) */

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

function IconAward() {
  return (
    <svg
      className="h-3.5 w-3.5 text-yellow-500"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <circle
        cx="9.5"
        cy="7"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M6.5 10.2 5.4 16l3-1.7 2.6 1.7 1-5.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Social icons (LinkedIn, X, WhatsApp) */

function LinkedInIcon() {
  return (
    <svg
      className="h-4 w-4 text-[#0A66C2]"
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
      className="h-4 w-4 text-black"
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
      className="h-4 w-4 text-[#25D366]"
      viewBox="0 0 32 32"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M16.04 4C9.96 4 5 8.96 5 15.02c0 2.38.72 4.6 2.09 6.5L5 28l6.63-2.07c1.84 1 3.9 1.53 6.01 1.53h.01C22.1 27.46 27 22.5 27 16.44 27 10.38 22.12 4 16.04 4zm-.01 20.9c-1.8 0-3.56-.48-5.1-1.38l-.37-.22-3.93 1.23 1.28-3.84-.24-.39A8.7 8.7 0 0 1 7.3 15c0-4.84 3.93-8.78 8.77-8.78 4.77 0 8.66 3.94 8.66 8.78 0 4.83-3.9 8.9-8.66 8.9zm4.78-6.63c-.26-.13-1.53-.76-1.77-.84-.24-.09-.41-.13-.58.12-.17.26-.67.84-.82 1-.15.17-.3.19-.56.06-.26-.13-1.09-.4-2.08-1.28-.77-.69-1.29-1.54-1.44-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.39-.8-1.9-.21-.5-.42-.44-.58-.45l-.5-.01c-.17 0-.45.06-.69.32-.24.26-.9.88-.9 2.14 0 1.26.92 2.48 1.05 2.65.13.17 1.81 2.86 4.4 4.02.62.27 1.11.43 1.49.55.63.2 1.2.17 1.65.1.5-.08 1.53-.62 1.75-1.22.22-.6.22-1.11.15-1.22-.06-.11-.24-.17-.5-.3z" />
    </svg>
  );
}

function SocialShareRow({ job }: { job: JobRow }) {
  const slugOrId = job.slug || job.id;
  const jobUrl = `${BASE_URL}/jobs/${encodeURIComponent(slugOrId)}`;
  const shareText = encodeURIComponent(
    `${job.title}${job.location ? ` – ${job.location}` : ""} (via Resourcin)`
  );
  const encodedUrl = encodeURIComponent(jobUrl);

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
      <span className="font-medium text-slate-600">Share this role:</span>
      <a
        href={linkedInUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A66C2] hover:underline"
      >
        <LinkedInIcon />
        <span>LinkedIn</span>
      </a>
      <a
        href={xUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-black hover:underline"
      >
        <XIcon />
        <span>X</span>
      </a>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#25D366] hover:underline"
      >
        <WhatsAppIcon />
        <span>WhatsApp</span>
      </a>
    </div>
  );
}

export default async function JobDetailPage({
  params,
}: {
  params: { jobIdOrSlug: string };
}) {
  const identifier = params.jobIdOrSlug;

  // 1) Try finding by slug (public, open)
  const { data: slugData, error: slugError } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      short_description,
      description,
      department,
      location,
      location_type,
      employment_type,
      experience_level,
      years_experience_min,
      years_experience_max,
      salary_min,
      salary_max,
      salary_currency,
      salary_visible,
      required_skills,
      education_required,
      education_field,
      internal_only,
      confidential,
      status,
      visibility,
      work_mode,
      tags,
      created_at,
      client_company:client_companies (
        name,
        logo_url,
        slug
      )
    `
    )
    .eq("slug", identifier)
    .eq("visibility", "public")
    .limit(1);

  if (slugError) {
    console.error("Job detail – error querying by slug:", slugError);
  }

  let jobRow: JobRow | null = (slugData?.[0] as JobRow | undefined) || null;

  // 2) If not found and identifier looks like a UUID, try by id
  if (!jobRow && isUuid(identifier)) {
    const { data: idData, error: idError } = await supabaseAdmin
      .from("jobs")
      .select(
        `
        id,
        slug,
        title,
        short_description,
        description,
        department,
        location,
        location_type,
        employment_type,
        experience_level,
        years_experience_min,
        years_experience_max,
        salary_min,
        salary_max,
        salary_currency,
        salary_visible,
        required_skills,
        education_required,
        education_field,
        internal_only,
        confidential,
        status,
        visibility,
        work_mode,
        tags,
        created_at,
        client_company:client_companies (
          name,
          logo_url,
          slug
        )
      `
      )
      .eq("id", identifier)
      .eq("visibility", "public")
      .limit(1);

    if (idError) {
      console.error("Job detail – error querying by id:", idError);
    }
    jobRow = (idData?.[0] as JobRow | undefined) || null;
  }

  if (!jobRow) {
    notFound();
  }

  const job = jobRow;
  const workModeLabel = formatWorkMode(job);
  const employmentTypeLabel = formatEmploymentType(job.employment_type);
  const experienceLevelLabel = formatExperienceLevel(job.experience_level);
  const salaryLabel = formatSalary(job);
  const client = job.client_company?.[0] || null;

  const descSections = splitDescription(job.description);
  const hasResponsibilities = descSections.responsibilities.length > 0;
  const hasRequirements =
    descSections.requirements.length > 0 ||
    (job.required_skills && job.required_skills.length > 0);

  const slugOrId = job.slug || job.id;
  const applyHref = `/jobs/${encodeURIComponent(slugOrId)}/apply`;

  const isConfidential = !!job.confidential;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-4 text-[11px] text-slate-500">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-[#172965]"
        >
          <span aria-hidden="true">←</span>
          <span>Back to all roles</span>
        </Link>
      </div>

      {/* Header */}
      <header className="mb-6 border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Open role
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          {job.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
          {job.department && (
            <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
              {job.department}
            </span>
          )}
          {client ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
              {client.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={client.logo_url}
                  alt={client.name}
                  className="h-4 w-4 rounded-sm object-contain"
                />
              )}
              <span className="font-medium">
                {isConfidential ? "Confidential search" : client.name}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
              <span className="font-medium">Resourcin</span>
            </span>
          )}
          {job.status && (
            <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
              {job.status}
              {job.visibility ? ` · ${job.visibility}` : ""}
            </span>
          )}
        </div>

        {job.short_description && (
          <p className="mt-3 max-w-2xl text-sm text-slate-700">
            {job.short_description}
          </p>
        )}
      </header>

      {/* Main layout: content + meta */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)]">
        {/* Content column */}
        <div className="space-y-6">
          {/* Overview */}
          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Overview
            </h2>
            <div className="mt-2 space-y-2 text-sm text-slate-700">
              {descSections.overview.length > 0 ? (
                descSections.overview.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))
              ) : job.description ? (
                <p className="whitespace-pre-line">{job.description}</p>
              ) : (
                <p className="text-xs text-slate-500">
                  The client will share a detailed overview during the
                  interview process.
                </p>
              )}
            </div>
          </section>

          {/* Responsibilities */}
          {hasResponsibilities && (
            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Responsibilities
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {descSections.responsibilities.map((line, idx) => (
                  <li key={idx}>{line.replace(/^[-•]\s*/, "")}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Requirements */}
          {hasRequirements && (
            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Requirements
              </h2>

              {descSections.requirements.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {descSections.requirements.map((line, idx) => (
                    <li key={idx}>{line.replace(/^[-•]\s*/, "")}</li>
                  ))}
                </ul>
              )}

              {job.required_skills && job.required_skills.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Skills & tools
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(job.education_required || job.education_field) && (
                <div className="mt-3 text-sm text-slate-700">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Education
                  </p>
                  <p className="mt-1">
                    {job.education_required}
                    {job.education_field
                      ? ` · ${job.education_field}`
                      : null}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* About client */}
          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              About the client
            </h2>
            <div className="mt-2 text-sm text-slate-700">
              {client && !isConfidential ? (
                <p>
                  This mandate is managed by Resourcin on behalf of{" "}
                  <span className="font-semibold">{client.name}</span>. Further
                  details about the organisation, culture, and team will be
                  shared with shortlisted candidates.
                </p>
              ) : (
                <p>
                  This is a{" "}
                  <span className="font-semibold">
                    confidential search
                  </span>{" "}
                  managed by Resourcin. We&apos;ll share full client details as
                  you progress in the process.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Meta / apply column */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Role summary
            </p>

            <div className="mt-3 flex flex-col gap-2 text-[11px] text-slate-700">
              {job.location && (
                <MetaItem icon={<IconLocation />} label={job.location} />
              )}
              {workModeLabel && (
                <MetaItem icon={<IconGlobe />} label={workModeLabel} />
              )}
              {employmentTypeLabel && (
                <MetaItem
                  icon={<IconBriefcase />}
                  label={employmentTypeLabel}
                />
              )}
              {experienceLevelLabel && (
                <MetaItem icon={<IconAward />} label={experienceLevelLabel} />
              )}
              {salaryLabel && (
                <div className="mt-1 text-[11px] text-slate-700">
                  <span className="font-medium">Compensation: </span>
                  <span>{salaryLabel}</span>
                </div>
              )}
              <div className="mt-1 text-[11px] text-slate-500">
                Posted {formatDate(job.created_at)}
              </div>
            </div>

            {job.tags && job.tags.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Tags
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
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

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={applyHref}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c]"
              >
                Apply for this role
              </Link>
              <p className="text-[10px] text-slate-500">
                You can apply without creating an account. We&apos;ll only
                reach out when there&apos;s a strong match.
              </p>
            </div>

            <SocialShareRow job={job} />
          </section>
        </aside>
      </div>
    </main>
  );
}
