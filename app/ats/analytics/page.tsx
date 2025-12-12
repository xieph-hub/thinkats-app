// app/ats/analytics/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

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
  const tenant = await getResourcinTenant();

  if (!tenant) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md rounded-xl border border-amber-100 bg-white p-6 text-center shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-500">
            ThinkATS · Analytics
          </p>
          <h1 className="mt-2 text-base font-semibold text-slate-900">
            Analytics not available
          </h1>
          <p className="mt-2 text-xs text-slate-600">
            No default tenant is configured. Check{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] text-slate-800">
              RESOURCIN_TENANT_ID
            </code>{" "}
            or{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] text-slate-800">
              RESOURCIN_TENANT_SLUG
            </code>{" "}
            in your environment variables and redeploy.
          </p>
        </div>
      </div>
    );
  }

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
  // Jobs for this tenant
  // ---------------------------------------------------------------------------
  const jobs = await prisma.job.findMany({
    where: { tenantId: tenant.id },
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
  const totalCandidatesPromise = prisma.candidate.count({
    where: {
      tenantId: tenant.id,
      ...createdAtFilter,
    },
  });

  const totalApplicationsPromise = hasJobs
    ? prisma.jobApplication.count({
        where: {
          jobId: { in: allJobIds },
          ...createdAtFilter,
        },
      })
    : Promise.resolve(0);

  const stageBucketsPromise: Promise<StageBucket[]> = hasJobs
    ? (prisma.jobApplication.groupBy({
        by: ["stage"],
        _count: { _all: true },
        where: {
          jobId: { in: allJobIds },
          ...createdAtFilter,
        },
      }) as any)
    : Promise.resolve([]);

  const sourceBucketsPromise: Promise<SourceBucket[]> = hasJobs
    ? (prisma.jobApplication.groupBy({
        by: ["source"],
        _count: { _all: true },
        where: {
          jobId: { in: allJobIds },
          ...createdAtFilter,
        },
      }) as any)
    : Promise.resolve([]);

  const tierBucketsPromise: Promise<TierBucket[]> = hasJobs
    ? (prisma.scoringEvent.groupBy({
        by: ["tier"],
        _count: { _all: true },
        where: {
          tenantId: tenant.id,
          jobId: { in: allJobIds },
          ...(cutoff != null ? { createdAt: { gte: cutoff } } : {}),
        },
      }) as any)
    : Promise.resolve([]);

  const applicationsByJobPromise: Promise<AppsByJobBucket[]> = hasJobs
    ? (prisma.jobApplication.groupBy({
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

  const tenantPlan = (tenant as any).plan as string | null | undefined;

  // ---------------------------------------------------------------------------
  // UI
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

      <main className="flex-1 overflow-y-auto px-6 pb-8 pt-4">
        {/* Time window selector */}
        <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
              Window
            </span>
            <span>{rangeLabel}</span>
          </div>

          <form
            method="GET"
            className="flex items-center gap-2 text-[11px] text-slate-600"
          >
            <span className="hidden text-slate-500 sm:inline">
              View metrics for
            </span>
            <select
              id="range"
              name="range"
              defaultValue={range}
              className="h-8 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-900 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
            >
              <option value="all">All time</option>
              <option value="30d">Last 30 days</option>
            </select>

            {effectiveClientKey !== "all" && (
              <input
                type="hidden"
                name="clientKey"
                value={effectiveClientKey}
              />
            )}

            <button
              type="submit"
              className="inline-flex h-8 items-center rounded-full bg-emerald-600 px-3 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              Apply
            </button>
          </form>
        </section>

        {/* Clients filter row */}
        <section className="mb-5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                Clients
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Slice top roles by client. Tenant-wide metrics stay unchanged.
              </p>
            </div>
            <div className="text-[10px] text-slate-500">
              {clientSummaries.length} client
              {clientSummaries.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link
              href={buildAnalyticsHref(range, "all")}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] ${
                effectiveClientKey === "all"
                  ? "border-slate-900 bg-slate-900 text-slate-50"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <span>All clients</span>
            </Link>

            {clientSummaries.map((client) => {
              const isActive = effectiveClientKey === client.key;
              return (
                <Link
                  key={client.key}
                  href={buildAnalyticsHref(range, client.key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-slate-50"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="max-w-[160px] truncate">
                    {client.label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                    <span>{client.jobCount} jobs</span>
                    <span>·</span>
                    <span>{client.applicationCount} apps</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Summary row */}
        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">
              Open jobs
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900">
                {openJobs.length}
              </span>
              <span className="text-[11px] text-slate-500">
                / {jobs.length} total
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Active roles currently accepting candidates.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">
              Candidates
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900">
                {totalCandidates}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Unique profiles created in this window.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">
              Applications
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900">
                {totalApplications}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Submitted applications in this time window.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">
              Closed roles
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900">
                {closedJobs.length}
              </span>
              <span className="text-[11px] text-slate-500">
                {pct(closedJobs.length, jobs.length)} of all jobs
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Roles marked as filled, on hold or closed.
            </p>
          </div>
        </section>

        {/* Pipeline + tiers */}
        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          {/* Pipeline by stage */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                  Pipeline by stage
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Distribution of applications across stages in{" "}
                  {rangeLabel.toLowerCase()}.
                </p>
              </div>
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600">
                {totalApplications} applications
              </span>
            </div>

            {sortedStageBuckets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[11px] text-slate-500">
                No applications in this time window yet. Once candidates move
                through your pipeline, stage distribution will appear here.
              </div>
            ) : (
              <ul className="space-y-2">
                {sortedStageBuckets.map((bucket) => {
                  const label = (bucket.stage || "Unassigned").toUpperCase();
                  const count = bucket._count._all;
                  const width = barWidth(count, totalApplications);
                  return (
                    <li
                      key={label}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 hover:bg-slate-50"
                    >
                      <div className="w-24 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                        {label}
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 w-full rounded-full bg-slate-200">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500"
                            style={{ width }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right text-[11px] text-slate-600">
                        <div className="font-medium text-slate-900">
                          {count}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {pct(count, totalApplications)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Scoring tiers */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                  Scoring tiers
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Distribution of auto-screening results.
                </p>
              </div>
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600">
                {totalTierEvents} scored events
              </span>
            </div>

            {sortedTierBuckets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[11px] text-slate-500">
                No scoring data in this window yet. Once your scoring engine is
                live, A/B/C tier breakdown will show here.
              </div>
            ) : (
              <ul className="space-y-2 text-[11px] text-slate-700">
                {sortedTierBuckets.map((bucket) => {
                  const label = (bucket.tier || "UNRATED").toUpperCase();
                  const count = bucket._count._all;
                  const width = barWidth(count, totalTierEvents);
                  return (
                    <li
                      key={label}
                      className="rounded-lg border border-slate-100 bg-white px-3 py-2"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-flex h-5 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-800 ring-1 ring-slate-200">
                            {label}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            tier candidates
                          </span>
                        </span>
                        <span className="text-xs font-medium text-slate-900">
                          {count} · {pct(count, totalTierEvents)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200">
                        <div
                          className="h-1.5 rounded-full bg-emerald-500"
                          style={{ width }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Source breakdown + top roles */}
        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          {/* Source breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                  Source breakdown
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Where applications in this window originated.
                </p>
              </div>
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600">
                {totalApplications} applications
              </span>
            </div>

            {sortedSourceBuckets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[11px] text-slate-500">
                No sources recorded for applications in this window. Once you
                tag sources (e.g. &quot;LinkedIn&quot;, &quot;Referral&quot;),
                they will appear here.
              </div>
            ) : (
              <ul className="space-y-2">
                {sortedSourceBuckets.map((bucket) => {
                  const label = bucket.source || "Unknown";
                  const count = bucket._count._all;
                  const width = barWidth(count, totalApplications);
                  return (
                    <li
                      key={label}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 hover:bg-slate-50"
                    >
                      <div className="w-32 truncate text-[11px] font-medium text-slate-900">
                        {label}
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 w-full rounded-full bg-slate-200">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500"
                            style={{ width }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right text-[11px] text-slate-600">
                        <div className="font-medium text-slate-900">
                          {count}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {pct(count, totalApplications)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Top roles by volume */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                  Top roles by volume
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Roles attracting the most applications in this window
                  {effectiveClientKey === "all"
                    ? ""
                    : " for the selected client"}
                  .
                </p>
              </div>
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600">
                {jobsByVolume.length || 0} roles
              </span>
            </div>

            {jobsByVolume.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[11px] text-slate-500">
                No applications in this time window yet. Once roles start
                receiving candidates, you&apos;ll see their relative volume
                here.
              </div>
            ) : (
              <ul className="space-y-2 text-[11px] text-slate-700">
                {jobsByVolume.map((job) => {
                  const width = barWidth(job.applicationCount, maxVolume);
                  const statusLabel = (job.status || "OPEN").toUpperCase();
                  const isOpen =
                    (job.status || "").toLowerCase() === "open";

                  return (
                    <li
                      key={job.id}
                      className="rounded-lg border border-slate-100 bg-white p-3 hover:bg-slate-50"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[12px] font-medium text-slate-900">
                            {job.title}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {job.clientCompany?.name || "Internal"} ·{" "}
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                isOpen
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                  : "bg-slate-100 text-slate-700 ring-1 ring-slate-300"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-900">
                            {job.applicationCount}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            applications
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200">
                        <div
                          className="h-1.5 rounded-full bg-sky-500"
                          style={{ width }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
