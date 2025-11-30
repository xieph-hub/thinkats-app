import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type DashboardStats = {
  openJobs: number;
  totalCandidates: number;
  applicationsLast7Days: number;
};

async function getDashboardStats(): Promise<DashboardStats> {
  const tenantId =
    process.env.NEXT_PUBLIC_RESOURCIN_TENANT_ID || "tenant_resourcin_1";

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let openJobs = 0;
  let totalCandidates = 0;
  let applicationsLast7Days = 0;

  try {
    // Open published jobs for this tenant
    const { count: openJobsCount } = await supabaseAdmin
      .from("jobs")
      .select("id", { head: true, count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("is_published", true);

    openJobs = openJobsCount ?? 0;
  } catch {
    openJobs = 0;
  }

  try {
    // All candidates for this tenant
    const { count: candidatesCount } = await supabaseAdmin
      .from("candidates")
      .select("id", { head: true, count: "exact" })
      .eq("tenant_id", tenantId);

    totalCandidates = candidatesCount ?? 0;
  } catch {
    totalCandidates = 0;
  }

  try {
    // Applications created in the last 7 days for this tenant
    const { count: applicationsCount } = await supabaseAdmin
      .from("job_applications")
      .select("id", { head: true, count: "exact" })
      .eq("tenant_id", tenantId)
      .gte("created_at", sevenDaysAgo.toISOString());

    applicationsLast7Days = applicationsCount ?? 0;
  } catch {
    applicationsLast7Days = 0;
  }

  return {
    openJobs,
    totalCandidates,
    applicationsLast7Days,
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
            this tenant.
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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Open jobs</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {stats.openJobs}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Published roles currently visible on your public jobs page.
          </p>
          <Link
            href="/ats/jobs"
            className="mt-3 inline-flex items-center text-xs font-medium text-[#1E40AF] hover:underline"
          >
            Go to jobs →
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Candidates</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {stats.totalCandidates}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Unique profiles in your ATS across all roles and pipelines.
          </p>
          <Link
            href="/ats/candidates"
            className="mt-3 inline-flex items-center text-xs font-medium text-[#1E40AF] hover:underline"
          >
            Go to candidates →
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Applications (last 7 days)
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {stats.applicationsLast7Days}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            New applications created in the last seven days for this tenant.
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
