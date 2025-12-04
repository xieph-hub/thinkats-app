// app/ats/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | ATS Jobs",
  description:
    "ATS job list for roles managed under the current ThinkATS tenant, with filters by status, visibility, client and location.",
};

interface AtsJobsPageSearchParams {
  q?: string | string[];
  status?: string | string[];
  visibility?: string | string[];
  location?: string | string[];
  clientId?: string | string[];
  tenantId?: string | string[];
}

function asStringParam(
  value: string | string[] | undefined,
  fallback = "",
): string {
  if (!value) return fallback;
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value;
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function titleCaseFromEnum(value?: string | null) {
  if (!value) return "";
  return value
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normaliseJobStatus(status: string | null | undefined) {
  return (status || "").toLowerCase();
}

function jobStatusBadgeClass(status?: string | null) {
  const key = normaliseJobStatus(status);
  if (key === "open") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (key === "closed") {
    return "bg-rose-50 text-rose-700 border-rose-100";
  }
  if (key === "draft") {
    return "bg-slate-50 text-slate-700 border-slate-200";
  }
  if (key === "archived") {
    return "bg-slate-100 text-slate-500 border-slate-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default async function AtsJobsPage({
  searchParams,
}: {
  searchParams?: AtsJobsPageSearchParams;
}) {
  // --------------------------------
  // Resolve search + filter params
  // --------------------------------
  const q = asStringParam(searchParams?.q, "");

  const statusFilter = asStringParam(searchParams?.status, "all");
  const statusFilterKey = statusFilter.toLowerCase();

  const visibilityFilter = asStringParam(searchParams?.visibility, "all");
  const visibilityFilterKey = visibilityFilter.toLowerCase();

  const locationFilter = asStringParam(searchParams?.location, "all");

  const clientFilter = asStringParam(searchParams?.clientId, "all");

  const tenantParam = asStringParam(searchParams?.tenantId, "");

  // --------------------------------
  // Tenant selection (same pattern as /ats/candidates)
  // --------------------------------
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
  });

  let selectedTenant =
    (tenantParam &&
      tenants.find(
        (t) => t.id === tenantParam || (t as any).slug === tenantParam,
      )) ||
    (await getResourcinTenant());

  if (!selectedTenant) {
    throw new Error("No default tenant found for ATS jobs.");
  }

  const tenantId = selectedTenant.id;

  // --------------------------------
  // Load jobs scoped by tenant
  // --------------------------------
  const jobs = await prisma.job.findMany({
    where: {
      tenantId,
    },
    include: {
      clientCompany: true,
      _count: {
        select: { applications: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalJobs = jobs.length;
  const openJobs = jobs.filter(
    (job) => normaliseJobStatus(job.status as any) === "open",
  ).length;
  const closedJobs = jobs.filter(
    (job) => normaliseJobStatus(job.status as any) === "closed",
  ).length;
  const draftJobs = jobs.filter(
    (job) => normaliseJobStatus(job.status as any) === "draft",
  ).length;

  const totalApplications = jobs.reduce(
    (sum, job) => sum + ((job as any)._count?.applications ?? 0),
    0,
  );

  // Distinct locations
  const allLocations = Array.from(
    new Set(
      jobs
        .map((job) => (job.location || "").trim())
        .filter((loc) => loc.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  // Distinct client companies
  const clientMap = new Map<
    string,
    {
      id: string;
      name: string;
    }
  >();

  let hasUnassignedClient = false;

  for (const job of jobs) {
    if (job.clientCompanyId && job.clientCompany) {
      clientMap.set(job.clientCompanyId, {
        id: job.clientCompanyId,
        name: job.clientCompany.name || "Unnamed client",
      });
    } else if (!job.clientCompanyId) {
      hasUnassignedClient = true;
    }
  }

  const clientOptions = Array.from(clientMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  // --------------------------------
  // Apply filters in-memory
  // --------------------------------
  let filteredJobs = jobs.filter((job) => {
    let ok = true;

    const jobStatus = normaliseJobStatus(job.status as any);
    const jobVisibility = (job.visibility || "").toLowerCase();
    const jobLocation = (job.location || "").trim();
    const jobClientId = (job as any).clientCompanyId as string | null;

    // Status filter
    if (statusFilterKey !== "all") {
      if (["open", "closed", "draft", "archived"].includes(statusFilterKey)) {
        ok = ok && jobStatus === statusFilterKey;
      } else if (statusFilterKey === "active") {
        ok = ok && jobStatus === "open";
      }
    }

    // Visibility filter
    if (visibilityFilterKey !== "all") {
      ok = ok && jobVisibility === visibilityFilterKey;
    }

    // Location filter
    if (locationFilter !== "all") {
      ok = ok && jobLocation === locationFilter;
    }

    // Client filter
    if (clientFilter !== "all") {
      if (clientFilter === "none") {
        ok = ok && jobClientId === null;
      } else {
        ok = ok && jobClientId === clientFilter;
      }
    }

    // Search
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
        (job.description || "") +
        " " +
        (job.overview || "")
      )
        .toLowerCase()
        .trim();

      if (!haystack.includes(q.toLowerCase().trim())) {
        ok = false;
      }
    }

    return ok;
  });

  const visibleJobs = filteredJobs.length;

  // Keep jobs sorted newest first
  filteredJobs = filteredJobs.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Clear filters link (preserve tenant)
  const clearFiltersHref = (() => {
    const url = new URL("/ats/jobs", "http://dummy");
    url.searchParams.set("tenantId", tenantId);
    return url.pathname + url.search;
  })();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS · Jobs
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Job list
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            All roles created under{" "}
            <span className="font-medium text-slate-900">
              {selectedTenant.name ??
                (selectedTenant as any).slug ??
                "Current tenant"}
            </span>
            . Filter by status, visibility, client and location.
          </p>
        </div>

        {/* Tenant selector */}
        <form method="GET" className="hidden items-center gap-2 sm:flex">
          {/* Preserve filters when switching tenant */}
          {q && <input type="hidden" name="q" value={q} />}
          {statusFilter && statusFilter !== "all" && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          {visibilityFilter && visibilityFilter !== "all" && (
            <input
              type="hidden"
              name="visibility"
              value={visibilityFilter}
            />
          )}
          {locationFilter && locationFilter !== "all" && (
            <input type="hidden" name="location" value={locationFilter} />
          )}
          {clientFilter && clientFilter !== "all" && (
            <input type="hidden" name="clientId" value={clientFilter} />
          )}

          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              Tenant
            </span>
            <select
              name="tenantId"
              defaultValue={tenantId}
              className="border-none bg-transparent text-[11px] text-slate-900 outline-none focus:ring-0"
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name ?? (tenant as any).slug ?? tenant.id}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="text-[11px] font-medium text-[#172965] hover:underline"
            >
              Switch
            </button>
          </div>
        </form>
      </div>

      {/* Summary strip */}
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-[11px] text-slate-600 shadow-sm">
        <div>
          <span className="text-[11px] font-medium text-slate-800">
            {visibleJobs}{" "}
            {visibleJobs === 1 ? "job" : "jobs"} visible
          </span>
          {visibleJobs !== totalJobs && (
            <span className="ml-1 text-slate-500">
              (out of {totalJobs} total)
            </span>
          )}
        </div>
        <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" />
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
          <span>{openJobs} open</span>
          <span className="text-slate-300">•</span>
          <span>{closedJobs} closed</span>
          {draftJobs > 0 && (
            <>
              <span className="text-slate-300">•</span>
              <span>{draftJobs} draft</span>
            </>
          )}
          <span className="text-slate-300">•</span>
          <span>{totalApplications} applications total</span>
        </div>
      </section>

      {/* Filters */}
      <form
        method="GET"
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-[11px] shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        {/* Keep tenantId when filtering */}
        <input type="hidden" name="tenantId" value={tenantId} />

        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="q" className="sr-only">
              Search jobs
            </label>
            <div className="relative">
              <input
                id="q"
                name="q"
                type="text"
                defaultValue={q}
                placeholder="Search by title, client, location, keywords..."
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px] text-slate-400">
                ⌕
              </span>
            </div>
          </div>

          {/* Filters cluster */}
          <div className="flex flex-wrap items-center gap-2 sm:w-auto">
            {/* Status */}
            <div>
              <label htmlFor="status" className="sr-only">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={statusFilter || "all"}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label htmlFor="visibility" className="sr-only">
                Visibility
              </label>
              <select
                id="visibility"
                name="visibility"
                defaultValue={visibilityFilter || "all"}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="all">All visibilities</option>
                <option value="public">Public</option>
                <option value="internal">Internal</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* Location */}
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
                {allLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Client */}
            <div>
              <label htmlFor="clientId" className="sr-only">
                Client
              </label>
              <select
                id="clientId"
                name="clientId"
                defaultValue={clientFilter || "all"}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="all">All clients</option>
                {clientOptions.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
                {hasUnassignedClient && (
                  <option value="none">No client (unassigned)</option>
                )}
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

        {statusFilterKey !== "all" ||
        visibilityFilterKey !== "all" ||
        locationFilter !== "all" ||
        clientFilter !== "all" ||
        !!q ? (
          <Link
            href={clearFiltersHref}
            className="text-[11px] text-slate-500 hover:text-slate-800"
          >
            Clear filters
          </Link>
        ) : null}
      </form>

      {/* Job list */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No jobs match the current filters. Adjust your search or remove
          some filters to see more roles.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const statusLabel = titleCaseFromEnum(job.status as any) || "–";
            const visibilityLabel =
              titleCaseFromEnum(job.visibility as any) || "–";
            const createdLabel = formatDate(job.createdAt);
            const applicationsCount =
              (job as any)._count?.applications ?? 0;
            const clientName =
              job.clientCompany?.name || "No client assigned";
            const location = job.location || "Location not specified";

            const pipelineUrl = `/ats/jobs/${job.id}`;
            const publicUrl = job.slug
              ? `/jobs/${encodeURIComponent(job.slug)}`
              : `/jobs/${encodeURIComponent(job.id)}`;

            return (
              <article
                key={job.id}
                className="flex items-stretch justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-600 shadow-sm transition hover:border-[#172965]/70 hover:shadow-md"
              >
                {/* Left: job meta */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={pipelineUrl}
                      className="truncate text-sm font-semibold text-slate-900 hover:text-[#172965] hover:underline"
                    >
                      {job.title || "Untitled role"}
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                    <span className="font-medium text-slate-800">
                      {clientName}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>{location}</span>
                    {job.department && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{job.department}</span>
                      </>
                    )}
                    {job.employmentType && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{titleCaseFromEnum(job.employmentType)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                    {createdLabel && (
                      <>
                        <span>Created {createdLabel}</span>
                        <span className="text-slate-300">•</span>
                      </>
                    )}
                    <span>
                      {applicationsCount}{" "}
                      {applicationsCount === 1
                        ? "application"
                        : "applications"}
                    </span>
                  </div>
                </div>

                {/* Right: status + actions */}
                <div className="flex shrink-0 flex-col items-end justify-between gap-2 text-right text-[11px]">
                  <div className="flex flex-wrap justify-end gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${jobStatusBadgeClass(
                        job.status as any,
                      )}`}
                    >
                      {statusLabel}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-700">
                      {visibilityLabel} visibility
                    </span>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={pipelineUrl}
                      className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#12204d]"
                    >
                      View pipeline
                    </Link>
                    <Link
                      href={publicUrl}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Public page ↗
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
