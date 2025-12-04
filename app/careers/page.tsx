import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Global careers marketplace",
  description:
    "Browse open roles across all companies hiring on ThinkATS.",
};

type CareersSearchParams = {
  q?: string | string[];
  location?: string | string[];
  tenant?: string | string[];
};

function asStringParam(
  value: string | string[] | undefined,
  fallback = "",
): string {
  if (!value) return fallback;
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value;
}

function normaliseStatus(status: string | null | undefined): string {
  return (status || "").toLowerCase();
}

export default async function CareersPage({
  searchParams,
}: {
  searchParams?: CareersSearchParams;
}) {
  const q = asStringParam(searchParams?.q);
  const locationFilter = asStringParam(searchParams?.location, "all");
  const tenantFilter = asStringParam(searchParams?.tenant, "all");

  // 1) Which tenants are allowed into the marketplace?
  const settings = await prisma.careerSiteSettings.findMany({
    where: {
      isPublic: true,
      includeInMarketplace: true,
      tenant: {
        status: "active",
      },
    },
    select: {
      tenantId: true,
    },
  });

  const tenantIds = Array.from(
    new Set(settings.map((s) => s.tenantId)),
  );

  // If nobody has opted into the marketplace yet, short-circuit
  if (tenantIds.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Roles on ThinkATS
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No tenants have published their roles to the global marketplace yet.
        </p>
      </div>
    );
  }

  // 2) Fetch public jobs from those tenants
  const jobs = await prisma.job.findMany({
    where: {
      tenantId: { in: tenantIds },
      visibility: "public",
    },
    include: {
      tenant: true,
      clientCompany: true,
      _count: {
        select: { applications: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 3) Derived lists for filters
  const distinctLocations = Array.from(
    new Set(
      jobs
        .map((job) => (job.location || "").trim())
        .filter((loc) => loc.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const distinctTenants = Array.from(
    new Map(
      jobs.map((job) => {
        const t = job.tenant;
        const key = t.slug || t.id;
        const label = t.name || t.slug || t.id;
        return [key, { key, label }];
      }),
    ).values(),
  ).sort((a, b) => a.label.localeCompare(b.label));

  // 4) Apply filters in memory
  const filteredJobs = jobs.filter((job) => {
    // only open roles
    const status = normaliseStatus(job.status as any);
    if (status === "closed") return false;

    if (locationFilter !== "all" && locationFilter) {
      const jobLoc = (job.location || "").trim();
      if (jobLoc !== locationFilter) return false;
    }

    if (tenantFilter !== "all" && tenantFilter) {
      const key = job.tenant.slug || job.tenant.id;
      if (key !== tenantFilter) return false;
    }

    if (q) {
      const haystack = (
        job.title +
        " " +
        (job.location || "") +
        " " +
        (job.department || "") +
        " " +
        (job.clientCompany?.name || "") +
        " " +
        (job.tenant.name || job.tenant.slug || "")
      )
        .toLowerCase()
        .trim();

      if (!haystack.includes(q.toLowerCase().trim())) return false;
    }

    return true;
  });

  const totalJobs = jobs.filter(
    (job) => normaliseStatus(job.status as any) !== "closed",
  ).length;
  const visibleJobs = filteredJobs.length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-8">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ThinkATS · Global marketplace
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Roles across all ThinkATS companies
        </h1>
        <p className="text-xs text-slate-600">
          Browse open roles from multiple organisations using ThinkATS. Each
          role is managed directly in the company&apos;s ATS workspace.
        </p>
      </header>

      {/* Summary strip */}
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-[11px] text-slate-600 shadow-sm">
        <div>
          <span className="text-[11px] font-medium text-slate-700">
            {visibleJobs}{" "}
            {visibleJobs === 1 ? "role" : "roles"} visible
          </span>
          {visibleJobs !== totalJobs && (
            <span className="ml-1 text-slate-500">
              (out of {totalJobs} open roles)
            </span>
          )}
        </div>
        <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" />
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
          <span>
            {distinctTenants.length} hiring{" "}
            {distinctTenants.length === 1 ? "company" : "companies"}
          </span>
          {distinctLocations.length > 0 && (
            <>
              <span className="text-slate-300">•</span>
              <span>
                Locations:{" "}
                {distinctLocations.join(", ")}
              </span>
            </>
          )}
        </div>
      </section>

      {/* Filters */}
      <form
        method="GET"
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-[11px] shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="q" className="sr-only">
              Search roles
            </label>
            <div className="relative">
              <input
                id="q"
                name="q"
                type="text"
                defaultValue={q}
                placeholder="Search by title, company, location..."
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px] text-slate-400">
                ⌕
              </span>
            </div>
          </div>

          {/* Location filter */}
          <div className="flex flex-wrap gap-2 sm:w-auto">
            <div>
              <label htmlFor="location" className="sr-only">
                Location
              </label>
              <select
                id="location"
                name="location"
                defaultValue={locationFilter || "all"}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="all">All locations</option>
                {distinctLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Tenant filter */}
            <div>
              <label htmlFor="tenant" className="sr-only">
                Company
              </label>
              <select
                id="tenant"
                name="tenant"
                defaultValue={tenantFilter || "all"}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="all">All companies</option>
                {distinctTenants.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-[#172965] px-3 py-2 text-xs font-medium text-white hover:bg-[#12204d]"
            >
              Apply filters
            </button>
          </div>
        </div>
      </form>

      {/* Jobs list */}
      {filteredJobs.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No roles match the current filters. Try clearing your search or
          broadening the location/company filters.
        </section>
      ) : (
        <section className="space-y-3">
          {filteredJobs.map((job) => {
            const applicationsCount =
              (job as any)._count?.applications ?? 0;

            const companyName =
              job.clientCompany?.name ||
              job.tenant.name ||
              job.tenant.slug ||
              "Hiring company";

            const jobUrl = job.slug
              ? `/jobs/${encodeURIComponent(job.slug)}`
              : `/jobs/${encodeURIComponent(job.id)}`;

            return (
              <article
                key={job.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-600 shadow-sm transition hover:border-[#172965]/70 hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={jobUrl}
                      className="truncate text-sm font-semibold text-slate-900 hover:text-[#172965] hover:underline"
                    >
                      {job.title}
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
                    <span className="font-medium text-slate-800">
                      {companyName}
                    </span>
                    {job.location && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{job.location}</span>
                      </>
                    )}
                    {job.employmentType && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{job.employmentType}</span>
                      </>
                    )}
                    {job.experienceLevel && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="capitalize">
                          {job.experienceLevel}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                    <span>
                      Posted{" "}
                      {new Date(job.createdAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      {applicationsCount}{" "}
                      {applicationsCount === 1
                        ? "application"
                        : "applications"}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={jobUrl}
                    className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#12204d]"
                  >
                    View & apply
                    <span className="ml-1 text-[10px]">↗</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
