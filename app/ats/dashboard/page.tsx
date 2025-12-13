// app/ats/dashboard/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Dashboard",
  description: "ATS dashboard overview of jobs, candidates, applications and interviews.",
};

type DashboardStats = {
  tenantId: string;
  totalJobs: number;
  openJobs: number;
  totalCandidates: number;
  totalApplications: number;
  interviewsScheduled: number;
};

async function getDashboardStats(): Promise<DashboardStats> {
  const tenant = await getResourcinTenant();
  if (!tenant) throw new Error("No active tenant");

  const tenantId = tenant.id;

  const [
    totalJobs,
    openJobs,
    totalCandidates,
    totalApplications,
    interviewsScheduled,
  ] = await Promise.all([
    prisma.job.count({
      where: { tenantId },
    }),

    prisma.job.count({
      where: { tenantId, status: "open" },
    }),

    prisma.candidate.count({
      where: { tenantId },
    }),

    prisma.jobApplication.count({
      where: {
        job: { tenantId },
      },
    }),

    prisma.applicationInterview.count({
      where: {
        application: {
          job: { tenantId },
        },
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
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

  const stats = await getDashboardStats();

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Workspace: <span className="font-medium">{tenant.name}</span>
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
        <StatCard label="Scheduled Interviews" value={stats.interviewsScheduled} />
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
