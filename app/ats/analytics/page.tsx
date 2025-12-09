// app/ats/analytics/page.tsx
import type { Metadata } from "next";
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
  };
};

type StageBucket = { stage: string | null; _count: { _all: number } };
type SourceBucket = { source: string | null; _count: { _all: number } };
type TierBucket = { tier: string | null; _count: { _all: number } };
type AppsByJobBucket = { jobId: string; _count: { _all: number } };

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

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const tenant = await getResourcinTenant();

  if (!tenant) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center shadow-xl shadow-black/40">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            ThinkATS · Analytics
          </p>
          <h1 className="mt-2 text-base font-semibold text-slate-50">
            Analytics not available
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            No default tenant is configured. Check{" "}
            <code className="rounded bg-slate-900 px-1 py-0.5 text-[11px] text-amber-300">
              RESOURCIN_TENANT_ID
            </code>{" "}
            or{" "}
            <code className="rounded bg-slate-900 px-1 py-0.5 text-[11px] text-amber-300">
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

  const now = new Date();
  const cutoff =
    range === "30d"
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : null;

  const rangeLabel = range === "30d" ? "Last 30 days" : "All time";

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
  // Aggregations
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
          jobId: { in: jobIds },
          ...createdAtFilter,
        },
      })
    : Promise.resolve(0);

  const stageBucketsPromise: Promise<StageBucket[]> = hasJobs
    ? prisma.jobApplication.groupBy({
        by: ["stage"],
        _count: { _all: true },
        where: {
          jobId: { in: jobIds },
          ...createdAtFilter,
        },
      }) as any
    : Promise.resolve([]);

  const sourceBucketsPromise: Promise<SourceBucket[]> = hasJobs
    ? prisma.jobApplication.groupBy({
        by: ["source"],
        _count: { _all: true },
        where: {
          jobId: { in: jobIds },
          ...createdAtFilter,
        },
      }) as any
    : Promise.resolve([]);

  const tierBucketsPromise: Promise<TierBucket[]> = hasJobs
    ? (prisma.scoringEvent.groupBy({
        by: ["tier"],
        _count: { _all: true },
        where: {
          tenantId: tenant.id,
          jobId: { in: jobIds },
          ...(cutoff != null ? { createdAt: { gte: cutoff } } : {}),
        },
      }) as any)
    : Promise.resolve([]);

  const applicationsByJobPromise: Promise<AppsByJobBucket[]> = hasJobs
    ? (prisma.jobApplication.groupBy({
        by: ["jobId"],
        _count: { _all: true },
        where: {
          jobId: { in: jobIds },
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

  const openJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "open",
  );
  const closedJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() !== "open",
  );

  const jobsByVolume = [...jobs]
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

  const tenantPlan = (tenant as any).plan as string | null | undefined;

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-950">
      {/* Top header strip */}
      <header className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 shadow-sm shadow-black/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              ThinkATS · Analytics
            </p>
            <h1 className="mt-1 text-lg font-semibold text-slate-50">
              Pipeline &amp; sourcing overview
            </h1>
            <p className="mt-1 text-[11px] text-slate-400">
              High-level view of jobs, applications and scoring performance for
              this tenant.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-semibold text-emerald-300">
                ●
              </span>
              <div className="text-[11px] leading-tight">
                <p className="font-medium text-slate-50">
                  {tenant.name || "Tenant workspace"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {jobIds.length} jobs · {totalCandidates} candidates
                </p>
              </div>
            </div>

            {tenantPlan && (
              <div className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                Plan: <span className="capitalize">{tenantPlan}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-8 pt-4">
        {/* Time window + quick stats ribbon */}
        <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-[11px] text-slate-300">
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
              Window
            </span>
            <span>{rangeLabel}</span>
          </div>

          <form
            method="GET"
            className="flex items-center gap-2 text-[11px] text-slate-300"
          >
            <span className="hidden text-slate-400 sm:inline">
              View metrics for
            </span>
            <select
              id="range"
              name="range"
              defaultValue={range}
              className="h-8 rounded-full border border-slate-700 bg-slate-900 px-3 text-[11px] text-slate-100 outline-none ring-0 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            >
              <option value="all">All time</option>
              <option value="30d">Last 30 days</option>
            </select>
            <button
              type="submit"
              className="inline-flex h-8 items-center rounded-full bg-emerald-500 px-3 text-[11px] font-semibold text-emerald-950 shadow-sm shadow-emerald-500/30 hover:bg-emerald-400"
            >
              Apply
            </button>
          </form>
        </section>

        {/* Summary row */}
        <section className="grid gap-3 md:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/40">
            <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-emerald-500/10" />
            <div className="text-[11px] text-slate-400">Open jobs</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-50">
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

          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/40">
            <div className="pointer-events-none absolute -right-8 -bottom-6 h-16 w-16 rounded-full bg-sky-500/10" />
            <div className="text-[11px] text-slate-400">Candidates</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-50">
                {totalCandidates}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Unique profiles created in this window.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/40">
            <div className="pointer-events-none absolute -left-6 -top-6 h-16 w-16 rounded-full bg-indigo-500/15" />
            <div className="text-[11px] text-slate-400">Applications</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-50">
                {totalApplications}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Submitted applications in this time window.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/40">
            <div className="pointer-events-none absolute -right-6 bottom-0 h-20 w-20 rounded-full bg-amber-400/10" />
            <div className="text-[11px] text-slate-400">Closed roles</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-50">
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
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/40">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Pipeline by stage
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Distribution of applications across stages in{" "}
                  {rangeLabel.toLowerCase()}.
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-300">
                {totalApplications} applications
              </span>
            </div>

            {sortedStageBuckets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/70 p-4 text-center text-[11px] text-slate-400">
                No applications in this time window yet. Once candidates start
                moving through your pipeline, stage distribution will appear
                here.
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
                      className="flex items-center gap-3 rounded-xl bg-slate-900/60 px-3 py-2"
                    >
                      <div className="w-24 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                        {label}
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 w-full rounded-full bg-slate-800">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500"
                            style={{ width }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right text-[11px] text-slate-300">
                        <div className="font-medium text-slate-50">
                          {count}
                        </div>
                        <div className="text-[10px] text-slate-400">
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
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/40">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Scoring tiers
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Distribution of auto-screening results.
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-300">
                {totalTierEvents} scored events
              </span>
            </div>

            {sortedTierBuckets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/70 p-4 text-center text-[11px] text-slate-400">
                No scoring data in this window yet. Once your scoring engine is
                live, A/B/C tier breakdown will show here.
              </div>
            ) : (
              <ul className="space-y-2 text-[11px] text-slate-300">
                {sortedTierBuckets.map((bucket) => {
                  const label = (bucket.tier || "UNRATED").toUpperCase();
                  const count = bucket._count._all;
                  const width = barWidth(count, totalTierEvents);
                  return (
                    <li
                      key={label}
                      className="rounded-xl bg-slate-900/60 px-3 py-2"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-flex h-5 w-8 items-center justify-center rounded-full bg-slate-50/5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/40">
                            {label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            tier candidates
                          </span>
                        </span>
                        <span className="text-xs font-medium text-slate-50">
                          {count} · {pct(count, totalTierEvents)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800">
                        <div
                          className="h-1.5 rounded-full bg-emerald-400"
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

        {/* Sources + top roles */}
        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          {/* Source breakdown */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/40">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Source breakdown
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Where applications in this window originated.
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-300">
                {totalApplications} applications
              </span>
            </div>

            {sortedSourceBuckets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/70 p-4 text-center text-[11px] text-slate-400">
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
                      className="flex items-center gap-3 rounded-xl bg-slate-900/60 px-3 py-2"
                    >
                      <div className="w-32 truncate text-[11px] font-medium text-slate-50">
                        {label}
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 w-full rounded-full bg-slate-800">
                          <div
                            className="h-1.5 rounded-full bg-indigo-400"
                            style={{ width }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right text-[11px] text-slate-300">
                        <div className="font-medium text-slate-50">
                          {count}
                        </div>
                        <div className="text-[10px] text-slate-400">
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
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/40">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Top roles by volume
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Roles attracting the most applications in this window.
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-300">
                {jobsByVolume.length || 0} roles
              </span>
            </div>

            {jobsByVolume.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/70 p-4 text-center text-[11px] text-slate-400">
                No applications in this time window yet. Once roles start
                receiving candidates, you&apos;ll see their relative volume
                here.
              </div>
            ) : (
              <ul className="space-y-2 text-[11px] text-slate-300">
                {jobsByVolume.map((job) => {
                  const width = barWidth(job.applicationCount, maxVolume);
                  const statusLabel = (job.status || "OPEN").toUpperCase();
                  const isOpen =
                    (job.status || "").toLowerCase() === "open";

                  return (
                    <li
                      key={job.id}
                      className="rounded-xl bg-slate-900/60 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[12px] font-medium text-slate-50">
                            {job.title}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {job.clientCompany?.name || "Internal"} ·{" "}
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                isOpen
                                  ? "bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/30"
                                  : "bg-slate-700/50 text-slate-200 ring-1 ring-slate-500/40"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-50">
                            {job.applicationCount}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            applications
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800">
                        <div
                          className="h-1.5 rounded-full bg-sky-400"
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
