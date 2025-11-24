"use client";

import React, { type ReactNode, useMemo, useState } from "react";
import Link from "next/link";

type PublicJob = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  status: string | null;
  visibility: string | null;
  created_at: string;
  tags: string[] | null;
  department: string | null;
};

type Props = {
  initialJobs: PublicJob[];
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

export function JobsListClient({ initialJobs }: Props) {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [workModeFilter, setWorkModeFilter] = useState<string>("all");

  const jobsWithWorkMode = useMemo(
    () =>
      initialJobs.map((job) => ({
        ...job,
        workMode: deriveWorkMode(job),
      })),
    [initialJobs]
  );

  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    for (const job of jobsWithWorkMode) {
      if (job.location && job.location.trim()) {
        set.add(job.location.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobsWithWorkMode]);

  const filteredJobs = useMemo(() => {
    const term = search.toLowerCase().trim();

    return jobsWithWorkMode.filter((job) => {
      const matchesSearch =
        !term ||
        job.title.toLowerCase().includes(term) ||
        (job.location ?? "").toLowerCase().includes(term) ||
        (job.department ?? "").toLowerCase().includes(term) ||
        (job.tags ?? []).some((t) => t.toLowerCase().includes(term));

      const matchesLocation =
        locationFilter === "all" ||
        (job.location ?? "").toLowerCase() ===
          locationFilter.toLowerCase();

      const matchesWorkMode =
        workModeFilter === "all" ||
        (job.workMode ?? "").toLowerCase() ===
          workModeFilter.toLowerCase();

      return matchesSearch && matchesLocation && matchesWorkMode;
    });
  }, [jobsWithWorkMode, search, locationFilter, workModeFilter]);

  const totalCount = initialJobs.length;
  const filteredCount = filteredJobs.length;

  const filtersActive =
    search.trim() !== "" ||
    locationFilter !== "all" ||
    workModeFilter !== "all";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <header className="mb-4 border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          For candidates
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Open roles
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Browse live mandates from Resourcin and our clients. Apply in a few
          minutes; no account required.
        </p>
        {totalCount > 0 && (
          <p className="mt-1 text-[11px] text-slate-500">
            {filtersActive ? (
              <>
                Showing {filteredCount} of {totalCount} role
                {totalCount === 1 ? "" : "s"}.
              </>
            ) : (
              <>
                Showing {totalCount} role
                {totalCount === 1 ? "" : "s"}.
              </>
            )}
          </p>
        )}
      </header>

      {/* Filter bar */}
      <section className="mb-5 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          {/* Search */}
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-medium text-slate-700">
              Search roles
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, department, location or skills"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
            />
          </div>

          {/* Right filters */}
          <div className="grid flex-1 gap-2 sm:grid-cols-2 md:flex md:flex-none md:gap-3">
            {/* Location */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">
                Location
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              >
                <option value="all">All locations</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Work mode */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">
                Work mode
              </label>
              <select
                value={workModeFilter}
                onChange={(e) => setWorkModeFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              >
                <option value="all">Any</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>
          </div>
        </div>

        {filtersActive && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setLocationFilter("all");
              setWorkModeFilter("all");
            }}
            className="mt-2 text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
          >
            Clear filters
          </button>
        )}
      </section>

      {/* Empty states */}
      {totalCount === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No jobs found in your{" "}
          <code className="rounded bg-slate-100 px-1 text-[11px]">jobs</code>{" "}
          table yet. Once you create roles in the ATS, they&apos;ll appear here.
        </p>
      ) : filteredJobs.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No roles match your filters. Try clearing some filters or broadening
          your search.
        </p>
      ) : (
        <JobsCards jobs={filteredJobs} />
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Card list + helpers                                                 */
/* ------------------------------------------------------------------ */

function JobsCards({ jobs }: { jobs: (PublicJob & { workMode?: string | null })[] }) {
  return (
    <section className="mt-2 space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </section>
  );
}

function JobCard({ job }: { job: PublicJob & { workMode?: string | null } }) {
  const slugOrId = job.slug || job.id;
  const employmentTypeLabel = formatEmploymentType(job.employment_type);
  const workModeLabel = job.workMode ?? deriveWorkMode(job);

  const jobUrl = `${BASE_URL}/jobs/${encodeURIComponent(slugOrId)}`;
  const shareText = encodeURIComponent(
    `${job.title}${job.location ? ` – ${job.location}` : ""} (via Resourcin)`
  );
  const encodedUrl = encodeURIComponent(jobUrl);

  const xUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm ring-1 ring-transparent transition hover:border-[#172965]/70 hover:bg-white hover:shadow-md hover:ring-[#172965]/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: title + meta + tags + share */}
        <div className="space-y-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              <Link
                href={`/jobs/${encodeURIComponent(slugOrId)}`}
                className="hover:underline"
              >
                {job.title}
              </Link>
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {job.department || "Client role"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {job.location && (
              <MetaItem icon={<IconLocation />} label={job.location} />
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
            {job.seniority && (
              <MetaItem icon={<IconStar />} label={job.seniority} />
            )}
          </div>

          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Social share */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
            <span className="font-medium text-slate-600">
              Share this role:
            </span>
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#0A66C2] hover:underline"
            >
              <IconLinkedIn />
              <span>LinkedIn</span>
            </a>
            <a
              href={xUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-black hover:underline"
            >
              <IconX />
              <span>X</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#25D366] hover:underline"
            >
              <IconWhatsApp />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Right: meta and CTA */}
        <div className="flex flex-col items-start gap-2 text-[11px] text-slate-500 sm:items-end">
          {job.created_at && (
            <span>Posted {formatDate(job.created_at)}</span>
          )}
          {(job.status || job.visibility) && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] text-slate-700">
              {job.status || "unspecified"}
              {job.visibility ? ` · ${job.visibility}` : ""}
            </span>
          )}
          <Link
            href={`/jobs/${encodeURIComponent(slugOrId)}`}
            className="mt-1 inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#111c4c]"
          >
            View role
            <span className="ml-1 text-[11px]" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers & icons                                                     */
/* ------------------------------------------------------------------ */

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

function deriveWorkMode(job: { location: string | null; tags: string[] | null }) {
  const loc = (job.location || "").toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase());

  if (loc.includes("remote") || tags.includes("remote")) return "Remote";
  if (loc.includes("hybrid") || tags.includes("hybrid")) return "Hybrid";
  if (loc.includes("flexible") || tags.includes("flexible")) return "Flexible";
  if (loc.includes("on-site") || loc.includes("onsite")) return "On-site";

  return null;
}

function MetaItem({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string | null | undefined;
}) {
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-700">
      <span className="text-slate-500" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}

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

function IconBriefcaseBrown() {
  return (
    <svg
      className="h-3.5 w-3.5"
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
        stroke="#92400E"
        strokeWidth="1.3"
      />
      <path
        d="M7.5 6V5.4A1.9 1.9 0 0 1 9.4 3.5h1.2a1.9 1.9 0 0 1 1.9 1.9V6"
        stroke="#92400E"
        strokeWidth="1.3"
      />
      <path
        d="M3.5 9.5h4m5 0h4"
        stroke="#92400E"
        strokeWidth="1.1"
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

function IconStar() {
  return (
    <svg
      className="h-3.5 w-3.5 text-yellow-500"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="m10 3.2 1.54 3.12 3.44.5-2.49 2.43.59 3.47L10 11.6l-3.08 1.62.59-3.47L5.02 6.82l3.44-.5L10 3.2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Social icons */

function IconX() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M18.25 3H21L14.5 11.02 22 21h-5.5l-4.15-5.39L7.5 21H5l6.9-8.66L4 3h5.6l3.74 4.92L18.25 3Z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg
      className="h-3.5 w-3.5 text-[#0A66C2]"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8.32H4.7V24H.24V8.32zM8.44 8.32h4.29v2.13h.06c.6-1.14 2.07-2.35 4.26-2.35 4.55 0 5.39 3 5.39 6.89V24h-4.46v-7.26c0-1.73-.03-3.96-2.41-3.96-2.41 0-2.78 1.88-2.78 3.82V24H8.44V8.32z" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg
      className="h-3.5 w-3.5 text-[#25D366]"
      viewBox="0 0 32 32"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M16.01 5.08c-5.94 0-10.77 4.82-10.77 10.77 0 1.9.5 3.74 1.45 5.37L5 27l5.96-1.57a10.76 10.76 0 0 0 5.05 1.29h.01c5.94 0 10.77-4.83 10.77-10.77 0-2.88-1.12-5.59-3.16-7.63A10.7 10.7 0 0 0 16 5.08h.01Zm0 2.13c2.28 0 4.43.89 6.05 2.5a8.58 8.58 0 0 1 2.52 6.12c0 4.78-3.88 8.66-8.66 8.66-1.53 0-3.03-.4-4.35-1.17l-.31-.18-3.54.93.95-3.45-.2-.35a8.54 8.54 0 0 1-1.3-4.64c0-4.78 3.88-8.66 8.66-8.66Zm-4.25 3.47c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.12 3.05 1.27 3.26.16.21 2.19 3.5 5.35 4.76 2.65 1.05 3.19.84 3.76.79.57-.05 1.85-.76 2.11-1.49.26-.73.26-1.35.18-1.49-.08-.13-.29-.21-.6-.37-.31-.16-1.85-.91-2.14-1.01-.29-.11-.5-.16-.71.16-.21.31-.82 1.01-1.01 1.21-.18.21-.37.24-.68.08-.31-.16-1.31-.48-2.5-1.52-.92-.82-1.54-1.83-1.72-2.14-.18-.31-.02-.48.13-.63.13-.13.31-.34.47-.5.16-.16.21-.26.31-.45.1-.18.05-.34-.03-.5-.08-.16-.72-1.79-1-2.45-.26-.63-.53-.55-.74-.56Z" />
    </svg>
  );
}
