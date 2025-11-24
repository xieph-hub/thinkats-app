// app/jobs/[jobIdOrSlug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Role | Resourcin Jobs",
  description:
    "Open roles managed by Resourcin and its clients. Browse and apply without creating an account.",
};

type PageProps = {
  params: { jobIdOrSlug: string };
  searchParams?: { applied?: string };
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

  work_mode: "remote" | "hybrid" | "onsite" | "flexible" | null;

  required_skills: string[] | null;
  tags: string[] | null;

  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_visible: boolean | null;

  years_experience_min: number | null;
  years_experience_max: number | null;

  education_required: string | null;
  education_field: string | null;

  internal_only?: boolean | null;
  confidential?: boolean | null;

  created_at: string | null;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

function looksLikeUuid(value: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

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

function formatEmploymentType(value: string | null) {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === "full-time" || lower === "full_time") return "Full-time";
  if (lower === "part-time" || lower === "part_time") return "Part-time";
  if (lower === "contract") return "Contract";
  if (lower === "internship") return "Internship";
  return value;
}

function formatExperienceLevel(value: string | null) {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === "entry") return "Entry level";
  if (lower === "mid") return "Mid level";
  if (lower === "senior") return "Senior level";
  if (lower === "lead") return "Lead / Principal";
  if (lower === "executive") return "Executive";
  return value;
}

function formatWorkMode(
  workMode: JobRow["work_mode"],
  location: string | null,
  tags: string[] | null
) {
  if (workMode) {
    const label =
      workMode === "remote"
        ? "Remote"
        : workMode === "hybrid"
        ? "Hybrid"
        : workMode === "onsite"
        ? "On-site"
        : workMode === "flexible"
        ? "Flexible"
        : null;
    if (label) return label;
  }

  const loc = (location || "").toLowerCase();
  const tagList = (tags || []).map((t) => t.toLowerCase());

  if (loc.includes("remote") || tagList.includes("remote")) return "Remote";
  if (loc.includes("hybrid") || tagList.includes("hybrid")) return "Hybrid";
  if (loc.includes("flexible") || tagList.includes("flexible")) return "Flexible";
  if (loc.includes("on-site") || loc.includes("onsite")) return "On-site";

  return null;
}

function formatSalaryRange(job: JobRow) {
  if (!job.salary_visible) return null;
  const { salary_min, salary_max, salary_currency } = job;
  if (!salary_min && !salary_max) return null;

  const symbol =
    salary_currency === "NGN"
      ? "₦"
      : salary_currency === "USD"
      ? "$"
      : salary_currency === "GBP"
      ? "£"
      : salary_currency === "EUR"
      ? "€"
      : "";

  const formatAmount = (n: number | null) =>
    n == null ? "" : `${symbol}${n.toLocaleString()}`;

  if (salary_min && salary_max) {
    return `${formatAmount(salary_min)} – ${formatAmount(salary_max)} per year`;
  }
  if (salary_min) {
    return `From ${formatAmount(salary_min)} per year`;
  }
  if (salary_max) {
    return `Up to ${formatAmount(salary_max)} per year`;
  }
  return null;
}

type DescriptionSections = {
  overview: string | null;
  responsibilities: string | null;
  requirements: string | null;
  aboutClient: string | null;
};

/**
 * Heuristically splits a free-form description into sections based on headings
 * the writer may have used (Overview / Responsibilities / Requirements / About the client).
 * If markers aren’t found, everything stays in Overview.
 */
