// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open roles | Resourcin",
  description:
    "Current open mandates managed by Resourcin and its clients across Nigeria, Africa and beyond.",
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
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
  short_description: string | null;
  tags: string[] | null;
  confidential: boolean | null;
};

// -------------------- helpers --------------------

function getParam(searchParams: SearchParams | undefined, key: string) {
  const value = searchParams?.[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return "";
}

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

// -------------------- page --------------------

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
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
      short_description,
      tags,
      confidential
    `,
    )
    .eq("visibility", "public")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Error loading jobs:", error);
  }

  const jobs = ((data as JobRow[]) || []).filter(Boolean);

  const q = getParam(searchParams, "q").trim();
  const locationFilter = getParam(searchParams, "location").trim();
  const workModeFilter = getParam(searchParams, "work_mode").trim();
  const experienceFilter = getParam(searchParams, "experience_level").trim();

  const filteredJobs = jobs.filter((job) => {
    if (q) {
      const haystack = [
        job.title,
        job.short_description,
        job.location,
        job.department,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }

    if (locationFilter && job.location !== locationFilter) return false;
    if (workModeFilter && job.work_mode !== workModeFilter) return false;
    if (
      experienceFilter &&
      job.experience_level !== experienceFilter
    )
      return false;

    return true;
  });

  const totalCount = jobs.length;
  const visibleCount = filteredJobs.length;

  const uniqueLocations = Array.from(
    new Set(jobs.map((j) => j.location).filter(Boolean) as string[]),
  );
  const uniqueWorkModes = Array.from(
    new Set(jobs.map((j) => j.work_mode).filter(Boolean) as string[]),
  );
  const uniqueExperienceLevels = Array.from(
    new Set(
      jobs.map((j) => j.experience_level).filter(Boolean) as string[],
    ),
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero / intro */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-[#172965]/5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-[#172965] sm:text-4xl">
                Current roles via Resourcin
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-slate-700">
                Executive searches, senior individual contributors and hard-to-fill
                roles across Nigeria, Africa and select global markets. Every role
                here is being actively managed by the Resourcin team.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 shadow-sm">
              <div className="font-semibold text-[#172965]">
                {visibleCount} open role{visibleCount === 1 ? "" : "s"}
              </div>
              {visibleCount !== totalCount && (
                <div className="mt-1 text-[11px] text-slate-500">
                  Showing a filtered view from {totalCount} total open roles.
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <form className="mt-6 grid gap-3 md:grid-cols-[minmax(0,2.2fr),minmax(0,1.2fr),minmax(0,1.2fr),minmax(0,1.2fr)]">
            <div className="col-span-1 md:col-span-1">
              <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Keyword
              </label>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search by title, company, location..."
                className="mt-1.5 w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Location
              </label>
              <select
                name="location"
                defaultValue={locationFilter}
                className="mt-1.5 w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/50"
              >
                <option value="">All locations</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Work pattern
              </label>
              <select
                name="work_mode"
                defaultValue={workModeFilter}
                className="mt-1.5 w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/50"
              >
                <option value="">Any</option>
                {uniqueWorkModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {formatWorkMode(mode)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Role level
              </label>
              <select
                name="experience_level"
                defaultValue={experienceFilter}
                className="mt-1.5 w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/50"
              >
                <option value="">Any</option>
                {uniqueExperienceLevels.map((level) => (
                  <option key={level} value={level}>
                    {formatExperienceLevel(level)}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>
      </section>

      {/* Job list */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {visibleCount === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-700 shadow-sm">
            <div className="text-sm font-semibold text-[#172965]">
              No roles match these filters right now.
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Try clearing one or two filters, or check back soon as new roles
              are added regularly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// -------------------- job card --------------------

function JobCard({ job }: { job: JobRow }) {
  const href = `/jobs/${encodeURIComponent(job.slug || job.id)}`;
  const postedLabel = formatPostedAt(job.created_at);
  const displayEmploymentType = formatEmploymentType(job.employment_type);
  const displayExperienceLevel = formatExperienceLevel(job.experience_level);
  const displayWorkMode = formatWorkMode(job.work_mode);

  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#172965]/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-sm font-semibold text-[#172965] sm:text-base">
            {job.title}
          </h2>
          <p className="text-[11px] text-slate-600">
            {job.confidential
              ? "Confidential search · via Resourcin"
              : "Resourcin · Hiring for clients across Africa & beyond"}
          </p>
        </div>
        {postedLabel && (
          <span className="hidden text-[11px] text-slate-500 sm:inline">
            {postedLabel}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
        {job.location && (
          <JobMetaPill icon={<IconLocation />} label={job.location} />
        )}
        {displayWorkMode && (
          <JobMetaPill icon={<IconGlobe />} label={displayWorkMode} />
        )}
        {displayEmploymentType && (
          <JobMetaPill icon={<IconBriefcase />} label={displayEmploymentType} />
        )}
        {displayExperienceLevel && (
          <JobMetaPill icon={<IconClock />} label={displayExperienceLevel} />
        )}
      </div>

      {job.short_description && (
        <p className="mt-3 text-xs leading-relaxed text-slate-700">
          {job.short_description}
        </p>
      )}

      {job.tags && job.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-[#64C247]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#306B34]"
            >
              #{tag}
            </span>
          ))}
          {job.tags.length > 4 && (
            <span className="text-[10px] text-slate-500">
              +{job.tags.length - 4} more
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

function JobMetaPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5">
      <span className="text-slate-500" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}

// Reuse icons for consistency
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
