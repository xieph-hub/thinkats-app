// app/ats/dashboard/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type DashboardStats = {
  tenantName: string;
  openJobs: number;
  totalCandidates: number;
  applicationsLast30Days: number;
  avgApplicationsPerOpenJob: number;
  recentJobs: RecentJob[];
  recentApplications: RecentApplication[];
};

type RecentJob = {
  id: string;
  title: string;
  location: string | null;
  status: string | null;
  createdAt: string | null;
};

type RecentApplication = {
  id: string;
  fullName: string;
  jobTitle: string;
  location: string | null;
  status: string | null;
  createdAt: string | null;
};

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normaliseJobStatus(status: string | null | undefined) {
  return (status || "").toLowerCase();
}

async function getDashboardStats(): Promise<DashboardStats> {
const ctx = await getAtsTenantContext();
const tenant = ctx.tenant;
if (!tenant) throw new Error("No active tenant");
const tenantId = tenant.id;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1) Load jobs, candidate count, and applications (last 30 days) from Prisma
  const [jobs, candidatesCount, appsLast30Days] = await Promise.all([
    prisma.job.findMany({
      where: { tenantId },
      select: {
        id: true,
        title: true,
        location: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.candidate.count({
      where: { tenantId },
    }),

    prisma.jobApplication.findMany({
      where: {
        tenantId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        fullName: true,
        location: true,
        status: true,
        createdAt: true,
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // 2) Derived metrics
  const openJobs = jobs.filter(
    (job) => normaliseJobStatus(job.status as any) === "open",
  ).length;

  const applicationsLast30Days = appsLast30Days.length;

  const avgApplicationsPerOpenJob =
    openJobs > 0 ? applicationsLast30Days / openJobs : 0;

  // 3) Map to UI-friendly structures
  const recentJobs: RecentJob[] = jobs.slice(0, 5).map((job) => ({
    id: job.id,
    title: job.title,
    location: job.location,
    status: job.status as string | null,
    createdAt: job.createdAt ? job.createdAt.toISOString() : null,
  }));

  const recentApplications: RecentApplication[] = appsLast30Days
    .slice(0, 5)
    .map((app) => ({
      id: app.id,
      fullName: app.fullName,
      jobTitle: app.job?.title ?? "Unknown role",
      location: app.location,
      status: app.status as string | null,
      createdAt: app.createdAt ? app.createdAt.toISOString() : null,
    }));

  return {
    tenantName,
    openJobs,
    totalCandidates: candidatesCount,
    applicationsLast30Days,
    avgApplicationsPerOpenJob,
    recentJobs,
    recentApplications,
  };
}

export default async function AtsDashboardPage() {
  const stats = await getDashboardStats();

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
            <span className="font-medium text-slate-900">
              {stats.tenantName}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Tenant: {stats.tenantName}
          </span>
          <Link
            href="/ats/jobs/new"
            className="inline-flex items-center gap-1 rounded-full bg-[#1E40AF] px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1D3A9A]"
          >
            <span className="text-base leading-none">＋</span>
            New job
          </Link>
          <Link
            href="/ats/jobs"
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
          <p className="mt-2 text-3xl font-semibold">{stats.openJobs}</p>
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
            {stats.applicationsLast30Days}
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
          <p className="mt-2 text-3xl font-semibold">
            {stats.totalCandidates}
          </p>
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
            {stats.openJobs > 0
              ? stats.avgApplicationsPerOpenJob.toFixed(1)
              : "–"}
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
              href="/ats/jobs"
              className="text-xs font-medium text-[#1E40AF] hover:underline"
            >
              View all jobs →
            </Link>
          </div>

          {stats.recentJobs.length === 0 ? (
            <p className="py-4 text-xs text-slate-500">
              No jobs yet for this tenant. Create a role to start receiving
              applications.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.recentJobs.map((job) => (
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
                        {job.createdAt && formatDate(job.createdAt)}
                      </p>
                    </div>
                    {normaliseJobStatus(job.status) === "open" && (
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
              href="/ats/candidates"
              className="text-xs font-medium text-[#1E40AF] hover:underline"
            >
              View all →
            </Link>
          </div>

          {stats.recentApplications.length === 0 ? (
            <p className="py-4 text-xs text-slate-500">
              No applications in the last 30 days for this tenant.
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.recentApplications.map((app) => (
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
                          {app.jobTitle}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {app.location && (
                          <>
                            {app.location}
                            <span className="mx-1 text-slate-300">•</span>
                          </>
                        )}
                        {app.createdAt && formatDate(app.createdAt)}
                      </p>
                    </div>
                    {app.status && (
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${applicationStatusBadgeClass(
                          app.status,
                        )}`}
                      >
                        {titleCaseFromEnum(app.status)}
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

// Reuse the same badge logic as candidate list
function applicationStatusBadgeClass(value?: string | null) {
  const key = (value || "").toUpperCase();
  if (key === "PENDING") {
    return "bg-slate-50 text-slate-700 border-slate-200";
  }
  if (key === "IN_PROGRESS") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }
  if (key === "ON_HOLD") {
    return "bg-amber-50 text-amber-800 border-amber-100";
  }
  if (key === "HIRED") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (key === "REJECTED" || value === "ARCHIVED") {
    return "bg-rose-50 text-rose-700 border-rose-100";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function titleCaseFromEnum(value?: string | null) {
  if (!value) return "";
  return value
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
