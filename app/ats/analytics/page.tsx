// app/ats/analytics/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Analytics | Resourcin",
  description:
    "Pipeline health, application volume and stage distribution across tenants in ThinkATS.",
};

interface AnalyticsSearchParams {
  tenantId?: string | string[];
}

function resolveParam(value: string | string[] | undefined): string {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] ?? "";
  return value;
}

function normaliseStatus(status: string | null | undefined) {
  return (status || "").toLowerCase();
}

export default async function AtsAnalyticsPage({
  searchParams,
}: {
  searchParams?: AnalyticsSearchParams;
}) {
  // -----------------------------
  // Resolve tenant context
  // -----------------------------
  const tenantParam = resolveParam(searchParams?.tenantId);

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
  });

  let selectedTenant =
    (tenantParam &&
      tenants.find(
        (t) => t.id === tenantParam || t.slug === tenantParam,
      )) ||
    (await getResourcinTenant());

  if (!selectedTenant) {
    throw new Error("No default tenant found for analytics.");
  }

  const selectedTenantId = selectedTenant.id;

  // -----------------------------
  // Load jobs for this tenant
  // -----------------------------
  const jobs = await prisma.job.findMany({
    where: { tenantId: selectedTenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

  const jobIds = jobs.map((j) => j.id);

  const totalJobs = jobs.length;
  const openJobs = jobs.filter(
    (job) => normaliseStatus(job.status as any) === "open",
  ).length;
  const draftJobs = jobs.filter(
    (job) => normaliseStatus(job.status as any) === "draft",
  ).length;
  const closedJobs = jobs.filter(
    (job) => normaliseStatus(job.status as any) === "closed",
  ).length;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const jobsLast30Days = jobs.filter(
    (job) => job.createdAt >= thirtyDaysAgo,
  ).length;

  // -----------------------------
  // Applications & candidates
  // -----------------------------
  const [totalApplications, newApplicationsLast30Days, totalCandidates] =
    await Promise.all([
      jobIds.length
        ? prisma.jobApplication.count({
            where: { jobId: { in: jobIds } },
          })
        : Promise.resolve(0),
      jobIds.length
        ? prisma.jobApplication.count({
            where: {
              jobId: { in: jobIds },
              createdAt: { gte: thirtyDaysAgo },
            },
          })
        : Promise.resolve(0),
      prisma.candidate.count({
        where: { tenantId: selectedTenantId },
      }),
    ]);

  // -----------------------------
  // Stage distribution
  // (keep in sync with pipeline columns)
  // -----------------------------
  const stageDefinitions = [
    { key: "APPLIED", label: "Applied" },
    { key: "SCREENING", label: "Screening" },
    { key: "INTERVIEW", label: "Interviewing" },
    { key: "OFFER", label: "Offer" },
    { key: "HIRED", label: "Hired" },
    { key: "REJECTED", label: "Rejected" },
  ];

  const stageCounts = await Promise.all(
    stageDefinitions.map((def) =>
      jobIds.length
        ? prisma.jobApplication.count({
            where: {
              jobId: { in: jobIds },
              stage: def.key,
            },
          })
        : Promise.resolve(0),
    ),
  );

  const stageBreakdown = stageDefinitions.map((def, idx) => ({
    ...def,
    count: stageCounts[idx],
  }));

  const totalStageCandidates = stageBreakdown.reduce(
    (sum, s) => sum + s.count,
    0,
  );

  const clearTenantHref = "/ats/analytics";

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-0">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            ThinkATS · Analytics
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Funnel health, application volume and stage distribution for{" "}
            <span className="font-medium text-slate-900">
              {selectedTenant.name ??
                selectedTenant.slug ??
                "Resourcin"}
            </span>
            .
          </p>
        </div>

        {/* Tenant selector */}
        <form method="GET" className="flex items-center gap-2">
          <select
            name="tenantId"
            defaultValue={selectedTenantId}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-700 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name ?? tenant.slug ?? tenant.id}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-[#0f1c45]"
          >
            Switch tenant
          </button>

          {tenantParam && (
            <a
              href={clearTenantHref}
              className="text-[11px] text-slate-500 hover:text-slate-800"
            >
              Clear
            </a>
          )}
        </form>
      </div>

      {/* Top row: hiring snapshot */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Open jobs
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#172965]">
            {openJobs}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {totalJobs} total roles in this tenant
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Draft / Closed
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {draftJobs} / {closedJobs}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {jobsLast30Days} roles created in the last 30 days
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Total applications
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#306B34]">
            {totalApplications}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {newApplicationsLast30Days} in the last 30 days
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Candidates in pool
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#64C247]">
            {totalCandidates}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Unique candidates mapped to this tenant
          </p>
        </div>
      </div>

      {/* Stage distribution + funnel */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        {/* Stage distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Pipeline stage distribution
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Where candidates currently sit across your funnel.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-[#172965]/5 px-2 py-1 text-[10px] font-medium text-[#172965]">
              ThinkATS · Funnel
            </span>
          </div>

          {totalStageCandidates === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
              No applications yet for this tenant. Once candidates start
              applying, you’ll see a breakdown of where they sit in the
              pipeline.
            </div>
          ) : (
            <div className="space-y-3">
              {stageBreakdown.map((stage) => {
                const pct =
                  totalStageCandidates > 0
                    ? Math.round(
                        (stage.count / totalStageCandidates) * 100,
                      )
                    : 0;

                return (
                  <div
                    key={stage.key}
                    className="space-y-1 rounded-md bg-slate-50 p-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {stage.label}
                        </span>
                        <span className="text-slate-400">
                          ({stage.key})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {stage.count}
                        </span>
                        <span className="text-slate-400">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white">
                      <div
                        className="h-1.5 rounded-full bg-[#FFC000]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick funnel summary */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-[#172965] p-4 text-white shadow-sm">
            <h2 className="text-sm font-semibold">
              Funnel snapshot (last 30 days)
            </h2>
            <p className="mt-1 text-[11px] text-slate-100/80">
              High-level view of volume vs. active roles.
            </p>

            <dl className="mt-4 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <dt className="text-slate-100/80">
                  Applications per open job
                </dt>
                <dd className="font-semibold text-[#FFC000]">
                  {openJobs > 0
                    ? (totalApplications / openJobs).toFixed(1)
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-100/80">
                  New applications per day (30d)
                </dt>
                <dd className="font-semibold text-[#FFC000]">
                  {(
                    newApplicationsLast30Days / 30
                  ).toFixed(1)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-100/80">
                  Roles created (30d)
                </dt>
                <dd className="font-semibold text-[#FFC000]">
                  {jobsLast30Days}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-[11px] text-slate-600 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-900">
              How to use this view
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>
                Watch for <span className="font-medium">bottlenecks</span>{" "}
                where candidates pile up in one stage.
              </li>
              <li>
                Compare{" "}
                <span className="font-medium">
                  applications per open job
                </span>{" "}
                across tenants once you’re live with multiple clients.
              </li>
              <li>
                Use this page in{" "}
                <span className="font-medium">
                  weekly hiring reviews
                </span>{" "}
                with founders and hiring managers.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
