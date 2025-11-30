import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentTenantId } from "@/lib/tenant";

type DashboardStats = {
  openJobs: number;
  totalCandidates: number;
  applicationsLast30Days: number;
};

async function getDashboardStats(): Promise<DashboardStats> {
  const tenantId = await getCurrentTenantId();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let openJobs = 0;
  let totalCandidates = 0;
  let applicationsLast30Days = 0;

  try {
    // OPEN JOBS
    // Match the ATS meaning: "Jobs currently accepting applications"
    // This is usually driven by a status like 'open'.
    const { count: openJobsCount, error: jobsError } = await supabaseAdmin
      .from("jobs")
      .select("id", { head: true, count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("status", "open"); // if your column is different, align this to it

    if (!jobsError) {
      openJobs = openJobsCount ?? 0;
    }
  } catch {
    openJobs = 0;
  }

  try {
    // CANDIDATES (this was already correct, and matches legacy ATS)
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

  try {
    // APPLICATIONS (30 DAYS)
    // Old ATS card: "Applications (30 days)" → mirror that.
    // Very often this lives on an "applied_at" / "created_at" timestamp.
    const { count: applicationsCount, error: appsError } =
      await supabaseAdmin
        .from("job_applications")
        .select("id", { head: true, count: "exact" })
        .eq("tenant_id", tenantId)
        .gte("applied_at", thirtyDaysAgo.toISOString()); // if your column is created_at, change this field name

    if (!appsError) {
      applicationsLast30Days = applicationsCount ?? 0;
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
