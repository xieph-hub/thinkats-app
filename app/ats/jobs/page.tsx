// app/ats/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listTenantJobs } from "@/lib/jobs";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ATS | Jobs | Resourcin",
  description:
    "Admin view of all open and draft roles managed by Resourcin and its clients.",
};

interface JobsPageSearchParams {
  q?: string | string[];
  status?: string | string[];
  tenantId?: string | string[];
  clientId?: string | string[];
  visibility?: string | string[];
}

function normaliseStatus(status: string | null | undefined) {
  return (status || "").toLowerCase();
}

function statusLabel(status: string | null | undefined): string {
  const s = normaliseStatus(status);
  if (s === "open") return "Open";
  if (s === "draft") return "Draft";
  if (s === "on_hold" || s === "on-hold") return "On hold";
  if (s === "closed") return "Closed";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown";
}

function statusBadgeClass(status: string | null | undefined): string {
  const s = normaliseStatus(status);
  if (s === "open") {
    return "bg-[#E9F7EE] text-[#306B34] border-[#C5E7CF]";
  }
  if (s === "draft") {
    return "bg-slate-50 text-slate-600 border-slate-200";
  }
  if (s === "on_hold" || s === "on-hold") {
    return "bg-[#FFF7DF] text-[#9A7300] border-[#FFE299]";
  }
  if (s === "closed") {
    return "bg-red-50 text-red-700 border-red-100";
  }
  return "bg-slate-50 text-slate-600 border-slate-200";
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

  const rawTenant = searchParams?.tenantId ?? "";
  const tenantParam =
    Array.isArray(rawTenant) && rawTenant.length > 0
      ? rawTenant[0]
      : typeof rawTenant === "string"
        ? rawTenant
        : "";

  const rawClient = searchParams?.clientId ?? "all";
  const clientFilter =
    Array.isArray(rawClient) && rawClient.length > 0
      ? rawClient[0]
      : typeof rawClient === "string"
        ? rawClient
        : "all";

  const rawVisibility = searchParams?.visibility ?? "all";
  const visibilityFilter =
    Array.isArray(rawVisibility) && rawVisibility.length > 0
      ? rawVisibility[0]
      : typeof rawVisibility === "string"
        ? rawVisibility
        : "all";

  // -----------------------------
  // Load tenants + resolve current tenant
  // -----------------------------
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
  });

  let selectedTenant =
    (tenantParam &&
      tenants.find(
        (t) => t.id === tenantParam || t.slug === tenantParam,
      )) ||
    (await getResourcinTenant());

  if (!selectedTenant) {
    throw new Error("No default tenant found.");
  }

  const selectedTenantId = selectedTenant.id;

  // -----------------------------
  // Load jobs + client companies for this tenant
  // -----------------------------
  const [jobs, clientCompanies] = await Promise.all([
    listTenantJobs(selectedTenantId),
    prisma.clientCompany.findMany({
      where: { tenantId: selectedTenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // -----------------------------
  // Filter jobs
  // -----------------------------
  const filteredJobs = jobs.filter((job: any) => {
    let ok = true;

    if (statusFilter && statusFilter !== "all") {
      ok =
        ok &&
        normaliseStatus(job.status as any) === statusFilter.toLowerCase();
    }

    if (clientFilter && clientFilter !== "all") {
      ok = ok && job.clientCompanyId === clientFilter;
    }

    if (visibilityFilter && visibilityFilter !== "all") {
      const v = ((job.visibility as string | null) || "internal").toLowerCase();
      if (visibilityFilter === "public") {
        ok = ok && v === "public";
      } else if (visibilityFilter === "internal") {
        ok = ok && v === "internal";
      }
    }

    if (q) {
      const haystack = (
        job.title +
        " " +
        (job.location || "") +
        " " +
        (job.department || "") +
        " " +
        (job.clientCompany?.name || "")
      ).toLowerCase();
      ok = ok && haystack.includes(q.toLowerCase());
    }

    return ok;
  });

  const totalJobs = jobs.length;
  const openJobs = jobs.filter(
    (job: any) => normaliseStatus(job.status as any) === "open",
  ).length;
  const draftJobs = jobs.filter(
    (job: any) => normaliseStatus(job.status as any) === "draft",
  ).length;
  const totalApplications = jobs.reduce(
    (sum: number, job: any) => sum + (job._count?.applications ?? 0),
    0,
  );
  const activeJobsWithApps = jobs.filter(
    (job: any) => (job._count?.applications ?? 0) > 0,
  ).length;

  const hasFilters =
    !!q ||
    (statusFilter && statusFilter !== "all") ||
    (clientFilter && clientFilter !== "all") ||
    (visibilityFilter && visibilityFilter !== "all");

  const clearFiltersHref = (() => {
    const url = new URL("/ats/jobs", "http://dummy");
    url.searchParams.set("tenantId", selectedTenantId);
    return url.pathname + url.search;
  })();

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-0">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            ThinkATS · Jobs
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            All roles managed under{" "}
            <span className="font-medium text-slate-900">
              {selectedTenant.name ??
                selectedTenant.slug ??
                "Resourcin"}
            </span>
            . Create, publish and monitor pipelines from here.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Multi-tenant selector */}
          <form method="GET" className="flex items-center gap-2">
            {/* preserve search + filters when switching tenant */}
            {q && <input type="hidden" name="q" value={q} />}
            {statusFilter && statusFilter !== "all" && (
              <input
                type="hidden"
                name="status"
                value={statusFilter}
              />
            )}
            {clientFilter && clientFilter !== "all" && (
              <input
                type="hidden"
                name="clientId"
                value={clientFilter}
              />
            )}
            {visibilityFilter && visibilityFilter !== "all" && (
              <input
                type="hidden"
                name="visibility"
                value={visibilityFilter}
              />
            )}

            <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 sm:flex">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">
                Tenant
              </span>
              <select
                name="tenantId"
                defaultValue={selectedTenantId}
                className="border-none bg-transparent text-[11px] text-slate-900 outline-none focus:ring-0"
              >
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name ?? tenant.slug ?? tenant.id}
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

          <Link
            href={`/ats/jobs/new?tenantId=${encodeURIComponent(selectedTenantId)}`}
            className="inline-flex items-center rounded-md bg-[#172965] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#12204d]"
          >
            <span className="mr-1.5 text-sm">＋</span>
            New job
          </Link>
        </div>
      </div>

      {/* Quick stats cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Open jobs
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#172965]">
            {openJobs}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {totalJobs} total in this tenant
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Draft roles
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {draftJobs}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Ready to review and publish
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Total applications
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#306B34]">
            {totalApplications}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Across all non-closed jobs
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Active pipelines
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#64C247]">
            {activeJobsWithApps}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Jobs with at least one candidate
          </p>
        </div>
      </div>

      {/* Search + filters (GET) */}
      <form
        method="GET"
        className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        {/* Keep tenantId in all filter submits */}
        <input
          type="hidden"
          name="tenantId"
          value={selectedTenantId}
        />

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
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg:white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="draft">Draft</option>
                <option value="on_hold">On hold</option>
                <option value="closed">Closed</option>
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
                {clientCompanies.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
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
                <option value="public">Public only</option>
                <option value="internal">Internal only</option>
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

        {hasFilters && (
          <Link
            href={clearFiltersHref}
            className="text-[11px] text-slate-500 hover:text-slate-800"
          >
            Clear filters
          </Link>
        )}
      </form>

      {/* Bulk actions + jobs list (POST) */}
      <form
        id="jobs-actions-form"
        method="POST"
        action="/ats/jobs/actions"
        className="space-y-3"
      >
        {/* Preserve context on redirect */}
        <input
          type="hidden"
          name="tenantId"
          value={selectedTenantId}
        />
        <input type="hidden" name="q" value={q} />
        <input
          type="hidden"
          name="status"
          value={statusFilter}
        />
        <input
          type="hidden"
          name="clientId"
          value={clientFilter}
        />
        <input
          type="hidden"
          name="visibility"
          value={visibilityFilter}
        />

        {/* Bulk controls */}
        <div className="mb-2 flex flex-col items-start justify-between gap-2 rounded-xl border border-slate-200 bg-[#F7F7FB] px-3 py-2 text-[11px] text-slate-600 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <select
              name="bulkAction"
              defaultValue=""
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            >
              <option value="">Bulk actions…</option>
              <option value="publish">
                Publish to careers site
              </option>
              <option value="unpublish">
                Unpublish from careers site
              </option>
              <option value="close">Close roles</option>
              <option value="duplicate">Duplicate roles</option>
              <option value="delete">Delete roles</option>
            </select>

            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-[#172965] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#12204d]"
            >
              Run
            </button>

            <span className="text-[11px] text-slate-500">
              Bulk actions apply to all selected jobs.
            </span>
          </div>

          <span className="text-[11px] text-slate-500">
            Tick the checkbox next to each role to include it in
            bulk updates.
          </span>
        </div>

        {/* Jobs list */}
        {filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No jobs match the current filters. Try adjusting your
            search or status.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job: any) => {
              const s = normaliseStatus(job.status);
              const statusText = statusLabel(job.status);
              const applicationsCount =
                job._count?.applications ?? 0;
              const isPublished = job.isPublished === true;
              const isOpen = s === "open";

              return (
                <div
                  key={job.id}
                  className="flex items-stretch justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-[#172965]/70 hover:shadow-md"
                >
                  {/* Left: checkbox + job meta */}
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="mt-1 flex shrink-0 items-start">
                      <input
                        type="checkbox"
                        name="jobIds"
                        value={job.id}
                        className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
                        aria-label={`Select ${job.title}`}
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/ats/jobs/${job.id}`}
                          className="truncate text-sm font-semibold text-slate-900 hover:text-[#172965] hover:underline"
                        >
                          {job.title}
                        </Link>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(
                            job.status,
                          )}`}
                        >
                          {statusText}
                        </span>
                        {isPublished && (
                          <span className="inline-flex items-center rounded-full border border-[#C5E7CF] bg-[#E9F7EE] px-2 py-0.5 text-[10px] font-medium text-[#306B34]">
                            Published
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-600">
                        <span className="font-medium text-slate-800">
                          {job.clientCompany?.name ??
                            "Resourcin client"}
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

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>
                          Created{" "}
                          {new Date(
                            job.createdAt,
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>

                        {job.visibility && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="capitalize">
                              {job.visibility === "public"
                                ? "Public career site"
                                : "Internal only"}
                            </span>
                          </>
                        )}

                        {job.internalOnly && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>Internal posting</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: pipeline summary */}
                  <div className="hidden shrink-0 flex-col items-end justify-center text-right text-[11px] text-slate-600 sm:flex">
                    <div className="font-medium text-slate-900">
                      {applicationsCount}{" "}
                      {applicationsCount === 1
                        ? "candidate"
                        : "candidates"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      Pipeline view
                      <span className="mx-1">·</span>
                      <Link
                        href={`/ats/jobs/${job.id}`}
                        className="text-[#172965] hover:underline"
                      >
                        Open board
                      </Link>
                    </div>
                  </div>

                  {/* Right: 3-dot menu wired to real actions */}
                  <div className="flex shrink-0 items-start">
                    <div className="group relative">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Job actions"
                      >
                        <svg
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                          className="h-4 w-4"
                        >
                          <circle cx="4" cy="10" r="1.5" />
                          <circle cx="10" cy="10" r="1.5" />
                          <circle cx="16" cy="10" r="1.5" />
                        </svg>
                      </button>

                      <div className="pointer-events-none absolute right-0 z-10 mt-2 hidden min-w-[190px] flex-col rounded-md border border-slate-200 bg-white p-1 text-[11px] text-slate-700 shadow-lg group-hover:pointer-events-auto group-hover:flex">
                        <Link
                          href={`/ats/jobs/${job.id}`}
                          className="w-full rounded px-2 py-1.5 text-left hover:bg-slate-50"
                        >
                          View pipeline
                        </Link>

                        <Link
                          href={`/ats/jobs/${job.id}/edit`}
                          className="w-full rounded px-2 py-1.5 text-left hover:bg-slate-50"
                        >
                          Edit details
                        </Link>

                        {isPublished ? (
                          <button
                            type="submit"
                            name="singleAction"
                            value={`unpublish:${job.id}`}
                            className="w-full rounded px-2 py-1.5 text-left hover:bg-slate-50"
                          >
                            Unpublish from careers site
                          </button>
                        ) : (
                          <button
                            type="submit"
                            name="singleAction"
                            value={`publish:${job.id}`}
                            className="w-full rounded px-2 py-1.5 text-left hover:bg-slate-50"
                          >
                            Publish to careers site
                          </button>
                        )}

                        {isOpen && (
                          <button
                            type="submit"
                            name="singleAction"
                            value={`close:${job.id}`}
                            className="w-full rounded px-2 py-1.5 text-left text-red-700 hover:bg-red-50"
                          >
                            Close role
                          </button>
                        )}

                        <button
                          type="submit"
                          name="singleAction"
                          value={`duplicate:${job.id}`}
                          className="w-full rounded px-2 py-1.5 text-left hover:bg-slate-50"
                        >
                          Duplicate
                        </button>

                        <button
                          type="submit"
                          name="singleAction"
                          value={`delete:${job.id}`}
                          className="w-full rounded px-2 py-1.5 text-left text-red-700 hover:bg-red-50"
                        >
                          Delete role
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </form>
    </div>
  );
}