function splitDescriptionIntoSections(
  description: string | null
): DescriptionSections {
  if (!description) {
    return {
      overview: null,
      responsibilities: null,
      requirements: null,
      aboutClient: null,
    };
  }

  const text = description.replace(/\r\n/g, "\n");
  const lines = text.split("\n");

  const buckets: Record<keyof DescriptionSections, string[]> = {
    overview: [],
    responsibilities: [],
    requirements: [],
    aboutClient: [],
  };

  let current: keyof DescriptionSections = "overview";

  for (const raw of lines) {
    const line = raw.trim();
    const lower = line.toLowerCase();

    if (
      /^(overview|about the role|summary)[:\s]*$/i.test(line) ||
      /^##\s*(overview|about the role)/.test(line)
    ) {
      current = "overview";
      continue;
    }

    if (
      /^(key responsibilities|responsibilities|what you will do|what you'll do)[:\s]*$/i.test(
        line
      ) ||
      /^##\s*(responsibilities)/.test(line)
    ) {
      current = "responsibilities";
      continue;
    }

    if (
      /^(requirements|required qualifications|what you need)[:\s]*$/i.test(
        line
      ) ||
      /^##\s*(requirements)/.test(line)
    ) {
      current = "requirements";
      continue;
    }

    if (
      /^(about the client|about the company|about us)[:\s]*$/i.test(line) ||
      /^##\s*(about the client|about the company|about us)/.test(line)
    ) {
      current = "aboutClient";
      continue;
    }

    buckets[current].push(raw);
  }

  const collapse = (arr: string[]) => {
    const joined = arr.join("\n").trim();
    return joined.length ? joined : null;
  };

  const overview = collapse(buckets.overview);
  const responsibilities = collapse(buckets.responsibilities);
  const requirements = collapse(buckets.requirements);
  const aboutClient = collapse(buckets.aboutClient);

  // If no explicit sections were found, treat the whole thing as Overview.
  if (!responsibilities && !requirements && !aboutClient) {
    return {
      overview: text.trim() || null,
      responsibilities: null,
      requirements: null,
      aboutClient: null,
    };
  }

  return { overview, responsibilities, requirements, aboutClient };
}

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

// Simple brand-style icons (no external icon library)

