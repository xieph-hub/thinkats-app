// app/jobs/page.tsx

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type JobsPageProps = {
  searchParams?: {
    q?: string | string[];
    department?: string | string[];
    location?: string | string[];
    type?: string | string[];
  };
};

function normalizeParam(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0] : value;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const q = normalizeParam(searchParams?.q).trim();
  const departmentFilter = normalizeParam(searchParams?.department);
  const locationFilter = normalizeParam(searchParams?.location);
  const typeFilter = normalizeParam(searchParams?.type);

  // 1) Get all published jobs
  const jobs = await prisma.job.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      postedAt: "desc",
    },
  });

  // 2) Build filter options from existing jobs
  const departments = Array.from(
    new Set(jobs.map((job) => job.department).filter(Boolean))
  ).sort();
  const locations = Array.from(
    new Set(jobs.map((job) => job.location).filter(Boolean))
  ).sort();
  const types = Array.from(
    new Set(jobs.map((job) => job.type).filter(Boolean))
  ).sort();

  // 3) Apply filters + search in memory
  const filteredJobs = jobs.filter((job) => {
    // Department filter
    if (departmentFilter && job.department !== departmentFilter) {
      return false;
    }

    // Location filter
    if (locationFilter && job.location !== locationFilter) {
      return false;
    }

    // Type filter
    if (typeFilter && job.type !== typeFilter) {
      return false;
    }

    // Search filter
    if (q) {
      const haystack = (
        `${job.title} ${job.excerpt} ${job.department} ${job.location} ${job.type}`
      ).toLowerCase();
      if (!haystack.includes(q.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const totalJobs = jobs.length;
  const totalVisible = filteredJobs.length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#172965]">
            Resourcin · Opportunities
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Open roles
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Explore current mandates we&apos;re running for our clients and
            internal teams. Each role comes with clear expectations, reporting
            lines, and impact.
          </p>
        </header>

        {/* Filters + search */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium text-slate-700">
                {totalVisible} role{totalVisible === 1 ? "" : "s"} showing
                {totalJobs !== totalVisible
                  ? ` · filtered from ${totalJobs} total`
                  : ""}
              </p>
              <p className="text-[11px] text-slate-500">
                Use search and filters to narrow down by department, location or
                work type.
              </p>
            </div>

            {/* Search form (GET) */}
            <form className="w-full md:w-64" action="/jobs" method="get">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search by role, location..."
                className="w-full rounded-full border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#172965] focus:ring-2 focus:ring-[#172965]"
              />
              {/* Preserve other filters when searching */}
              {departmentFilter && (
                <input
                  type="hidden"
                  name="department"
                  value={departmentFilter}
                />
              )}
              {locationFilter && (
                <input type="hidden" name="location" value={locationFilter} />
              )}
              {typeFilter && (
                <input type="hidden" name="type" value={typeFilter} />
              )}
            </form>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-3 text-[11px]">
            {/* Department filter */}
            {departments.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="mr-1 text-slate-500">Department:</span>
                <FilterPill
                  label="All"
                  isActive={!departmentFilter}
                  href={{
                    q,
                    location: locationFilter,
                    type: typeFilter,
                    department: "",
                  }}
                />
                {departments.map((dept) => (
                  <FilterPill
                    key={dept}
                    label={dept}
                    isActive={departmentFilter === dept}
                    href={{
                      q,
                      location: locationFilter,
                      type: typeFilter,
                      department: dept,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Location filter */}
            {locations.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="mr-1 text-slate-500">Location:</span>
                <FilterPill
                  label="All"
                  isActive={!locationFilter}
                  href={{
                    q,
                    department: departmentFilter,
                    type: typeFilter,
                    location: "",
                  }}
                />
                {locations.map((loc) => (
                  <FilterPill
                    key={loc}
                    label={loc}
                    isActive={locationFilter === loc}
                    href={{
                      q,
                      department: departmentFilter,
                      type: typeFilter,
                      location: loc,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Type filter */}
            {types.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="mr-1 text-slate-500">Type:</span>
                <FilterPill
                  label="All"
                  isActive={!typeFilter}
                  href={{
                    q,
                    department: departmentFilter,
                    location: locationFilter,
                    type: "",
                  }}
                />
                {types.map((t) => (
                  <FilterPill
                    key={t}
                    label={t}
                    isActive={typeFilter === t}
                    href={{
                      q,
                      department: departmentFilter,
                      location: locationFilter,
                      type: t,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Jobs list */}
        <section className="space-y-3">
          {filteredJobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-500">
              No roles match these filters yet. Try clearing some filters or
              checking back later.
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.slug}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#172965] hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1.5">
                        <h2 className="text-sm font-semibold text-slate-900">
                          {job.title}
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          {job.department} · {job.location} · {job.type}
                        </p>
                        {job.excerpt && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {job.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-2 md:items-end">
                        {job.postedAt && (
                          <p className="text-[11px] text-slate-400">
                            Posted{" "}
                            {new Date(
                              job.postedAt
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}
                        <span className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1 text-[11px] font-medium text-white">
                          View role
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

/**
 * Small filter pill component
 */

type FilterHrefProps = {
  q: string;
  department?: string;
  location?: string;
  type?: string;
};

function buildFilterHref({ q, department, location, type }: FilterHrefProps) {
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (department) params.set("department", department);
  if (location) params.set("location", location);
  if (type) params.set("type", type);

  const query = params.toString();
  return query ? `/jobs?${query}` : "/jobs";
}

function FilterPill({
  label,
  isActive,
  href,
}: {
  label: string;
  isActive: boolean;
  href: FilterHrefProps;
}) {
  const url = buildFilterHref(href);
  return (
    <Link
      href={url}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 transition ${
        isActive
          ? "border-[#172965] bg-[#172965] text-white"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#172965] hover:text-[#172965]"
      }`}
    >
      {label}
    </Link>
  );
}
