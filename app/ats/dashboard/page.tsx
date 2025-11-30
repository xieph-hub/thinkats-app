import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentTenantId } from "@/lib/tenant";

type DashboardStats = {
  openJobs: number;
  totalCandidates: number;
  applicationsLast30Days: number;
};

type JobRow = {
  id: string;
  status: string | null;
};

type JobApplicationRow = {
  id: string;
  job_id: string;
  created_at: string;
};

async function getDashboardStats(): Promise<DashboardStats> {
  const tenantId = await getCurrentTenantId();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let openJobs = 0;
  let totalCandidates = 0;
  let applicationsLast30Days = 0;

  // 1) Load all jobs for this tenant (we use this for open jobs + app filtering)
  let jobs: JobRow[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("jobs")
      .select<"id, status", JobRow>("id, status")
      .eq("tenant_id", tenantId);

    if (!error && data) {
      jobs = data;
      openJobs = data.filter((job) => job.status === "open").length;
    }
  } catch {
    openJobs = 0;
  }

  // 2) Count candidates for this tenant (this was already correct)
  try {
    const { count: candidatesCount, error: candidatesError } =
      await supabaseAdmin
        .from("candidates")
        .select("id", { head: true, count: "exact" })
        .eq("tenant_id", tenantId);

    if (!candidatesError) {
      totalCandidates = candidatesCount ?? 0;
    }
  } catch {
    totalCandidates = 0;
  }

  // 3) Applications (30 days) for this tenant, via job_ids
  try {
    const jobIds = jobs.map((j) => j.id);

    if (jobIds.length > 0) {
      const { data: applications, error: appsError } =
        await supabaseAdmin
          .from("job_applications")
          .select<"id, job_id, created_at", JobApplicationRow>(
            "id, job_id, created_at"
          )
          .in("job_id", jobIds)
          .gte("created_at", thirtyDaysAgo.toISOString());

      if (!appsError && applications) {
        applicationsLast30Days = applications.length;
      }
    } else {
      applicationsLast30Days = 0;
    }
  } catch {
    applicationsLast30Days = 0;
  }

  return {
    openJobs,
    totalCandidates,
    applicationsLast30Days,
  };
}

export default async function AtsDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            A quick view of open roles, candidates and recent applications for
            the current tenant.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/ats/jobs/new"
            className="rounded-full bg-[#1E40AF] px-4 py-1.5 font-semibold text-white shadow-sm hover:bg-[#1D3A9A]"
          >
            Create job
          </Link>
          <Link
            href="/ats/jobs"
            className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-slate-700 hover:bg-slate-50"
          >
            View jobs
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Open jobs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Open jobs</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {stats.openJobs}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Jobs currently accepting applications for this tenant.
          </p>
          <Link
            href="/ats/jobs"
            className="mt-3 inline-flex items-center text-xs font-medium text-[#1E40AF] hover:underline"
          >
            Go to jobs →
          </Link>
        </div>

        {/* Candidates */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Candidates</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {stats.totalCandidates}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Unique profiles in your ATS for this tenant across all roles and
            pipelines.
          </p>
          <Link
            href="/ats/candidates"
            className="mt-3 inline-flex items-center text-xs font-medium text-[#1E40AF] hover:underline"
          >
            Go to candidates →
          </Link>
        </div>

        {/* Applications (30 days) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Applications (30 days)
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {stats.applicationsLast30Days}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            New applications created in the last 30 days for this tenant.
          </p>
          <Link
            href="/jobs"
            className="mt-3 inline-flex items-center text-xs font-medium text-[#1E40AF] hover:underline"
          >
            View public jobs →
          </Link>
        </div>
      </div>
    </div>
  );
}
