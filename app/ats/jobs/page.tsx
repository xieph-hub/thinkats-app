// app/ats/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | ATS Jobs",
  description:
    "Job list view for all roles managed under the current ThinkATS tenant.",
};

interface JobsPageSearchParams {
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

export default async function AtsJobsPage({
  searchParams,
}: {
  searchParams?: JobsPageSearchParams;
}) {
  // -----------------------------
  // Resolve search params
  // -----------------------------
  const q = asStringParam(searchParams?.q);

  const statusFilter = asStringParam(searchParams?.status, "all");
  const statusFilterKey = (statusFilter || "all").toLowerCase();

  const visibilityFilter = asStringParam(searchParams?.visibility, "all");
  const visibilityFilterKey = (visibilityFilter || "all").toLowerCase();

  const locationFilter = asStringParam(searchParams?.location, "all");

  const clientFilter = asStringParam(searchParams?.clientId, "all");

  const tenantParam = asStringParam(searchParams?.tenantId, "");

  // -----------------------------
  // Resolve tenant
  // -----------------------------
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

  // -----------------------------
  // Load jobs for this tenant
  // -----------------------------
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

  // -----------------------------
  // Derived stats
  // -----------------------------
  const totalJobs = jobs.length;
  const openJobs = jobs.filter(
    (job) => normaliseJobStatus(job.status as any) === "open",
  ).length;
  const closedJobs = jobs.filter(
    (job) => normaliseJobStatus(job.status as any) === "closed",
  ).length;
  const totalApplications = jobs.reduce(
    (sum, job) => sum + (job._count?.applications ?? 0),
    0,
  );
  const publicJobs = jobs.filter(
    (job) => (job.visibility || "").toLowerCase() === "public",
  ).length;

  // -----------------------------
  // Filter option sets
  // -----------------------------
  const allLocations = Array.from(
    new Set(
      jobs
        .map((job) => (job.location || "").trim())
        .filter((loc) => loc.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const allVisibilities = Array.from(
    new Set(
      jobs
        .map((job) => (job.visibility || "").trim())
        .filter((v) => v.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const allClients = Array.from(
    new Map(
      jobs
        .filter((job) => job.clientCompany)
        .map((job) => {
          const client = job.clientCompany!;
          return [
            client.id,
            {
              id: client.id,
              name: client.name || "Client",
            },
          ];
        }),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  // -----------------------------
  // Apply filters in-memory
  // -----------------------------
  const filteredJobs = jobs.filter((job) => {
    let ok = true;

    // Status filter
    if (statusFilterKey !== "all") {
      const jobStatus = normaliseJobStatus(job.status as any);
      if (statusFilterKey === "open") {
        ok = ok && jobStatus === "open";
      } else if (statusFilterKey === "closed") {
        ok = ok && jobStatus === "closed";
      } else if (statusFilterKey === "draft") {
        ok = ok && jobStatus === "draft";
      }
    }

    // Visibility filter
    if (visibilityFilterKey !== "all") {
      const jobVis = (job.visibility || "").toLowerCase();
      ok = ok && jobVis === visibilityFilterKey;
    }

    // Location filter
    if (locationFilter !== "all") {
      const jobLoc = (job.location || "").trim();
      ok = ok && jobLoc === locationFilter;
    }

    // Client filter
    if (clientFilter !== "all") {
      const jobClientId = (job as any).clientCompanyId || job.clientCompany?.id;
      ok = ok && jobClientId === clientFilter;
    }

    // Search filter
    if (q) {
      const haystack = (
        job.title +
        " " +
        (job.location || "") +
        " " +
        (job.department || "") +
        " " +
        (job.clientCompany?.name || "")
      )
        .toLowerCase()
        .trim();

      if (!haystack.includes(q.toLowerCase().trim())) {
        ok = false;
      }
    }

    return ok;
  });

  const filteredCount = filteredJobs.length;

  // -----------------------------
  // URLs: clear filters + carry filters into pipeline
  // -----------------------------
  const clearFiltersHref = (() => {
    const url = new URL("/ats/jobs", "http://dummy");
    url.searchParams.set("tenantId", tenantId);
    return url.pathname + url.search;
  })();

  const baseSearch = new URLSearchParams();
  if (tenantId) baseSearch.set("tenantId", tenantId);
  if (q) baseSearch.set("q", q);
  if (statusFilterKey !== "all") baseSearch.set("status", statusFilter);
  if (visibilityFilterKey !== "all")
    baseSearch.set("visibility", visibilityFilter);
  if (locationFilter !== "all")
    baseSearch.set("location", locationFilter);
  if (clientFilter !== "all")
    baseSearch.set("clientId", clientFilter);

  const baseQueryString = baseSearch.toString();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS · Jobs
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Roles under{" "}
            <span className="font-semibold">
              {selectedTenant.name ??
                (selectedTenant as any).slug ??
                "Current tenant"}
            </span>
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Manage open, draft and closed roles, with quick access to
            pipelines and public job pages.
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

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Total jobs
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#172965]">
            {totalJobs}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {filteredCount !== totalJobs
              ? `${filteredCount} match current filters`
              : "All roles under this tenant"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Open roles
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {openJobs}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Currently accepting applications
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Applications (all time)
          </p>
          <p className="mt-2 text-2xl font-semibold text-blue-700">
            {totalApplications}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Across all roles under this tenant
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Public roles
          </p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">
            {publicJobs}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Visible on careers site / marketplace
          </p>
        </div>
      </div>

      {/* Filters */}
      <form
        method="GET"
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-[11px] shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        {/* Always carry tenantId in filters */}
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
                placeholder="Search by title, location, client..."
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px] text-slate-400">
                ⌕
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:w-auto">
            {/* Status filter */}
            <div>
              <label htmlFor="status" className="sr-only">
                Status filter
              </label>
              <select
                id="status"
                name="status"
                defaultValue={statusFilter || "all"}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Visibility filter */}
            <div>
              <label htmlFor="visibility" className="sr-only">
                Visibility filter
              </label>
              <select
                id="visibility"
                name="visibility"
                defaultValue={visibilityFilter || "all"}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="all">All visibilities</option>
                {allVisibilities.map((vis) => (
                  <option key={vis} value={vis.toLowerCase()}>
                    {titleCaseFromEnum(vis)}
                  </option>
                ))}
              </select>
            </div>

            {/* Location filter */}
            <div>
              <label htmlFor="location" className="sr-only">
                Location filter
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

            {/* Client filter */}
            <div>
              <label htmlFor="clientId" className="sr-only">
                Client filter
              </label>
              <select
                id="clientId"
                name="clientId"
                defaultValue={clientFilter || "all"}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="all">All clients</option>
                {allClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-[#172965] px-3 py-2 text-xs font-medium text-white hover:bg-[#12204d]"
            >
              Apply
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

      {/* Jobs list */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No jobs match the current filters. Adjust your search or remove
          some filters to see more of the portfolio.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const companyName =
              job.clientCompany?.name || "No client assigned";
            const location = job.location || "Location not specified";
            const createdAtLabel = formatDate(job.createdAt);
            const applicationsCount =
              (job._count?.applications as number | undefined) ?? 0;

            const pipelineUrl =
              baseQueryString.length > 0
                ? `/ats/jobs/${job.id}?${baseQueryString}`
                : `/ats/jobs/${job.id}`;

            const publicUrl = job.slug
              ? `/jobs/${encodeURIComponent(job.slug)}`
              : `/jobs/${encodeURIComponent(job.id)}`;

            const statusLabel = titleCaseFromEnum(job.status as any);
            const visibilityLabel = titleCaseFromEnum(
              job.visibility as any,
            );

            return (
              <article
                key={job.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-600 shadow-sm transition hover:border-[#172965]/70 hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={pipelineUrl}
                      className="truncate text-sm font-semibold text-slate-900 hover:text-[#172965] hover:underline"
                    >
                      {job.title || "Untitled role"}
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
                    <span className="font-medium text-slate-800">
                      {companyName}
                    </span>
                    {location && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{location}</span>
                      </>
                    )}
                    {createdAtLabel && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>Created {createdAtLabel}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                    {statusLabel && (
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 font-medium">
                        {statusLabel}
                      </span>
                    )}
                    {visibilityLabel && (
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 font-medium">
                        {visibilityLabel} visibility
                      </span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span>
                      {applicationsCount}{" "}
                      {applicationsCount === 1
                        ? "application"
                        : "applications"}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={pipelineUrl}
                      className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#12204d]"
                    >
                      View pipeline
                      <span className="ml-1 text-[10px]">↗</span>
                    </Link>
                    <Link
                      href={publicUrl}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Public job page
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
