// app/jobs/JobsExplorer.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { JobsTableRow } from "@/lib/jobs";

type Props = {
  initialJobs: JobsTableRow[];
};

type WorkModeFilter = "all" | "remote" | "hybrid" | "onsite" | "flexible";
type VisibilityFilter = "all" | "public" | "confidential";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://resourcin.com";

// Brand colours
const BRAND_BLUE = "#172965";
const BRAND_YELLOW = "#FFC000";
const BRAND_DARK_GREEN = "#306B34";
const BRAND_LIGHT_GREEN = "#64C247";

// Simple brand-ish SVG icons so no extra deps
function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      {...props}
    >
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        d="M7 8.5C7 7.67 6.33 7 5.5 7S4 7.67 4 8.5 4.67 10 5.5 10 7 9.33 7 8.5Zm.25 2.75H4.75V18h2.5v-6.75Zm3.5 0H8.25V18h2.5v-3.6c0-1.14.72-1.9 1.7-1.9 0.96 0 1.55.64 1.55 1.9V18h2.5v-4.02C16.5 11.16 15.34 10 13.7 10c-1.02 0-1.86.4-2.3 1.05v-.8Z"
        fill="white"
      />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      {...props}
    >
      <rect width="24" height="24" rx="4" fill="black" />
      <path
        d="M8 7.2L11.2 11l-3.4 5.8h1.9L12.4 12l3.1 3.8 1.5 1.8h2L15.2 12l3.1-4.8h-1.9L13.5 11 10.6 7.2z"
        fill="white"
      />
    </svg>
  );
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      {...props}
    >
      <rect width="24" height="24" rx="4" fill="#25D366" />
      <path
        d="M12 5.5A6.5 6.5 0 0 0 6 15.09L5.5 18l2.98-.53A6.5 6.5 0 1 0 12 5.5Zm0 1.5a5 5 0 1 1-2.12 9.52L8 16.7l.32-1.83A5 5 0 0 1 12 7Z"
        fill="white"
      />
      <path
        d="M10.3 10.05c.1-.22.19-.23.34-.23h.27c.09 0 .2-.03.31.15.11.18.37.45.4.48.03.04.06.06.03.11-.02.05-.15.18-.29.29-.04.03-.08.06-.12.1-.05.04-.1.08-.04.16.07.08.3.48.64.77.44.39.8.51.92.57.12.06.19.05.26-.04.07-.1.3-.35.38-.47.08-.11.16-.1.27-.06.11.04.7.33.82.39.12.06.2.09.23.14.03.05.03.29-.07.56-.1.28-.58.54-.81.55-.23.02-.46.09-1.56-.32-.9-.34-1.47-.86-1.7-1.1-.23-.24-.49-.5-.67-.83-.18-.32-.21-.57-.24-.64-.03-.07-.03-.47.07-.69Z"
        fill="white"
      />
    </svg>
  );
}

function formatWorkMode(mode?: JobsTableRow["work_mode"]) {
  if (!mode) return null;
  switch (mode) {
    case "remote":
      return "Remote";
    case "hybrid":
      return "Hybrid";
    case "onsite":
      return "On-site";
    case "flexible":
      return "Flexible";
    default:
      return mode;
  }
}

