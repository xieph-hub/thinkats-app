// app/ats/dashboard/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { tenantDb } from "@/lib/db/tenantDb";
import { requireAtsTenant } from "@/lib/tenant/requireAtsTenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Dashboard",
  description:
    "ATS dashboard overview of jobs, candidates, applications and interviews.",
};

type DashboardStats = {
  tenantId: string;
  totalJobs: number;
  openJobs: number;
  totalCandidates: number;
  totalApplications: number;
  interviewsScheduled: number;
};

async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  const db = tenantDb(tenantId);

  const [
    totalJobs,
    openJobs,
    totalCandidates,
    totalApplications,
    interviewsScheduled,
  ] = await Promise.all([
    db.job.count({}), // tenantId injected by tenantDb
    db.job.count({ where: { status: "open" } }),
    db.candidate.count({}),
    db.jobApplication.count({}),
    db.applicationInterview.count({
      where: {
        status: "SCHEDULED",
      },
    }),
  ]);

  return {
    tenantId,
    totalJobs,
    openJobs,
    totalCandidates,
    totalApplications,
    interviewsScheduled,
  };
}

export default async function AtsDashboardPage() {
  const { tenant, role, isSuperAdmin } = await requireAtsTenant();
  const stats = await getDashboardStats(tenant.id);

  const roleLabel = isSuperAdmin ? "SUPER_ADMIN" : role ?? "MEMBER";

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Workspace: <span className="font-medium">{tenant.name}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Role: <span className="font-semibold">{roleLabel}</span> ·{" "}
            <span className="text-slate-400">{tenant.slug}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/ats/jobs"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            View Jobs
          </Link>
          <Link
            href="/ats/candidates"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            View Candidates
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Jobs" value={stats.totalJobs} />
        <StatCard label="Open Jobs" value={stats.openJobs} />
        <StatCard label="Candidates" value={stats.totalCandidates} />
        <StatCard label="Applications" value={stats.totalApplications} />
        <StatCard
          label="Scheduled Interviews"
          value={stats.interviewsScheduled}
        />
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/ats/jobs/new"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create Job
          </Link>
          <Link
            href="/ats/tenants"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Workspaces
          </Link>
          <Link
            href="/ats/settings"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium text-slate-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">
        {Number.isFinite(value) ? value : 0}
      </div>
    </div>
  );
}
