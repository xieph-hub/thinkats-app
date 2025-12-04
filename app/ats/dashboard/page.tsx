import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | ATS Dashboard",
  description:
    "Overview of jobs, candidates and applications across a tenant in ThinkATS.",
};

type DashboardSearchParams = {
  tenantId?: string | string[];
};

function asString(
  value: string | string[] | undefined,
  fallback = "",
): string {
  if (!value) return fallback;
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AtsDashboardPage({
  searchParams,
}: {
  searchParams?: DashboardSearchParams;
}) {
  const tenantParam = asString(searchParams?.tenantId);

  // 1) Load all tenants – super admin can switch between them
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
  });

  if (tenants.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          ThinkATS dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No tenants have been created yet. Once you add a tenant and start
          posting jobs, this dashboard will show activity and pipeline metrics.
        </p>
      </div>
    );
  }

  const selectedTenant =
    tenants.find(
      (t) => t.id === tenantParam || (t as any).slug === tenantParam,
    ) ?? tenants[0];

  const selectedTenantId = selectedTenant.id;
  const tenantName =
    selectedTenant.name || (selectedTenant as any).slug || selectedTenant.id;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // 2) Jobs, candidates and applications for this tenant
  const [jobs, totalCandidates, recentApplications] = await Promise.all([
    prisma.job.findMany({
      where: { tenantId: selectedTenantId },
      include: {
        clientCompany: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.candidate.count({
      where: { tenantId: selectedTenantId },
    }),
    prisma.jobApplication.findMany({
      where: {
        job: { tenantId: selectedTenantId },
        createdAt: {
          gte: thirtyDaysAgo,
          lte: now,
        },
      },
      include: {
        job: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const openJobs = jobs.filter(
    (job) => (job.status || "").toLowerCase() === "open",
  );
  const openJobsCount = openJobs.length;

  const applicationsLast30Days = recentApplications.length;
  const avgApplicationsPerOpenJob =
    openJobsCount > 0 ? applicationsLast30Days / openJobsCount : 0;

  const recentJobs = jobs.slice(0, 5);
  const recentAppsForList = recentApplications.slice(0, 5);

  const tenantQuery = `tenantId=${encodeURIComponent(selectedTenantId)}`;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
            ThinkATS dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of jobs, candidates and activity for{" "}
            <span className="font-medium text-slate-900">{tenantName}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tenant chip + selector (if >1 tenant) */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {tenants.length > 1 ? (
              <>
                <span className="text-[11px] uppercase tracking-wide text-slate-500">
                  Tenant
                </span>
                <form method="GET">
                  <select
                    name="tenantId"
                    defaultValue={selectedTenantId}
                    className="border-none bg-transparent text-xs text-slate-900 outline-none focus:ring-0"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name || (t as any).slug || t.id}
                      </option>
                    ))}
                  </select>
                </form>
              </>
            ) : (
              <span>Tenant: {tenantName}</span>
            )}
          </div>

          <Link
            href={`/ats/jobs/new?${tenantQuery}`}
            className="inline-flex items-center gap-1 rounded-full bg-[#1E40AF] px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1D3A9A]"
          >
            <span className="text-base leading-none">＋</span>
            New job
          </Link>
          <Link
            href={`/ats/jobs?${tenantQuery}`}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View all jobs
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Open jobs */}
        <div className="rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-200">
            Open jobs
          </p>
          <p className="mt-2 text-3xl font-semibold">{openJobsCount}</p>
          <p className="mt-1 text-xs text-slate-200/80">
            Jobs currently accepting applications.
          </p>
        </div>

        {/* Applications (30 days) */}
        <div className="rounded-2xl bg-amber-50 px-5 py-4 text-amber-900 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-amber-800/80">
            Applications (30 days)
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {applicationsLast30Days}
          </p>
          <p className="mt-1 text-xs text-amber-800/80">
            New applications received across all jobs.
          </p>
        </div>

        {/* Candidates */}
        <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-emerald-900 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-800/80">
            Candidates in talent pool
          </p>
          <p className="mt-2 text-3xl font-semibold">{totalCandidates}</p>
          <p className="mt-1 text-xs text-emerald-800/80">
            Unique candidates under this tenant.
          </p>
        </div>

        {/* Avg applications / open job */}
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-600">
            Avg. applications / open job
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {openJobsCount > 0 ? avgApplicationsPerOpenJob.toFixed(1) : "–"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Based on the last 30 days of applications.
          </p>
        </div>
      </div>

      {/* Lower panels */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)]">
        {/* Recent jobs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Recent jobs
              </h2>
              <p className="text-xs text-slate-500">
                Latest roles created for this tenant.
              </p>
            </div>
            <Link
              href={`/ats/jobs?${tenantQuery}`}
              className="text-xs font-medium text-[#1E40AF] hover:underline"
            >
              View all jobs →
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <p className="py-4 text-xs text-slate-500">
              No jobs yet for this tenant. Create a role to start receiving
              applications.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentJobs.map((job) => (
                <li key={job.id} className="py-3 first:pt-1 last:pb-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {job.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {job.location && (
                          <>
                            {job.location}
                            <span className="mx-1.5 text-slate-300">•</span>
                          </>
                        )}
                        {formatDate(job.createdAt)}
                      </p>
                    </div>
                    {(job.status || "").toLowerCase() === "open" && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        Open
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Candidate inbox */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Candidate inbox
              </h2>
              <p className="text-xs text-slate-500">
                Most recent applications across all jobs (last 30 days).
              </p>
            </div>
            <Link
              href={`/ats/candidates?${tenantQuery}`}
              className="text-xs font-medium text-[#1E40AF] hover:underline"
            >
              View all →
            </Link>
          </div>

          {recentAppsForList.length === 0 ? (
            <p className="py-4 text-xs text-slate-500">
              No applications in the last 30 days for this tenant.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentAppsForList.map((app) => (
                <li
                  key={app.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {app.fullName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        Applied for{" "}
                        <span className="font-medium">
                          {app.job?.title ?? "Unknown role"}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {app.location && (
                          <>
                            {app.location}
                            <span className="mx-1 text-slate-300">•</span>
                          </>
                        )}
                        {formatDate(app.createdAt)}
                      </p>
                    </div>
                    {app.status && (
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {app.status}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