function formatPostedDate(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function buildShareUrls(job: JobsTableRow) {
  const slugOrId = job.slug ?? job.id;
  const url = `${SITE_URL.replace(/\/+$/, "")}/jobs/${slugOrId}`;
  const text = `${job.title} – via Resourcin`;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  return {
    url,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
  };
}

export default function JobsExplorer({ initialJobs }: Props) {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [workModeFilter, setWorkModeFilter] =
    useState<WorkModeFilter>("all");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("all");

  const uniqueLocations = useMemo(() => {
    const set = new Set(
      initialJobs
        .map((j) => j.location?.trim())
        .filter(Boolean) as string[]
    );
    return Array.from(set).sort();
  }, [initialJobs]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set(
      initialJobs
        .map((j) => j.department?.trim())
        .filter(Boolean) as string[]
    );
    return Array.from(set).sort();
  }, [initialJobs]);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return initialJobs.filter((job) => {
      if (q) {
        const haystack = [
          job.title,
          job.short_description ?? "",
          job.location ?? "",
          job.department ?? "",
          job.description ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      if (locationFilter !== "all") {
        if ((job.location ?? "").trim() !== locationFilter) return false;
      }

      if (departmentFilter !== "all") {
        if ((job.department ?? "").trim() !== departmentFilter) return false;
      }

      if (workModeFilter !== "all") {
        const wm = job.work_mode ?? null;
        if (wm !== workModeFilter) return false;
      }

      if (visibilityFilter !== "all") {
        if (job.visibility !== visibilityFilter) return false;
      }

      return true;
    });
  }, [
    initialJobs,
    search,
    locationFilter,
    departmentFilter,
    workModeFilter,
    visibilityFilter,
  ]);

  const totalCount = initialJobs.length;
  const filteredCount = filteredJobs.length;

  function resetFilters() {
    setSearch("");
    setLocationFilter("all");
    setDepartmentFilter("all");
    setWorkModeFilter("all");
    setVisibilityFilter("all");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      {/* Header */}
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#172965]/5 px-3 py-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BRAND_LIGHT_GREEN }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: BRAND_BLUE }}>
            Opportunities
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight md:text-4xl"
              style={{ color: BRAND_BLUE }}
            >
              Open roles via Resourcin.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-600">
              Mandates we&apos;re actively leading for founders, operators and
              HR leaders – from senior individual contributors to C-suite
              roles. Use the filters to zero in on function, location and work
              mode.
            </p>
          </div>
          <div className="rounded-xl border border-[#172965]/15 bg-white px-3 py-2 text-right text-xs shadow-sm">
            <div className="font-medium" style={{ color: BRAND_BLUE }}>
              {filteredCount} role{filteredCount === 1 ? "" : "s"} showing
            </div>
            <div className="text-[11px] text-gray-500">
              out of {totalCount} open mandate
              {totalCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </header>

      {/* Layout: sidebar + list */}
      <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
        {/* Sidebar filters */}
        <aside className="space-y-4 rounded-2xl border border-[#172965]/15 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: BRAND_BLUE }}>
              Filter roles
            </h2>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-medium text-gray-500 hover:text-[#172965]"
            >
              Clear all
            </button>
          </div>

          {/* Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">
              Search
            </label>
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, company, keyword..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-2 flex items-center text-xs text-gray-400 hover:text-[#172965]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">
              Location
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:bg-white"
            >
              <option value="all">All locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">
              Function / department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:bg-white"
            >
              <option value="all">All functions</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Work mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">
              Work mode
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { value: "all", label: "Any" },
                { value: "remote", label: "Remote" },
                { value: "hybrid", label: "Hybrid" },
                { value: "onsite", label: "On-site" },
                { value: "flexible", label: "Flexible" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setWorkModeFilter(opt.value as WorkModeFilter)
                  }
                  className={[
                    "rounded-lg border px-2 py-1 text-left",
                    workModeFilter === opt.value
                      ? "border-[#172965] bg-[#172965] text-white"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#172965]/40",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">
              Visibility
            </label>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { value: "all", label: "All" },
                { value: "public", label: "Public" },
                { value: "confidential", label: "Confidential" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setVisibilityFilter(opt.value as VisibilityFilter)
                  }
                  className={[
                    "rounded-full border px-3 py-1",
                    visibilityFilter === opt.value
                      ? "border-[#172965] bg-[#172965] text-white"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#172965]/40",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400">
              Confidential roles hide the client on the public board but are
              still fully managed by Resourcin.
            </p>
          </div>
        </aside>

        {/* Job cards */}
        <section className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              No roles match these filters.
              <br />
              Try widening your search or clearing filters.
            </div>
          ) : (
            filteredJobs.map((job) => {
              const isConfidential = job.visibility === "confidential";
              const href = job.slug ? `/jobs/${job.slug}` : `/jobs/${job.id}`;
              const workModeLabel = formatWorkMode(job.work_mode);
              const postedOn = formatPostedDate(job.created_at);
              const share = buildShareUrls(job);

              return (
                <article
                  key={job.id}
                  className="rounded-2xl border border-[#172965]/12 bg-white p-4 shadow-sm transition hover:border-[#172965] hover:shadow-md md:p-5"
                >
                  <div className="flex flex-col gap-4">
                    {/* Top row: title + (confidential badge) + posted date */}
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2
                            className="text-base font-semibold md:text-lg"
                            style={{ color: BRAND_BLUE }}
                          >
                            <Link href={href} className="hover:underline">
                              {job.title}
                            </Link>
                          </h2>

                          {/* Only show badge for confidential roles */}
                          {isConfidential && (
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                              style={{
                                backgroundColor: BRAND_YELLOW,
                                color: BRAND_BLUE,
                                borderColor: BRAND_YELLOW,
                                borderWidth: 1,
                              }}
                            >
                              Confidential search
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
                          {job.location && (
                            <span className="inline-flex items-center gap-1">
                              <span>📍</span>
                              <span>{job.location}</span>
                            </span>
                          )}
                          {workModeLabel && (
                            <span className="inline-flex items-center gap-1">
                              <span>💼</span>
                              <span>{workModeLabel}</span>
                            </span>
                          )}
                          {job.department && (
                            <span className="inline-flex items-center gap-1">
                              <span>🏷</span>
                              <span>{job.department}</span>
                            </span>
                          )}
                          {postedOn && (
                            <span className="inline-flex items-center gap-1">
                              <span>📅</span>
                              <span>Posted {postedOn}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Per-card share bar */}
                      <div className="flex flex-col items-start gap-1 text-xs text-gray-500 md:items-end">
                        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-500">
                          Share role
                        </span>
                        <div className="inline-flex items-center gap-1 rounded-full border border-[#172965]/20 bg-gray-50 px-2 py-1">
                          <a
                            href={share.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full p-1 hover:bg-white"
                            aria-label="Share on LinkedIn"
                          >
                            <LinkedInIcon />
                          </a>
                          <a
                            href={share.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full p-1 hover:bg-white"
                            aria-label="Share on X"
                          >
                            <XIcon />
                          </a>
                          <a
                            href={share.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full p-1 hover:bg-white"
                            aria-label="Share on WhatsApp"
                          >
                            <WhatsAppIcon />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    {job.short_description && (
                      <p className="max-w-3xl text-sm text-gray-600">
                        {job.short_description}
                      </p>
                    )}

                    {/* Footer: only CTA on the right now */}
                    <div className="flex items-center justify-end gap-3 pt-1">
                      <Link
                        href={href}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white"
                        style={{ backgroundColor: BRAND_BLUE }}
                      >
                        View role details
                        <span aria-hidden="true">↗</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
