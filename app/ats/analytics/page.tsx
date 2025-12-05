// app/ats/analytics/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Analytics",
  description: "Hiring pipeline and sourcing analytics for this tenant.",
};

type PageProps = {
  searchParams?: {
    range?: string; // "7d" | "30d" | "90d" | "all"
  };
};

function resolveRange(range?: string) {
  const now = new Date();

  if (range === "all") {
    return {
      label: "All time",
      from: null as Date | null,
      to: now,
    };
  }

  const map: Record<string, { days: number; label: string }> = {
    "7d": { days: 7, label: "Last 7 days" },
    "30d": { days: 30, label: "Last 30 days" },
    "90d": { days: 90, label: "Last 90 days" },
  };

  const conf = map[range ?? "30d"] ?? map["30d"];
  const from = new Date(now);
  from.setDate(now.getDate() - conf.days);

  return {
    label: conf.label,
    from,
    to: now,
  };
}

export default async function AnalyticsPage({ searchParams = {} }: PageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

  const { from, to, label } = resolveRange(searchParams.range);

  // Build where clause for applications
  const appWhere: any = {
    job: {
      tenantId: tenant.id,
    },
  };

  if (from) {
    appWhere.createdAt = {
      gte: from,
      lte: to,
    };
  }

  const [totalJobs, applications] = await Promise.all([
    prisma.job.count({
      where: {
        tenantId: tenant.id,
      },
    }),
    prisma.jobApplication.findMany({
      where: appWhere,
      select: {
        stage: true,
        source: true,
        jobId: true,
        job: {
          select: {
            title: true,
          },
        },
      },
    }),
  ]);

  const totalApplications = applications.length;

  // Aggregate in JS for now (good enough for v1, we can optimize later)
  const stageCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  const jobCounts = new Map<string, { title: string; count: number }>();

  for (const app of applications) {
    const stage = (app.stage || "APPLIED").toUpperCase();
    stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);

    const sourceKey = (app.source || "Unknown").trim() || "Unknown";
    sourceCounts.set(sourceKey, (sourceCounts.get(sourceKey) ?? 0) + 1);

    const jobId = app.jobId;
    if (!jobCounts.has(jobId)) {
      jobCounts.set(jobId, {
        title: app.job?.title || "Untitled role",
        count: 0,
      });
    }
    const current = jobCounts.get(jobId)!;
    current.count += 1;
  }

  const stageSummary = Array.from(stageCounts.entries())
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);

  const sourceSummary = Array.from(sourceCounts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const jobSummary = Array.from(jobCounts.entries())
    .map(([jobId, v]) => ({
      jobId,
      jobTitle: v.title,
      count: v.count,
    }))
    .sort((a, b) => b.count - a.count);

  // Plan is on the DB model but not declared on TenantRow type,
  // so we read it via a safe cast to avoid TS error.
  const planLabel =
    ((tenant as any).plan as string | undefined) ?? "free";

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/ats/jobs" className="hover:underline">
            ATS
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">Analytics</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Hiring analytics
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Snapshot of your jobs and pipeline performance.{" "}
              <span className="font-medium text-slate-700">{label}</span>
              {from && (
                <>
                  {" "}
                  · Applications created from{" "}
                  {from.toISOString().slice(0, 10)}
                </>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end text-right text-[11px] text-slate-500">
            <span>Tenant: {tenant.name}</span>
            <span className="text-[10px] text-slate-400">
              Plan: {planLabel}
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex flex-1 flex-col bg-slate-50 px-5 py-4">
        {/* Range selector */}
        <form className="mb-4 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-slate-600">Time range:</span>
          <select
            name="range"
            defaultValue={searchParams.range || "30d"}
            className="h-8 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800"
          >
            Apply
          </button>
        </form>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* Left: summary + stages */}
          <section className="space-y-4">
            {/* Summary tiles */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Open jobs
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {totalJobs}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Active roles under this tenant.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Applications in range
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {totalApplications}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  New applications {from ? "in this window" : "all time"}.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Active stages
                </div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {stageSummary.length}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Unique pipeline stages with activity.
                </p>
              </div>
            </div>

            {/* Stage breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Pipeline by stage
                </h2>
                <span className="text-[10px] text-slate-400">
                  Ordered by volume
                </span>
              </div>

              {stageSummary.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  No applications found in this range yet.
                </p>
              ) : (
                <div className="space-y-2 text-[11px]">
                  {stageSummary.map((row) => (
                    <div
                      key={row.stage}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-16 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold uppercase tracking-wide text-slate-50">
                          {row.stage}
                        </span>
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-slate-900"
                            style={{
                              width:
                                totalApplications > 0
                                  ? `${Math.max(
                                      (row.count / totalApplications) * 100,
                                      6, // minimum visible bar
                                    ).toFixed(0)}%`
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {row.count}
                        </span>{" "}
                        <span className="text-slate-400">apps</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Right: sources + top jobs */}
          <section className="space-y-4">
            {/* Source breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Applications by source
                </h2>
              </div>

              {sourceSummary.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  Once you start capturing sources (Job board, Referral,
                  LinkedIn, etc.), they will show here.
                </p>
              ) : (
                <ul className="space-y-2 text-[11px]">
                  {sourceSummary.map((row) => (
                    <li
                      key={row.source}
                      className="flex items-center justify-between"
                    >
                      <span className="text-slate-700">{row.source}</span>
                      <span className="text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {row.count}
                        </span>{" "}
                        apps
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Top roles by volume */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Top roles by applications
                </h2>
              </div>

              {jobSummary.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  No applications in this period yet.
                </p>
              ) : (
                <ul className="space-y-2 text-[11px]">
                  {jobSummary.slice(0, 5).map((row) => (
                    <li
                      key={row.jobId}
                      className="flex items-center justify-between gap-2"
                    >
                      <Link
                        href={`/ats/jobs/${row.jobId}`}
                        className="truncate text-slate-800 hover:underline"
                      >
                        {row.jobTitle}
                      </Link>
                      <span className="shrink-0 text-slate-600">
                        <span className="font-semibold text-slate-900">
                          {row.count}
                        </span>{" "}
                        apps
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
