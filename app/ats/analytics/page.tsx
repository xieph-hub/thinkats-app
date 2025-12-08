// app/ats/analytics/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { requireTenantMembership } from "@/lib/requireTenantMembership";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Analytics",
  description: "Pipeline and sourcing analytics across your ThinkATS tenant.",
};

type PageProps = {
  searchParams?: {
    range?: string;
  };
};

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const tenant = await getResourcinTenant();

  // Membership gate for analytics
  await requireTenantMembership(tenant.id);
  // If you want role-specific access later:
  // await requireTenantMembership(tenant.id, { allowedRoles: ["owner", "admin", "recruiter"] });

  // ---------------------------------------------------------------------------
  // Time window: "all" (default) vs "30d"
  // ---------------------------------------------------------------------------
  const rawRange =
    typeof searchParams?.range === "string" ? searchParams.range : "all";
  const range = rawRange === "30d" ? "30d" : "all";

  const now = new Date();
  const cutoff =
    range === "30d"
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : null;

  const rangeLabel = range === "30d" ? "Last 30 days" : "All time";

  // Helper snippet to apply createdAt >= cutoff when in 30d mode
  const createdAtFilter =
    cutoff != null ? { createdAt: { gte: cutoff } } : {};

  // ---------------------------------------------------------------------------
  // 1) Load jobs for this tenant (basic info)
  // ---------------------------------------------------------------------------
  const jobs = await prisma.job.findMany({
    where: { tenantId: tenant.id },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      clientCompany: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const jobIds = jobs.map((j) => j.id);
  const hasJobs = jobIds.length > 0;

  // ---------------------------------------------------------------------------
  // 2) Aggregate applications, candidates, stages, sources, tiers
  //    All metrics below respect the selected time window.
  // ---------------------------------------------------------------------------

  // Candidates (createdAt window if 30d)
  const totalCandidatesPromise = prisma.candidate.count({
    where: {
      tenantId: tenant.id,
      ...createdAtFilter,
    },
  });

  // Applications count across all jobs
  const totalApplicationsPromise = hasJobs
    ? prisma.jobApplication.count({
        where: {
          jobId: { in: jobIds },
          ...createdAtFilter,
        },
      })
    : Promise.resolve(0);

  // Group applications by stage
  const stageBucketsPromise = hasJobs
    ? prisma.jobApplication.groupBy({
        by: ["stage"],
        _count: { _all: true },
        where: {
          jobId: { in: jobIds },
          ...createdAtFilter,
        },
      })
    : Promise.resolve(
        [] as { stage: string | null; _count: { _all: number } }[],
      );

  // Group applications by source
  const sourceBucketsPromise = hasJobs
    ? prisma.jobApplication.groupBy({
        by: ["source"],
        _count: { _all: true },
        where: {
          jobId: { in: jobIds },
          ...createdAtFilter,
        },
      })
    : Promise.resolve(
        [] as { source: string | null; _count: { _all: number } }[],
      );

  // Group scoring tiers from ScoringEvent
  const tierBucketsPromise = hasJobs
    ? prisma.scoringEvent.groupBy({
        by: ["tier"],
        _count: { _all: true },
        where: {
          tenantId: tenant.id,
          jobId: { in: jobIds },
          ...(cutoff != null ? { createdAt: { gte: cutoff } } : {}),
        },
      })
    : Promise.resolve(
        [] as { tier: string | null; _count: { _all: number } }[],
      );

  // Application volume per job (for "top roles by volume")
  const applicationsByJobPromise = hasJobs
    ? prisma.jobApplication.groupBy({
        by: ["jobId"],
        _count: { _all: true },
        where: {
          jobId: { in: jobIds },
          ...createdAtFilter,
        },
      })
    : Promise.resolve(
        [] as { jobId: string; _count: { _all: number } }[],
      );

  const [
    totalCandidates,
    totalApplications,
    stageBuckets,
    sourceBuckets,
    tierBuckets,
    applicationsByJob,
  ] = await Promise.all([
    totalCandidatesPromise,
    totalApplicationsPromise,
    stageBucketsPromise,
    sourceBucketsPromise,
    tierBucketsPromise,
    applicationsByJobPromise,
  ]);

  const applicationsByJobMap = new Map<string, number>();
  for (const bucket of applicationsByJob) {
    applicationsByJobMap.set(bucket.jobId, bucket._count._all);
  }

  const openJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "open",
  );
  const closedJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() !== "open",
  );

  // Jobs ranked by application volume *within the time window*
  const jobsByVolume = [...jobs]
    .map((j) => ({
      ...j,
      applicationCount: applicationsByJobMap.get(j.id) ?? 0,
    }))
    .sort((a, b) => b.applicationCount - a.applicationCount)
    .slice(0, 5);

  // Helper to avoid divide-by-zero
  function pct(part: number, whole: number): string {
    if (!whole || whole <= 0) return "–";
    return `${Math.round((part / whole) * 100)}%`;
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Analytics &amp; reporting
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              High-level view of your jobs, applications, and sourcing
              performance under this ThinkATS tenant.
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <div className="font-medium text-slate-700">
              Tenant: {tenant.name}
            </div>
            {"plan" in tenant && (tenant as any).plan && (
              <div className="mt-0.5 text-[10px] text-slate-500">
                Plan:{" "}
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-700">
                  {(tenant as any).plan}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-4 p-5">
        {/* Time window selector */}
        <section className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            <span className="font-medium text-slate-700">
              Time window:
            </span>{" "}
            {rangeLabel}
          </div>
          <form
            method="GET"
            className="flex items-center gap-2 text-[11px] text-slate-600"
          >
            <label
              htmlFor="range"
              className="text-[11px] text-slate-600"
            >
              View metrics for
            </label>
            <select
              id="range"
              name="range"
              defaultValue={range}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
            >
              <option value="all">All time</option>
              <option value="30d">Last 30 days</option>
            </select>
            <button
              type="submit"
              className="inline-flex h-8 items-center rounded-full bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
            >
              Apply
            </button>
          </form>
        </section>

        {/* Summary cards */}
        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">
              Open jobs
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {openJobs.length}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {jobs.length} total jobs
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">
              Total candidates
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {totalCandidates}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Unique people created in this window
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">
              Total applications
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {totalApplications}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Applications submitted in this window
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">
              Filled / closed roles
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {closedJobs.length}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {pct(closedJobs.length, jobs.length)} of all jobs
            </div>
          </div>
        </section>

        {/* Pipeline by stage + scoring tiers */}
        <section className="grid gap-4 lg:grid-cols-3">
          {/* Pipeline by stage */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Pipeline by stage
              </h2>
              <span className="text-[11px] text-slate-400">
                Based on applications in {rangeLabel.toLowerCase()}
              </span>
            </div>

            {stageBuckets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[11px] text-slate-500">
                No applications in this time window — once candidates start
                applying to jobs, you&apos;ll see pipeline distribution here.
              </div>
            ) : (
              <table className="w-full table-fixed text-left text-[11px] text-slate-600">
                <thead className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-1.5 pr-2">Stage</th>
                    <th className="py-1.5 pr-2 text-right">
                      Applications
                    </th>
                    <th className="py-1.5 pr-2 text-right">
                      % of total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stageBuckets
                    .slice()
                    .sort((a, b) =>
                      (a.stage || "").localeCompare(b.stage || ""),
                    )
                    .map((bucket) => {
                      const label = (bucket.stage || "UNKNOWN").toUpperCase();
                      const count = bucket._count._all;
                      return (
                        <tr
                          key={label}
                          className="border-b border-slate-50 last:border-0"
                        >
                          <td className="py-1.5 pr-2 text-[11px] font-medium text-slate-700">
