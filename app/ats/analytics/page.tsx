// app/ats/analytics/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { requireTenantMembership } from "@/lib/requireTenantMembership";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Analytics",
  description:
    "High-level analytics for jobs, candidates and applications under this ThinkATS tenant.",
};

export default async function AnalyticsPage() {
  const tenant = await getResourcinTenant();

  // Tenant must exist and current user must belong to it
  await requireTenantMembership(tenant.id);

  const jobs = await prisma.job.findMany({
    where: { tenantId: tenant.id },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const jobIds = jobs.map((j) => j.id);

  const [totalCandidates, totalApplications] = await Promise.all([
    prisma.candidate.count({
      where: { tenantId: tenant.id },
    }),
    jobIds.length
      ? prisma.jobApplication.count({
          where: {
            jobId: { in: jobIds },
          },
        })
      : Promise.resolve(0),
  ]);

  const openJobs = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "open",
  ).length;
  const closedJobs = jobs.length - openJobs;

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Analytics
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">
              Tenant analytics
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              High-level view of jobs, candidates and applications under this
              ThinkATS workspace.
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <div className="font-medium text-slate-800">{tenant.name}</div>
            <div className="mt-0.5 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Tenant analytics
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 space-y-4 p-5">
        {/* Summary cards */}
        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">Open jobs</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {openJobs}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {jobs.length} total jobs
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">Closed / filled</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {closedJobs}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Jobs not currently accepting applications
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] text-slate-500">
              Candidates in pool
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {totalCandidates}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Unique people under this tenant
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
              Across all jobs managed here
            </div>
          </div>
        </section>

        {/* Placeholder for deeper analytics */}
        <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-[11px] text-slate-600">
          <h2 className="text-sm font-semibold text-slate-900">
            Deeper analytics coming soon
          </h2>
          <p className="mt-1">
            This surface will later include pipeline breakdowns, source
            performance, scoring tiers and time-to-hire metrics per job.
          </p>
          <p className="mt-1">
            For now, you still have basic visibility into job counts,
            candidate pool size and total application volume for{" "}
            <span className="font-medium text-slate-900">{tenant.name}</span>.
          </p>
        </section>
      </main>
    </div>
  );
}