function IconLocationPin() {
  return (
    <svg
      className="h-3.5 w-3.5 text-red-500"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M10 2.5a4.75 4.75 0 0 0-4.75 4.75c0 3.2 3.35 7.07 4.19 7.95a.8.8 0 0 0 1.12 0c.84-.88 4.19-4.75 4.19-7.95A4.75 4.75 0 0 0 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="10" cy="7.3" r="1.7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconBriefcaseBrown() {
  return (
    <svg
      className="h-3.5 w-3.5 text-amber-700"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="3"
        y="7"
        width="14"
        height="9"
        rx="1.8"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M7.5 7V5.8A1.8 1.8 0 0 1 9.3 4h1.4A1.8 1.8 0 0 1 12.5 5.8V7"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M3.5 10h4m5 0h4"
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
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M10 6.3V10l2.2 1.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg
      className="h-3.5 w-3.5 text-slate-500"
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

function IconAward() {
  return (
    <svg
      className="h-3.5 w-3.5 text-yellow-500"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M7.3 10.6 6.5 16l3.5-1.6L13.5 16l-.8-5.4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTag() {
  return (
    <svg
      className="h-3 w-3 text-slate-500"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M4.5 4a1.5 1.5 0 0 1 1.06-.44h4.38a1.5 1.5 0 0 1 1.06.44l4.45 4.45a1.4 1.4 0 0 1 0 1.98l-4.38 4.38a1.4 1.4 0 0 1-1.98 0L3.5 10.98A1.5 1.5 0 0 1 3.06 9.9L3 5.56A1.5 1.5 0 0 1 4.5 4Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="7.3" cy="6.7" r="1.1" fill="currentColor" />
    </svg>
  );
}

// Social icons – LinkedIn / X / WhatsApp

function IconLinkedIn() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="3"
        fill="#0A66C2"
      />
      <path
        d="M7.1 17.2V10H5V17.2h2.1Zm-1.1-8.3a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm3.9 8.3h2.1V13.4c0-.9.5-1.4 1.2-1.4.7 0 1.1.4 1.1 1.4v3.8H17V13c0-2-1.1-3-2.7-3-1.2 0-1.8.7-2.1 1.2v-1H10v7.1Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function IconX() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
    >
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#000000" />
      <path
        d="M9.2 7h1.7l1.8 2.6L14.6 7h1.7l-2.7 3.7L16.4 17h-1.7l-2.1-3.1L10.4 17H8.7l2.8-3.9L9.2 7Z"
        fill="#ffffff"
      />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M4.5 19.5 5.4 16A7 7 0 1 1 16 18.6l-3.5.9-4 0Z"
        fill="#25D366"
      />
      <path
        d="M10.2 8.8c-.2-.5-.4-.5-.7-.5h-.6c-.3 0-.6.1-.8.4-.3.3-1 1-1 2.5s1 2.9 1.1 3.1c.1.2 2 3.2 4.9 4.3 2.4.9 2.9.8 3.5.7.5-.1 1.7-.7 1.9-1.3.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.7-.4-.4-.2-2.1-1-2.4-1.1-.3-.1-.6-.2-.8.2-.2.3-.9 1.1-1.1 1.3-.2.2-.4.2-.7.1-.4-.2-1.6-.6-2.9-1.9-1.1-1.1-1.9-2.4-2.1-2.8-.2-.4 0-.6.1-.8.2-.2.4-.4.5-.6.1-.1.1-.3 0-.6-.1-.2-.8-2-1.1-2.7Z"
        fill="#ffffff"
      />
    </svg>
  );
}

function SocialIconButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-[1px] hover:bg-white hover:shadow-md hover:ring-slate-300"
    >
      {children}
    </a>
  );
}

export default async function JobDetailPage({
  params,
  searchParams,
}: PageProps) {
  const rawParam = params.jobIdOrSlug;

  if (!rawParam || rawParam === "undefined") {
    notFound();
  }

  const slugOrId = decodeURIComponent(rawParam);
  const isUuid = looksLikeUuid(slugOrId);

  const selectFields = `
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
    required_skills,
    tags,
    salary_min,
    salary_max,
    salary_currency,
    salary_visible,
    years_experience_min,
    years_experience_max,
    education_required,
    education_field,
    internal_only,
    confidential,
    created_at
  `;

  let job: JobRow | null = null;

  if (isUuid) {
    const { data, error } = await supabaseAdmin
      .from("jobs")
      .select(selectFields)
      .eq("id", slugOrId)
      .eq("status", "open")
      .eq("visibility", "public")
      .maybeSingle<JobRow>();

    if (error) {
      console.error("Error loading job detail by id:", error);
    }
    job = data;
  } else {
    const { data, error } = await supabaseAdmin
      .from("jobs")
      .select(selectFields)
      .eq("slug", slugOrId)
      .eq("status", "open")
      .eq("visibility", "public")
      .maybeSingle<JobRow>();

    if (error) {
      console.error("Error loading job detail by slug:", error);
    }
    job = data;
  }

  if (!job) {
    notFound();
  }

  const appliedFlag = searchParams?.applied;
  const employmentTypeLabel = formatEmploymentType(job.employment_type);
  const experienceLevelLabel = formatExperienceLevel(job.experience_level);
  const workModeLabel = formatWorkMode(job.work_mode, job.location, job.tags);
  const salaryLabel = formatSalaryRange(job);
  const sections = splitDescriptionIntoSections(job.description);

  const isConfidential =
    job.visibility === "confidential" || Boolean(job.confidential);

  const jobUrl = `${BASE_URL}/jobs/${encodeURIComponent(
    job.slug || job.id
  )}`;
  const shareText = encodeURIComponent(
    `${job.title}${job.location ? ` – ${job.location}` : ""} (via Resourcin)`
  );
  const encodedUrl = encodeURIComponent(jobUrl);

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/jobs"
        className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
      >
        ← Back to all roles
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

      <article className="mt-6 space-y-8">
        {/* HEADER */}
        <header className="space-y-3 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-900">
                {job.title}
              </h1>
              {job.short_description && (
                <p className="max-w-xl text-sm text-slate-600">
                  {job.short_description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.location && (
                  <MetaItem icon={<IconLocationPin />} label={job.location} />
                )}
                {workModeLabel && (
                  <MetaItem icon={<IconGlobe />} label={workModeLabel} />
                )}
                {employmentTypeLabel && (
                  <MetaItem
                    icon={<IconBriefcaseBrown />}
                    label={employmentTypeLabel}
                  />
                )}
                {experienceLevelLabel && (
                  <MetaItem icon={<IconAward />} label={experienceLevelLabel} />
                )}
                {job.department && (
                  <MetaItem
                    icon={<IconTag />}
                    label={job.department || "Client role"}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 text-[11px] text-slate-500 sm:items-end">
              {job.created_at && (
                <span className="inline-flex items-center gap-1">
                  <IconClock />
                  <span>Posted {formatDate(job.created_at)}</span>
                </span>
              )}
              {salaryLabel && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-800 ring-1 ring-emerald-100">
                  {salaryLabel}
                </span>
              )}
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Share
                </span>
                <SocialIconButton href={linkedInUrl} label="Share on LinkedIn">
                  <IconLinkedIn />
                </SocialIconButton>
                <SocialIconButton href={xUrl} label="Post on X">
                  <IconX />
                </SocialIconButton>
                <SocialIconButton
                  href={whatsappUrl}
                  label="Send via WhatsApp"
                >
                  <IconWhatsApp />
                </SocialIconButton>
              </div>
            </div>
          </div>
        </header>

        {/* BODY: OVERVIEW / RESPONSIBILITIES / REQUIREMENTS / ABOUT CLIENT */}
        <div className="space-y-8">
          {/* Overview */}
          {sections.overview && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Overview of the role
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {sections.overview}
              </p>
            </section>
          )}

          {/* Responsibilities */}
          {sections.responsibilities && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Key responsibilities
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {sections.responsibilities}
              </p>
            </section>
          )}

          {/* Requirements */}
          {(sections.requirements ||
            job.required_skills ||
            job.years_experience_min ||
            job.education_required) && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Requirements
              </h2>

              {sections.requirements && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {sections.requirements}
                </p>
              )}

              <dl className="grid gap-3 text-[11px] text-slate-700 sm:grid-cols-2">
                {job.years_experience_min != null ||
                job.years_experience_max != null ? (
                  <div>
                    <dt className="font-semibold text-slate-800">
                      Years of experience
                    </dt>
                    <dd className="mt-0.5">
                      {job.years_experience_min != null &&
                      job.years_experience_max != null
                        ? `${job.years_experience_min}–${job.years_experience_max} years`
                        : job.years_experience_min != null
                        ? `From ${job.years_experience_min} years`
                        : `Up to ${job.years_experience_max} years`}
                    </dd>
                  </div>
                ) : null}

                {job.education_required && (
                  <div>
                    <dt className="font-semibold text-slate-800">
                      Education
                    </dt>
                    <dd className="mt-0.5">
                      {job.education_required.replace(/_/g, " ")}
                      {job.education_field
                        ? ` in ${job.education_field}`
                        : ""}
                    </dd>
                  </div>
                )}

                {job.required_skills && job.required_skills.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="font-semibold text-slate-800">
                      Core skills
                    </dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {job.required_skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-800 ring-1 ring-slate-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* About client */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
              About the client
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              {isConfidential ? (
                <>
                  This is a{" "}
                  <span className="font-medium">confidential mandate</span>{" "}
                  managed by Resourcin. Full client details will be shared with
                  shortlisted candidates.
                </>
              ) : (
                <>
                  This role is managed by Resourcin on behalf of a client. As
                  you progress in the process, you&apos;ll get more context on
                  the organisation, team and reporting lines.
                </>
              )}
            </p>
          </section>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700 ring-1 ring-slate-100"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* APPLICATION FORM */}
        <section className="mt-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Apply for this role
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            You can apply without creating an account. We&apos;ll add you to our
            talent pool and only reach out when there&apos;s a strong match.
          </p>

          <ApplicationForm
            jobId={job.id}
            tenantId={job.tenant_id}
            slug={job.slug}
          />
        </section>
      </article>
    </main>
  );
}

// Keep this aligned with your existing /api/job-applications handler
function ApplicationForm(props: {
  jobId: string;
  tenantId: string;
  slug: string | null;
}) {
  const { jobId, tenantId, slug } = props;

  return (
    <form
      action="/api/job-applications"
      method="POST"
      encType="multipart/form-data"
      className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="jobSlug" value={slug ?? ""} />

      {/* Personal info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Full name *
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
            Email address *
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1 sm:col-span-1">
          <label className="text-xs font-medium text-slate-800">
            Phone number
          </label>
          <input
            name="phone"
            placeholder="+234..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-slate-800">
            Current location
          </label>
          <input
            name="location"
            placeholder="City, Country"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </div>

      {/* Professional links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1 sm:col-span-1">
          <label className="text-xs font-medium text-slate-800">
            LinkedIn URL
          </label>
          <input
            name="linkedinUrl"
            placeholder="https://linkedin.com/in/..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
        <div className="space-y-1 sm:col-span-1">
          <label className="text-xs font-medium text-slate-800">
            Portfolio / Website
          </label>
          <input
            name="portfolioUrl"
            placeholder="https://..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
        <div className="space-y-1 sm:col-span-1">
          <label className="text-xs font-medium text-slate-800">
            GitHub (optional)
          </label>
          <input
            name="githubUrl"
            placeholder="https://github.com/..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </div>

      {/* Screening basics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Do you have a valid work permit for this role&apos;s country?
          </label>
          <select
            name="hasWorkPermit"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          >
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="na">Not applicable / Remote only</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Current gross (optional)
          </label>
          <input
            name="currentSalary"
            placeholder="e.g. ₦7,500,000 / year"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Expected gross
          </label>
          <input
            name="expectedSalary"
            placeholder="e.g. ₦10,000,000 / year"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-800">
            Notice period
          </label>
          <input
            name="noticePeriod"
            placeholder="e.g. 2 weeks, 1 month"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </div>

      {/* Documents */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-800">
          CV / Résumé (PDF or Word) *
        </label>
        <input
          type="file"
          name="cv"
          accept=".pdf,.doc,.docx"
          required
          className="w-full text-xs text-slate-700"
        />
        <p className="text-[11px] text-slate-500">
          If you have trouble uploading, you can also email your CV to us after
          submitting.
        </p>
      </div>

      {/* Cover note */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-800">
          Short note (optional)
        </label>
        <textarea
          name="coverLetter"
          rows={4}
          maxLength={2000}
          placeholder="Tell us why you’re interested in this role and what makes you a strong fit."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
        />
      </div>

      {/* Consent */}
      <div className="space-y-2">
        <label className="flex items-start gap-2 text-[11px] text-slate-700">
          <input
            type="checkbox"
            name="consentData"
            required
            className="mt-[2px] h-3 w-3 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
          />
          <span>
            I consent to Resourcin processing my personal data for recruitment
            purposes in line with its Privacy Policy.
          </span>
        </label>
        <label className="flex items-start gap-2 text-[11px] text-slate-700">
          <input
            type="checkbox"
            name="consentAccuracy"
            required
            className="mt-[2px] h-3 w-3 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
          />
          <span>
            I confirm that the information I&apos;ve provided is accurate and
            complete.
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4c] focus:outline-none focus:ring-2 focus:ring-[#172965]/70 focus:ring-offset-1"
      >
        Submit application
      </button>
    </form>
  );
}
