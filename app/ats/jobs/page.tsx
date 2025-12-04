// app/ats/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | ATS Jobs",
  description:
    "Admin view of all open and draft roles managed under the current ThinkATS tenant.",
};

interface JobsPageSearchParams {
  q?: string | string[];
  status?: string | string[];
  visibility?: string | string[];
  clientId?: string | string[];
  location?: string | string[];
  tenantId?: string | string[];
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

function jobStatusBadgeClass(status?: string | null) {
  const key = (status || "").toLowerCase();
  if (key === "open") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (key === "draft") {
    return "bg-slate-50 text-slate-700 border-slate-200";
  }
  if (key === "closed") {
    return "bg-slate-100 text-slate-600 border-slate-200";
  }
  if (key === "paused") {
    return "bg-amber-50 text-amber-800 border-amber-100";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function jobVisibilityBadgeClass(visibility?: string | null) {
  const key = (visibility || "").toLowerCase();
  if (key === "public") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }
  if (key === "internal") {
    return "bg-slate-50 text-slate-700 border-slate-200";
  }
  if (key === "hidden" || key === "private") {
    return "bg-slate-900 text-slate-50 border-slate-900";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default async function AtsJobsPage({
  searchParams,
}: {
  searchParams?: JobsPageSearchParams;
}) {
  // -----------------------------
  // Resolve search params
  // -----------------------------
  const rawQ = searchParams?.q ?? "";
  const q =
    Array.isArray(rawQ) && rawQ.length > 0
      ? rawQ[0]
      : typeof rawQ === "string"
      ? rawQ
      : "";

  const rawStatus = searchParams?.status ?? "all";
  const statusFilter =
    Array.isArray(rawStatus) && rawStatus.length > 0
      ? rawStatus[0]
      : typeof rawStatus === "string"
      ? rawStatus
      : "all";
  const statusFilterKey = (statusFilter || "all").toLowerCase();

  const rawVisibility = searchParams?.visibility ?? "all";
  const visibilityFilter =
    Array.isArray(rawVisibility) && rawVisibility.length > 0
      ? rawVisibility[0]
      : typeof rawVisibility === "string"
      ? rawVisibility
      : "all";
  const visibilityFilterKey = (visibilityFilter || "all").toLowerCase();

  const rawClientId = searchParams?.clientId ?? "all";
  const clientFilter =
    Array.isArray(rawClientId) && rawClientId.length > 0
      ? rawClientId[0]
      : typeof rawClientId === "string"
      ? rawClientId
      : "all";

  const rawLocation = searchParams?.location ?? "all";
  const locationFilter =
    Array.isArray(rawLocation) && rawLocation.length > 0
      ? rawLocation[0]
      : typeof rawLocation === "string"
      ? rawLocation
      : "all";

  const rawTenant = searchParams?.tenantId ?? "";
  const tenantParam =
    Array.isArray(rawTenant) && rawTenant.length > 0
      ? rawTenant[0]
      : typeof rawTenant === "string"
      ? rawTenant
      : "";

  // -----------------------------
  // Tenant resolution
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
    throw new Error("No default tenant found.");
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
        select: {
          applications: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  // For metrics we also need applications time window
  const applicationsLast30Days = await prisma.jobApplication.count({
    where: {
      job: {
        tenantId,
      },
      createdAt: {
        gte: new Date(now - THIRTY_DAYS),
      },
    },
  });

  const totalJobs = jobs.length;
  const openJobs = jobs.filter((j) => (j.status || "").toLowerCase() === "open")
    .length;
  const avgApplicationsPerOpenJob =
    openJobs > 0 ? applicationsLast30Days / openJobs : 0;

  // Distinct filters from job list
  const allLocations = Array.from(
    new Set(jobs.map((j: any) => j.location).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const allClients = Array.from(
    new Map(
      jobs
        .filter((j: any) => j.clientCompany)
        .map((j: any) => [
          j.clientCompany.id,
          {
            id: j.clientCompany.id as string,
            name:
              j.clientCompany.name ||
              (j.clientCompany as any).slug ||
              "Unnamed client",
          },
        ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const allStatuses = Array.from(
    new Set(
      jobs
        .map((j: any) => (j.status as string | null) || "")
        .filter((s) => s && s.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const allVisibilities = Array.from(
    new Set(
      jobs
        .map((j: any) => (j.visibility as string | null) || "")
        .filter((s) => s && s.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  // -----------------------------
  // Apply filters in-memory
  // -----------------------------
  const filteredJobs = jobs.filter((job: any) => {
    let ok = true;

    // Status filter
    if (statusFilterKey !== "all") {
      ok =
        ok &&
        (job.status || "").toLowerCase() === statusFilterKey;
    }

    // Visibility filter
    if (visibilityFilterKey !== "all") {
      ok =
        ok &&
        (job.visibility || "").toLowerCase() === visibilityFilterKey;
    }

    // Client filter
    if (clientFilter !== "all") {
      ok =
        ok &&
        job.clientCompany &&
        job.clientCompany.id === clientFilter;
    }

    // Location filter
    if (locationFilter !== "all") {
      ok = ok && job.location === locationFilter;
    }

    // Search
    if (q) {
      const haystack = (
        (job.title || "") +
        " " +
        (job.location || "") +
        " " +
        (job.clientCompany?.name || "") +
        " " +
        (job.employmentType || "")
      ).toLowerCase();
      ok = ok && haystack.includes(q.toLowerCase());
    }

    return ok;
  });

  const filteredCount = filteredJobs.length;

  const clearFiltersHref = (() => {
    const url = new URL("/ats/jobs", "http://dummy");
    url.searchParams.set("tenantId", tenantId);
    return url.pathname + url.search;
  })();

  // Helper: build querystring to hand off to pipeline
  function buildPipelineHref(jobId: string) {
    const qs = new URLSearchParams();
    qs.set("tenantId", tenantId);

    if (q) qs.set("q", q);
    if (statusFilterKey !== "all") qs.set("status", statusFilterKey);
    if (visibilityFilterKey !== "all") qs.set("visibility", visibilityFilterKey);
    if (clientFilter !== "all") qs.set("clientId", clientFilter);
    if (locationFilter !== "all") qs.set("location", locationFilter);

    const queryString = qs.toString();
    return queryString ? `/ats/jobs/${jobId}?${queryString}` : `/ats/jobs/${jobId}`;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS · Jobs
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Roles & pipelines
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            All roles currently managed under{" "}
            <span className="font-medium text-slate-900">
              {selectedTenant.name ?? (selectedTenant as any).slug ?? "Resourcin"}
            </span>
            . Use filters to focus on open roles, specific clients or locations.
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
            <input type="hidden" name="visibility" value={visibilityFilter} />
          )}
          {clientFilter && clientFilter !== "all" && (
            <input type="hidden" name="clientId" value={clientFilter} />
          )}
          {locationFilter && locationFilter !== "all" && (
            <input type="hidden" name="location" value={locationFilter} />
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

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Open jobs
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#172965]">
            {openJobs}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Currently accepting applications.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Total jobs
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {totalJobs}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            All time under this tenant.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Applications (30 days)
          </p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">
            {applicationsLast30Days}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            New applications across all roles.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Avg. apps / open job
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {openJobs > 0 ? avgApplicationsPerOpenJob.toFixed(1) : "–"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Based on the last 30 days.
          </p>
        </div>
      </div>

      {/* Filters */}
      <form
        method="GET"
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        {/* Keep tenantId when filtering */}
        <input type="hidden" name="tenantId" value={tenantId} />

        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
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
                placeholder="Search by title, client, location..."
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
                {allStatuses.map((s) => (
                  <option key={s} value={s.toLowerCase()}>
                    {titleCaseFromEnum(s)}
                  </option>
                ))}
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
                {allVisibilities.map((v) => (
                  <option key={v} value={v.toLowerCase()}>
                    {titleCaseFromEnum(v)}
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
        clientFilter !== "all" ||
        locationFilter !== "all" ||
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
          No jobs match the current filters. Adjust your search or clear some
          filters to see more roles.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job: any) => {
            const statusLabel = titleCaseFromEnum(job.status);
            const visibilityLabel = titleCaseFromEnum(job.visibility);
            const clientName =
              job.clientCompany?.name ||
              (job.clientCompany as any)?.slug ||
              "No client set";
            const createdAtLabel = formatDate(job.createdAt);
            const appsCount = job._count?.applications ?? 0;

            const publicJobPath = job.slug
              ? `/jobs/${encodeURIComponent(job.slug)}`
              : `/jobs/${encodeURIComponent(job.id)}`;

            const pipelineHref = buildPipelineHref(job.id);

            return (
              <div
                key={job.id}
                className="flex items-stretch justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-[#172965]/70 hover:shadow-md"
              >
                {/* Left: role meta */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {job.title || "Untitled role"}
                    </span>
                    <span className="truncate text-[11px] text-slate-500">
                      {clientName}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                    <span className="font-medium text-slate-800">
                      {job.location || "Location not set"}
                    </span>
                    {job.employmentType && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{titleCaseFromEnum(job.employmentType)}</span>
                      </>
                    )}
                    {createdAtLabel && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>Created {createdAtLabel}</span>
                      </>
                    )}
                    <span className="text-slate-300">•</span>
                    <span>
                      {appsCount}{" "}
                      {appsCount === 1 ? "application" : "applications"}
                    </span>
                  </div>
                </div>

                {/* Right: status, visibility, actions */}
                <div className="flex shrink-0 flex-col items-end justify-between gap-2 text-right text-[11px] text-slate-600">
                  <div className="flex flex-wrap justify-end gap-2">
                    {job.status && (
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${jobStatusBadgeClass(
                          job.status,
                        )}`}
                      >
                        {statusLabel || "Status not set"}
                      </span>
                    )}
                    {job.visibility && (
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${jobVisibilityBadgeClass(
                          job.visibility,
                        )}`}
                      >
                        {visibilityLabel || "Visibility not set"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={pipelineHref}
                      className="text-[11px] font-medium text-[#172965] hover:underline"
                    >
                      View pipeline
                    </Link>
                    <Link
                      href={publicJobPath}
                      className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline"
                    >
                      View public page ↗
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
