// app/ats/analytics/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { tenantDb } from "@/lib/db/tenantDb";
import { requireAtsTenant } from "@/lib/tenant/requireAtsTenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Analytics",
  description: "Pipeline and sourcing analytics across your ThinkATS tenant.",
};

type PageProps = {
  searchParams?: {
    range?: string;
    clientKey?: string;
  };
};

type StageBucket = { stage: string | null; _count: { _all: number } };
type SourceBucket = { source: string | null; _count: { _all: number } };
type TierBucket = { tier: string | null; _count: { _all: number } };
type AppsByJobBucket = { jobId: string; _count: { _all: number } };

type ClientSummary = {
  key: string;
  label: string;
  jobCount: number;
  applicationCount: number;
};

function pct(part: number, whole: number): string {
  if (!whole || whole <= 0) return "–";
  return `${Math.round((part / whole) * 100)}%`;
}

function barWidth(count: number, total: number): string {
  if (!total || total <= 0) return "0%";
  const raw = Math.round((count / total) * 100);
  const safe = Math.max(raw, count > 0 ? 6 : 0);
  return `${Math.min(safe, 100)}%`;
}

function buildAnalyticsHref(range: string, clientKey: string | "all") {
  const base = `/ats/analytics?range=${encodeURIComponent(range)}`;
  if (!clientKey || clientKey === "all") return base;
  return `${base}&clientKey=${encodeURIComponent(clientKey)}`;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const { tenant } = await requireAtsTenant();
  const db = tenantDb(tenant.id);

  // ---------------------------------------------------------------------------
  // Time window: "all" (default) vs "30d"
  // ---------------------------------------------------------------------------
  const rawRange =
    typeof searchParams?.range === "string" ? searchParams.range : "all";
  const range = rawRange === "30d" ? "30d" : "all";
  const rangeLabel = range === "30d" ? "Last 30 days" : "All time";

  const rawClientKeyParam =
    typeof searchParams?.clientKey === "string"
      ? searchParams.clientKey
      : "all";
  const requestedClientKey = rawClientKeyParam || "all";

  const now = new Date();
  const cutoff =
    range === "30d"
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : null;

  const createdAtFilter = cutoff != null ? { createdAt: { gte: cutoff } } : {};

  // ---------------------------------------------------------------------------
  // Jobs for this tenant (tenantDb injects tenantId)
  // ---------------------------------------------------------------------------
  const jobs = await db.job.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      clientCompanyId: true,
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

  const allJobIds = jobs.map((j) => j.id);
  const hasJobs = allJobIds.length > 0;

  // ---------------------------------------------------------------------------
  // Aggregations (tenant-wide)
  // ---------------------------------------------------------------------------
  const totalCandidatesPromise = db.candidate.count({
    where: {
      ...createdAtFilter,
    },
  });

  const totalApplicationsPromise = hasJobs
    ? db.jobApplication.count({
        where: {
          jobId: { in: allJobIds },
          ...createdAtFilter,
        },
      })
    : Promise.resolve(0);

  const stageBucketsPromise: Promise<StageBucket[]> = hasJobs
    ? (db.jobApplication.groupBy({
        by: ["stage"],
        _count: { _all: true },
        where: {
          jobId: { in: allJobIds },
          ...createdAtFilter,
        },
      }) as any)
    : Promise.resolve([]);

  const sourceBucketsPromise: Promise<SourceBucket[]> = hasJobs
    ? (db.jobApplication.groupBy({
        by: ["source"],
        _count: { _all: true },
        where: {
          jobId: { in: allJobIds },
          ...createdAtFilter,
        },
      }) as any)
    : Promise.resolve([]);

  const tierBucketsPromise: Promise<TierBucket[]> = hasJobs
    ? (db.scoringEvent.groupBy({
        by: ["tier"],
        _count: { _all: true },
        where: {
          jobId: { in: allJobIds },
          ...(cutoff != null ? { createdAt: { gte: cutoff } } : {}),
        },
      }) as any)
    : Promise.resolve([]);

  const applicationsByJobPromise: Promise<AppsByJobBucket[]> = hasJobs
    ? (db.jobApplication.groupBy({
        by: ["jobId"],
        _count: { _all: true },
        where: {
          jobId: { in: allJobIds },
          ...createdAtFilter,
        },
      }) as any)
    : Promise.resolve([]);

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

  // ---------------------------------------------------------------------------
  // Client summaries (for filter row)
  // ---------------------------------------------------------------------------
  const clientSummaryMap = new Map<string, ClientSummary>();

  for (const job of jobs) {
    const key = job.clientCompanyId ?? "__internal__";
    const label = job.clientCompany?.name || "Internal";
    const applicationsCount = applicationsByJobMap.get(job.id) ?? 0;

    const existing = clientSummaryMap.get(key);
    if (!existing) {
      clientSummaryMap.set(key, {
        key,
        label,
        jobCount: 1,
        applicationCount: applicationsCount,
      });
    } else {
      existing.jobCount += 1;
      existing.applicationCount += applicationsCount;
    }
  }

  const clientSummaries = Array.from(clientSummaryMap.values()).sort(
    (a, b) => b.applicationCount - a.applicationCount || b.jobCount - a.jobCount,
  );

  const hasClientKey =
    requestedClientKey !== "all" && clientSummaryMap.has(requestedClientKey);
  const effectiveClientKey: string | "all" = hasClientKey
    ? requestedClientKey
    : "all";

  // ---------------------------------------------------------------------------
  // Derived metrics
  // ---------------------------------------------------------------------------
  const openJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "open",
  );
  const closedJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() !== "open",
  );

  const sortedStageBuckets = stageBuckets
    .slice()
    .sort((a, b) => (a.stage || "").localeCompare(b.stage || ""));

  const sortedSourceBuckets = sourceBuckets
    .slice()
    .sort((a, b) => (a.source || "").localeCompare(b.source || ""));

  const sortedTierBuckets = tierBuckets
    .slice()
    .sort((a, b) => (a.tier || "").localeCompare(b.tier || ""));

  const totalTierEvents = tierBuckets.reduce(
    (sum, b) => sum + b._count._all,
    0,
  );

  const jobsForVolume =
    effectiveClientKey === "all"
      ? jobs
      : jobs.filter(
          (j) =>
            (j.clientCompanyId ?? "__internal__") === effectiveClientKey,
        );

  const jobsByVolume = jobsForVolume
    .map((j) => ({
      ...j,
      applicationCount: applicationsByJobMap.get(j.id) ?? 0,
    }))
    .sort((a, b) => b.applicationCount - a.applicationCount)
    .slice(0, 5);

  const maxVolume =
    jobsByVolume.length > 0
      ? Math.max(...jobsByVolume.map((j) => j.applicationCount))
      : 0;

  const tenantPlan = (tenant as any).planTier ?? null;

  // ---------------------------------------------------------------------------
  // UI (unchanged from your version, just using the values above)
  // ---------------------------------------------------------------------------
  return (
    <div className="flex h-full flex-1 flex-col bg-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2 text-[11px] text-slate-500">
          <Link href="/ats/jobs" className="hover:underline">
            ATS
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">Analytics</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              ThinkATS · Analytics
            </p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900">
              Pipeline &amp; sourcing overview
            </h1>
            <p className="mt-1 text-[11px] text-slate-500">
              High-level view of jobs, applications and scoring performance for
              this tenant.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-600">
                ●
              </div>
              <div className="text-[11px] leading-tight">
                <p className="font-medium text-slate-900">
                  {tenant.name || "Tenant workspace"}
                </p>
                <p className="text-[10px] text-slate-500">
                  {jobs.length} jobs · {totalCandidates} candidates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {tenantPlan && (
                <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Plan: <span className="capitalize">{tenantPlan}</span>
                </div>
              )}

              {/* PDF summary – downloads a rich PDF report */}
              <a
                href={`/ats/analytics/export/pdf?range=${encodeURIComponent(
                  range,
                )}${
                  effectiveClientKey !== "all"
                    ? `&clientKey=${encodeURIComponent(effectiveClientKey)}`
                    : ""
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900"
              >
                <span>PDF summary</span>
                <span className="text-[11px]">⬇</span>
              </a>

              {/* CSV export – same filters */}
              <a
                href={`/ats/analytics/export?range=${encodeURIComponent(
                  range,
                )}${
                  effectiveClientKey !== "all"
                    ? `&clientKey=${encodeURIComponent(effectiveClientKey)}`
                    : ""
                }`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900"
              >
                <span>Export CSV</span>
                <span className="text-[11px]">↧</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* The rest of your JSX (summary row, pipeline, sources, top roles) stays exactly as in your current file – it just reads from
          openJobs, closedJobs, totalCandidates, totalApplications, sortedStageBuckets, sortedSourceBuckets, sortedTierBuckets,
          totalTierEvents, jobsByVolume, maxVolume, rangeLabel, effectiveClientKey, etc. */}
      {/* ...copy your existing JSX blocks here unchanged... */}
    </div>
  );
}
