// app/ats/analytics/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Analytics",
  description:
    "Pipeline metrics, conversion and source analytics for this ATS workspace.",
};

function formatDate(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function AnalyticsPage() {
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

  const jobs = await prisma.job.findMany({
    where: {
      tenantId: tenant.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      clientCompany: true,
      applications: true,
    },
  });

  const allApps = jobs.flatMap((j) => j.applications);

  const totalJobs = jobs.length;
  const openJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "open",
  ).length;

  const totalApplications = allApps.length;
  const hiredCount = allApps.filter(
    (a) => (a.status || "").toUpperCase() === "HIRED",
  ).length;
  const rejectedCount = allApps.filter(
    (a) => (a.status || "").toUpperCase() === "REJECTED",
  ).length;

  const offerCount = allApps.filter(
    (a) => (a.stage || "").toUpperCase() === "OFFER",
  ).length;

  // Source analytics
  const sourceMap = new Map<string, number>();
  for (const app of allApps) {
    const key = (app.source || "Unknown").trim() || "Unknown";
    sourceMap.set(key, (sourceMap.get(key) || 0) + 1);
  }
  const sourceStats = Array.from(sourceMap.entries()).sort(
    (a, b) => b[1] - a[1],
  );

  // Per-job pipeline snapshot
  const stageOrder = [
    "APPLIED",
    "SCREENING",
    "INTERVIEW",
    "OFFER",
    "HIRED",
    "REJECTED",
  ];

  const jobSnapshots = jobs.map((job) => {
    const apps = job.applications;

    const stageCounts = new Map<string, number>();
    for (const stage of stageOrder) {
      stageCounts.set(stage, 0);
    }

    let lastAppDate: Date | null = null;

    for (const app of apps) {
      const stage = (app.stage || "APPLIED").toUpperCase();
      stageCounts.set(stage, (stageCounts.get(stage) || 0) + 1);

      if (!lastAppDate || app.createdAt > lastAppDate) {
        lastAppDate = app.createdAt;
      }
    }

    return {
      job,
      applications: apps.length,
      stageCounts,
      lastAppDate,
      hired: apps.filter(
        (a) => (a.status || "").toUpperCase() === "HIRED",
      ).length,
      rejected: apps.filter(
        (a) => (a.status || "").toUpperCase() === "REJECTED",
      ).length,
    };
  });

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/ats" className="hover:underline">
            Workspace
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">
            Analytics
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-slate-900">
              Analytics &amp; reporting
            </h1>
            <p className="text-[11px] text-slate-500">
              High-level view of pipeline health, conversion and top
              candidate sources across this ATS tenant.
            </p>
          </div>
          <div className="flex flex-col items-end text-right text-[11px] text-slate-500">
            <span>Tenant: {tenant.name}</span>
            <span className="text-[10px] text-slate-400">
              Plan: {tenant.plan}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col gap-4 px-5 py-4">
        {/* Summary cards */}
        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] text-slate-500">
              Open jobs
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {openJobs}{" "}
              <span className="text-xs font-normal text-slate-400">
                / {totalJobs} total
              </span>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] text-slate-500">
              Applications
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {totalApplications}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Hired: {hiredCount} · Rejected: {rejectedCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] text-slate-500">
              Offer funnel
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {offerCount}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Applications → Offer → Hired snapshot.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] text-slate-500">
              Top sources
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {sourceStats.length}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Unique sources contributing to your pipeline.
            </p>
          </div>
        </section>

        {/* Two-column layout: jobs + sources */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
          {/* Per-job pipeline stats */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pipeline by job
              </h2>
              <span className="text-[11px] text-slate-400">
                {jobs.length} jobs
              </span>
            </div>

            {jobs.length === 0 ? (
              <p className="text-xs text-slate-500">
                No jobs yet. Create a job to start seeing pipeline
                analytics here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Job</th>
                      <th className="px-3 py-2 text-left">
                        Applications
                      </th>
                      <th className="px-3 py-2 text-left">
                        Stage snapshot
                      </th>
                      <th className="px-3 py-2 text-left">Hired</th>
                      <th className="px-3 py-2 text-left">
                        Last application
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobSnapshots.map(
                      ({
                        job,
                        applications,
                        stageCounts,
                        lastAppDate,
                        hired,
                        rejected,
                      }) => (
                        <tr key={job.id} className="align-top">
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-0.5">
                              <Link
                                href={`/ats/jobs/${job.id}`}
                                className="text-[13px] font-semibold text-slate-900 hover:underline"
                              >
                                {job.title || "Untitled role"}
                              </Link>
                              <div className="text-[11px] text-slate-500">
                                {job.clientCompany?.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[11px] text-slate-700">
                            {applications}
                            {applications > 0 && (
                              <span className="text-[10px] text-slate-400">
                                {" "}
                                · Hired {hired} · Rejected {rejected}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[11px] text-slate-700">
                            <div className="flex flex-wrap gap-1">
                              {stageOrder.map((stage) => {
                                const count =
                                  stageCounts.get(stage) || 0;
                                if (count === 0) return null;
                                return (
                                  <span
                                    key={stage}
                                    className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
                                  >
                                    {stage}: {count}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[11px] text-slate-700">
                            {hired || "—"}
                          </td>
                          <td className="px-3 py-2 text-[11px] text-slate-600">
                            {lastAppDate
                              ? formatDate(lastAppDate)
                              : "—"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Source analytics */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Source analytics
              </h2>
              <span className="text-[11px] text-slate-400">
                By application count (all time)
              </span>
            </div>

            {sourceStats.length === 0 ? (
              <p className="text-xs text-slate-500">
                No applications yet, so we don&apos;t have source data
                to show.
              </p>
            ) : (
              <div className="space-y-2">
                {sourceStats.map(([source, count]) => {
                  const share =
                    totalApplications > 0
                      ? Math.round(
                          (count / totalApplications) * 100,
                        )
                      : 0;
                  return (
                    <div
                      key={source}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-2"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-700">
                        <span className="font-medium">
                          {source}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {count} apps · {share}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
