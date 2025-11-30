// app/ats/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listTenantJobs } from "@/lib/jobs";
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
  tenantId?: string | string[];
  clientId?: string | string[];
  visibility?: string | string[];
  location?: string | string[];
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

  const rawLocation = searchParams?.location ?? "all";
  const locationFilter =
    Array.isArray(rawLocation) && rawLocation.length > 0
      ? rawLocation[0]
      : typeof rawLocation === "string"
      ? rawLocation
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

  // Distinct locations for filter
  const locations = Array.from(
    new Set(
      jobs
        .map((job: any) => (job.location as string | null) || "")
        .filter((loc) => loc.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

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

    if (locationFilter && locationFilter !== "all") {
      const jobLocation = (job.location as string | null) || "";
      ok = ok && jobLocation === locationFilter;
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
    (visibilityFilter && visibilityFilter !== "all") ||
    (locationFilter && locationFilter !== "all");

  const clearFiltersHref = (() => {
    const url = new URL("/ats/jobs", "http://dummy");
    url.searchParams.set("tenantId", selectedTenantId);
    return url.pathname + url.search;
  })();

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS · Jobs
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Roles & pipelines
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            All roles managed under{" "}
            <span className="font-medium text-slate-900">
              {selectedTenant.name ?? selectedTenant.slug ?? "Resourcin"}
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
              <input type="hidden" name="status" value={statusFilter} />
            )}
            {clientFilter && clientFilter !== "all" && (
              <input type="hidden" name="clientId" value={clientFilter} />
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
            href={`/ats/jobs/new?tenantId=${encodeURIComponent(
              selectedTenantId,
            )}`}
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#12204d]"
          >
            <span className="mr-1.5 text-sm">＋</span>
            New job
          </Link>
        </div>
      </div>

      {/* Quick stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

        <div className="rounded-2xl border border-slate-200 bg-white
