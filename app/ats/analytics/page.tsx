// app/ats/analytics/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Analytics | Resourcin",
  description:
    "Pipeline health, application volume, sources, speed metrics and recruiter performance across tenants in ThinkATS.",
};

interface AnalyticsSearchParams {
  tenantId?: string | string[];
  from?: string | string[];
  to?: string | string[];
}

function resolveParam(value: string | string[] | undefined): string {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] ?? "";
  return value;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function normaliseStatus(status: string | null | undefined) {
  return (status || "").toLowerCase();
}

function daysBetween(a: Date, b: Date): number {
  const diffMs = b.getTime() - a.getTime();
  return diffMs <= 0 ? 0 : diffMs / (1000 * 60 * 60 * 24);
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
  // Resolve date range
  // Default: last 30 days if nothing provided
  // -----------------------------
  const rawFrom = resolveParam(searchParams?.from) || null;
  const rawTo = resolveParam(searchParams?.to) || null;

  const now = new Date();
  let fromDate = parseDate(rawFrom);
  let toDate = parseDate(rawTo);

  if (!fromDate && !toDate) {
    // default to last 30 days
    toDate = now;
    fromDate = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000,
    );
  } else {
    // if only one side is missing, fill it sensibly
    if (!fromDate && toDate) {
      fromDate = new Date(
        toDate.getTime() - 30 * 24 * 60 * 60 * 1000,
      );
    }
    if (fromDate && !toDate) {
      toDate = now;
    }
  }

  // Safety fallback
  if (!fromDate) fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (!toDate) toDate = now;

  // Normalise end-of-day for inclusive range
  const toDateInclusive = new Date(toDate);
  toDateInclusive.setHours(23, 59, 59, 999);

  const fromInputValue = fromDate.toISOString().slice(0, 10);
  const toInputValue = toDate.toISOString().slice(0, 10);
  const rangeDays = Math.max(
    1,
    Math.round(daysBetween(fromDate, toDateInclusive)),
  );

  // -----------------------------
  // Load jobs for this tenant (all time)
  // -----------------------------
  const jobs = await prisma.job.findMany({
    where: { tenantId: selectedTenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      hiringManagerId: true,
    },
  });

  const jobIds = jobs.map((j) => j.id);

  const jobsById = new Map<string, (typeof jobs)[number]>();
  jobs.forEach((job) => jobsById.set(job.id, job));

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

  const jobsCreatedInRange = jobs.filter(
    (job) =>
      job.createdAt >= fromDate &&
      job.createdAt <= toDateInclusive,
  ).length;

  // -----------------------------
  // Applications (limited by date range)
  // -----------------------------
  const applications =
    jobIds.length === 0
      ? []
      : await prisma.jobApplication.findMany({
          where: {
            jobId: { in: jobIds },
            createdAt: {
              gte: fromDate,
              lte: toDateInclusive,
            },
          },
          select: {
            id: true,
            jobId: true,
            createdAt: true,
            stage: true,
            source: true,
          },
          orderBy: { createdAt: "desc" },
        });

  const totalApplications = applications.length;
  const totalCandidates = await prisma.candidate.count({
    where: { tenantId: selectedTenantId },
  });

  // -----------------------------
  // Stage distribution
  // -----------------------------
  const stageDefinitions = [
    { key: "APPLIED", label: "Applied" },
    { key: "SCREENING", label: "Screening" },
    { key: "INTERVIEW", label: "Interviewing" },
    { key: "OFFER", label: "Offer" },
    { key: "HIRED", label: "Hired" },
    { key: "REJECTED", label: "Rejected" },
  ];

  const stageBreakdown = stageDefinitions.map((def) => {
    const count = applications.filter(
      (app) => app.stage === def.key,
    ).length;
    return { ...def, count };
  });

  const totalStageCandidates = stageBreakdown.reduce(
    (sum, s) => sum + s.count,
    0,
  );

  // -----------------------------
  // Source effectiveness
  // -----------------------------
  type SourceStat = {
    label: string;
    key: string;
    count: number;
  };

  const sourceMap = new Map<string, number>();

  for (const app of applications) {
    let raw = (app.source || "").trim();
    if (!raw) raw = "Unknown";

    const normalised = raw.toLowerCase();
    let key = normalised;

    if (["linkedin", "linked-in"].includes(normalised)) {
      key = "linkedin";
    } else if (
      ["indeed"].includes(normalised) ||
      normalised.includes("indeed")
    ) {
      key = "indeed";
    } else if (
      ["referral", "employee referral"].includes(
        normalised,
      )
    ) {
      key = "referral";
    } else if (!normalised || normalised === "unknown") {
      key = "unknown";
    }

    const current = sourceMap.get(key) ?? 0;
    sourceMap.set(key, current + 1);
  }

  const sourceStats: SourceStat[] = Array.from(
    sourceMap.entries(),
  )
    .map(([key, count]) => {
      let label = key;
      if (key === "linkedin") label = "LinkedIn";
      if (key === "indeed") label = "Indeed";
      if (key === "referral") label = "Referral";
      if (key === "unknown") label = "Unknown";
      return { key, label, count };
    })
    .sort((a, b) => b.count - a.count);

  const topSources = sourceStats.slice(0, 5);

  // -----------------------------
  // Time-to-hire & time-to-first-application (approx)
  // -----------------------------
  const applicationsByJob = new Map<
    string,
    (typeof applications)[number][]
  >();

  for (const app of applications) {
    const list = applicationsByJob.get(app.jobId) ?? [];
    list.push(app);
    applicationsByJob.set(app.jobId, list);
  }

  const timeToFirstAppDays: number[] = [];
  const timeToHireDays: number[] = [];

  for (const job of jobs) {
    const jobApps = applicationsByJob.get(job.id);
    if (!jobApps || jobApps.length === 0) continue;

    const sortedByCreated = [...jobApps].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    const firstApp = sortedByCreated[0];
    const tFirst = daysBetween(job.createdAt, firstApp.createdAt);
    if (tFirst >= 0) {
      timeToFirstAppDays.push(tFirst);
    }

    const hiredApps = sortedByCreated.filter(
      (app) => app.stage === "HIRED",
    );
    if (hiredApps.length > 0) {
      const firstHired = hiredApps[0];
      const tHire = daysBetween(
        job.createdAt,
        firstHired.createdAt,
      );
      if (tHire >= 0) {
        timeToHireDays.push(tHire);
      }
    }
  }

  const avg = (values: number[]): number | null => {
    if (!values.length) return null;
    const sum = values.reduce((s, v) => s + v, 0);
    return sum / values.length;
  };

  const median = (values: number[]): number | null => {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const midIndex = (sorted.length - 1) / 2;
    const low = Math.floor(midIndex);
    const high = Math.ceil(midIndex);
    if (low === high) return sorted[low];
    return (sorted[low] + sorted[high]) / 2;
  };

  const avgTimeToFirstApp = avg(timeToFirstAppDays);
  const medianTimeToFirstApp = median(timeToFirstAppDays);

  const avgTimeToHire = avg(timeToHireDays);
  const medianTimeToHire = median(timeToHireDays);

  // -----------------------------
  // Recruiter performance (by hiringManagerId) + user lookup
  // -----------------------------
  type RecruiterStat = {
    key: string; // hiringManagerId or "unassigned"
    hiringManagerId: string | null;
    jobCount: number;
    openJobs: number;
    totalApplications: number;
    hires: number;
  };

  const recruiterMap = new Map<string, RecruiterStat>();

  const getKeyForJob = (job: (typeof jobs)[number]) =>
    job.hiringManagerId || "unassigned";

  // seed from jobs
  for (const job of jobs) {
    const key = getKeyForJob(job);
    let stat = recruiterMap.get(key);
    if (!stat) {
      stat = {
        key,
        hiringManagerId: job.hiringManagerId,
        jobCount: 0,
        openJobs: 0,
        totalApplications: 0,
        hires: 0,
      };
      recruiterMap.set(key, stat);
    }

    stat.jobCount += 1;
    if (normaliseStatus(job.status as any) === "open") {
      stat.openJobs += 1;
    }
  }

  // add application volume + hires (only from range)
  for (const app of applications) {
    const job = jobsById.get(app.jobId);
    if (!job) continue;
    const key = getKeyForJob(job);
    let stat = recruiterMap.get(key);
    if (!stat) {
      stat = {
        key,
        hiringManagerId: job.hiringManagerId,
        jobCount: 0,
        openJobs: 0,
        totalApplications: 0,
        hires: 0,
      };
      recruiterMap.set(key, stat);
    }
    stat.totalApplications += 1;
    if (app.stage === "HIRED") {
      stat.hires += 1;
    }
  }

  // Collect unique hiringManagerIds and resolve to User (email only)
  const uniqueHiringManagerIds = Array.from(
    new Set(
      jobs
        .map((j) => j.hiringManagerId)
        .filter((id): id is string => !!id),
    ),
  );

  const users =
    uniqueHiringManagerIds.length === 0
      ? []
      : await prisma.user.findMany({
          where: {
            id: { in: uniqueHiringManagerIds },
          },
          select: {
            id: true,
            email: true,
          },
        });

  const userById = new Map<string, (typeof users)[number]>();
  users.forEach((u) => userById.set(u.id, u));

  const recruiterStats = Array.from(recruiterMap.values())
    .filter((stat) => stat.jobCount > 0 || stat.totalApplications > 0)
    .sort((a, b) => {
      if (b.hires !== a.hires) return b.hires - a.hires;
      return b.totalApplications - a.totalApplications;
    })
    .slice(0, 8);

  // -----------------------------
  // Export URL (CSV)
  // -----------------------------
  const exportHref = (() => {
    const url = new URL(
      "/ats/analytics/export",
      "http://dummy.local",
    );
    url.searchParams.set("tenantId", selectedTenantId);
    url.searchParams.set("from", fromInputValue);
    url.searchParams.set("to", toInputValue);
    return url.pathname + url.search;
  })();

  // -----------------------------
  // Render
  // -----------------------------
  const clearTenantHref = "/ats/analytics";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-0">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            ThinkATS · Analytics
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Funnel health, volume, sources and team performance for{" "}
            <span className="font-medium text-slate-900">
              {selectedTenant.name ??
                selectedTenant.slug ??
                "Resourcin"}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {/* Tenant selector */}
          <form method="GET" className="flex items-center gap-2">
            <input
              type="hidden"
              name="from"
              value={fromInputValue}
            />
            <input
              type="hidden"
              name="to"
              value={toInputValue}
            />

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

          {/* Export */}
          <a
            href={exportHref}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
          >
            ⬇ Export CSV
          </a>
        </div>
      </div>

      {/* Date range filter */}
      <form
        method="GET"
        className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <input
          type="hidden"
          name="tenantId"
          value={selectedTenantId}
        />

        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="font-medium text-slate-700">
              Date range
            </span>
            <div className="flex items-center gap-2">
              <div>
                <label
                  htmlFor="from"
                  className="mr-1 text-[10px] text-slate-500"
                >
                  From
                </label>
                <input
                  id="from"
                  name="from"
                  type="date"
                  defaultValue={fromInputValue}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
              </div>
              <div>
                <label
                  htmlFor="to"
                  className="mr-1 text-[10px] text-slate-500"
                >
                  To
                </label>
                <input
                  id="to"
                  name="to"
                  type="date"
                  defaultValue={toInputValue}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                />
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500">
            Showing applications between{" "}
            <span className="font-medium">
              {fromInputValue}
            </span>{" "}
            and{" "}
            <span className="font-medium">
              {toInputValue}
            </span>{" "}
            ({rangeDays} days).
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center rounded-md bg-[#172965] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#0f1c45]"
        >
          Apply range
        </button>
      </form>

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
            {jobsCreatedInRange} roles created in this period
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Applications in range
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#306B34]">
            {totalApplications}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            ~
            {(totalApplications / rangeDays).toFixed(1)} per day
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

      {/* Main analytics grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        {/* Left column: stages + sources */}
        <div className="space-y-6">
          {/* Stage distribution */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Pipeline stage distribution
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  Where candidates currently sit across your funnel in
                  this period.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#172965]/5 px-2 py-1 text-[10px] font-medium text-[#172965]">
                ThinkATS · Funnel
              </span>
            </div>

            {totalStageCandidates === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
                No applications in this date range. Adjust the range to
                see your funnel.
              </div>
            ) : (
              <div className="space-y-3">
                {stageBreakdown.map((stage) => {
                  const pct =
                    totalStageCandidates > 0
                      ? Math.round(
                          (stage.count /
                            totalStageCandidates) *
                            100,
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

          {/* Source effectiveness */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Source effectiveness
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  Which channels are actually bringing in candidates in
                  this period.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#64C247]/10 px-2 py-1 text-[10px] font-medium text-[#306B34]">
                Volume by source
              </span>
            </div>

            {totalApplications === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
                No applications in this date range. Once candidates
                apply, you’ll see a breakdown by source (LinkedIn,
                referrals, etc.).
              </div>
            ) : topSources.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
                All applications have unknown / empty sources. Consider
                capturing source in your apply flows.
              </div>
            ) : (
              <div className="space-y-2">
                {topSources.map((src) => {
                  const pct = Math.round(
                    (src.count / totalApplications) * 100,
                  );

                  return (
                    <div
                      key={src.key}
                      className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-[11px]"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {src.label}
                        </span>
                        <span className="text-slate-500">
                          {pct}% of applications
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[#172965]">
                        {src.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: funnel summary + time-to-* */}
        <div className="flex flex-col gap-4">
          {/* Funnel snapshot */}
          <div className="rounded-xl border border-slate-200 bg-[#172965] p-4 text-white shadow-sm">
            <h2 className="text-sm font-semibold">
              Funnel snapshot (selected period)
            </h2>
            <p className="mt-1 text-[11px] text-slate-100/80">
              High-level view of volume vs. active roles between the
              selected dates.
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
                  Applications per day (range)
                </dt>
                <dd className="font-semibold text-[#FFC000]">
                  {(totalApplications / rangeDays).toFixed(1)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-100/80">
                  Roles created in range
                </dt>
                <dd className="font-semibold text-[#FFC000]">
                  {jobsCreatedInRange}
                </dd>
              </div>
            </dl>
          </div>

          {/* Time-to-hire block */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-[11px] text-slate-600 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-900">
              Speed metrics (days)
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Time to first application
                </p>
                <p className="mt-1 text-lg font-semibold text-[#172965]">
                  {avgTimeToFirstApp != null
                    ? avgTimeToFirstApp.toFixed(1)
                    : "—"}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Median:{" "}
                  {medianTimeToFirstApp != null
                    ? medianTimeToFirstApp.toFixed(1)
                    : "—"}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Time to hire
                </p>
                <p className="mt-1 text-lg font-semibold text-[#306B34]">
                  {avgTimeToHire != null
                    ? avgTimeToHire.toFixed(1)
                    : "—"}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Median:{" "}
                  {medianTimeToHire != null
                    ? medianTimeToHire.toFixed(1)
                    : "—"}
                </p>
                <p className="mt-2 text-[10px] text-slate-400">
                  Based on jobs with at least one application in{" "}
                  <span className="font-medium">HIRED</span> stage.
                </p>
              </div>
            </div>
          </div>

          {/* How to use */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-[11px] text-slate-600 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-900">
              How to use this view
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>
                Watch for{" "}
                <span className="font-medium">bottlenecks</span> where
                candidates pile up in a single stage.
              </li>
              <li>
                Compare{" "}
                <span className="font-medium">
                  sources and recruiter loads
                </span>{" "}
                before committing SLAs to clients.
              </li>
              <li>
                Use average{" "}
                <span className="font-medium">
                  time-to-first-application
                </span>{" "}
                and{" "}
                <span className="font-medium">time-to-hire</span> as
                benchmarks for ThinkATS performance.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recruiter performance */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Recruiter / owner performance
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Grouped by <code>hiringManagerId</code> on each job,
              enriched with user profiles where available.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-[#FFC000]/10 px-2 py-1 text-[10px] font-medium text-[#8a6000]">
            Early performance view
          </span>
        </div>

        {recruiterStats.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
            No jobs or applications yet linked to hiring managers in
            this tenant. Once roles are assigned, you’ll see per-owner
            volumes and hires.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-1 text-[11px]">
              <thead className="text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="rounded-l-lg bg-slate-50 px-3 py-2 text-left font-medium">
                    Owner
                  </th>
                  <th className="bg-slate-50 px-3 py-2 text-right font-medium">
                    Jobs
                  </th>
                  <th className="bg-slate-50 px-3 py-2 text-right font-medium">
                    Open jobs
                  </th>
                  <th className="bg-slate-50 px-3 py-2 text-right font-medium">
                    Applications (range)
                  </th>
                  <th className="rounded-r-lg bg-slate-50 px-3 py-2 text-right font-medium">
                    Hires (range)
                  </th>
                </tr>
              </thead>
              <tbody>
                {recruiterStats.map((stat) => {
                  const user = stat.hiringManagerId
                    ? userById.get(stat.hiringManagerId)
                    : null;

                  const primaryLabel =
                    user?.email ||
                    (stat.key === "unassigned"
                      ? "Unassigned"
                      : stat.key);

                  const secondaryLabel =
                    stat.hiringManagerId &&
                    stat.hiringManagerId !== primaryLabel
                      ? stat.hiringManagerId
                      : null;

                  return (
                    <tr
                      key={stat.key}
                      className="rounded-lg bg-white text-slate-700 shadow-sm"
                    >
                      <td className="rounded-l-lg px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {primaryLabel}
                          </span>
                          {secondaryLabel && (
                            <span className="text-[10px] text-slate-400">
                              {secondaryLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {stat.jobCount}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {stat.openJobs}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {stat.totalApplications}
                      </td>
                      <td className="rounded-r-lg px-3 py-2 text-right text-[#306B34]">
                        {stat.hires}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
