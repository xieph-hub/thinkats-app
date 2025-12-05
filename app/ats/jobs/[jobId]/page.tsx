// app/ats/jobs/[jobId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import ApplicationStageStatusInline from "@/components/ats/jobs/ApplicationStageStatusInline";
import { matchesBooleanQuery } from "@/lib/booleanSearch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Job pipeline",
  description: "Pipeline view of candidates for this job.",
};

type PageProps = {
  params: { jobId: string };
  searchParams?: {
    q?: string;
    status?: string;
    tier?: string;
    viewId?: string;
    stage?: string;
    mode?: string;
  };
};

function getTierColor(tier?: string | null) {
  if (!tier) return "bg-slate-100 text-slate-600";
  const upper = tier.toUpperCase();
  if (upper === "A") return "bg-emerald-100 text-emerald-700";
  if (upper === "B") return "bg-sky-100 text-sky-700";
  if (upper === "C") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function scoreColor(score?: number | null) {
  if (score == null) return "bg-slate-100 text-slate-600";
  if (score >= 85) return "bg-emerald-100 text-emerald-700";
  if (score >= 70) return "bg-sky-100 text-sky-700";
  if (score >= 60) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function formatShortDate(d: Date | null | undefined) {
  if (!d) return "–";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function viewFiltersFromJson(raw: unknown): any {
  if (!raw || typeof raw !== "object") return {};
  return raw as any;
}

export default async function JobPipelinePage({
  params,
  searchParams = {},
}: PageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

  const job = await prisma.job.findFirst({
    where: {
      id: params.jobId,
      tenantId: tenant.id,
    },
    include: {
      clientCompany: true,
      stages: {
        orderBy: { position: "asc" },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          candidate: true,
          scoringEvents: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          notes: true,
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const now = new Date();

  // ---------------------------------------------------------------------------
  // Saved views
  // ---------------------------------------------------------------------------
  const rawViewId =
    typeof searchParams.viewId === "string" ? searchParams.viewId : "";

  const savedViewsRaw = await prisma.savedView.findMany({
    where: {
      tenantId: tenant.id,
      scope: "job_pipeline",
    },
    orderBy: { createdAt: "asc" },
  });

  const jobViews = savedViewsRaw.filter((v) => {
    const filters = viewFiltersFromJson(v.filters);
    // either scoped to this job, or generic
    if (filters.jobId && filters.jobId !== job.id) return false;
    return true;
  });

  const viewFromId =
    rawViewId && jobViews.length
      ? jobViews.find((v) => v.id === rawViewId) || null
      : null;

  const defaultView = jobViews.find((v) => v.isDefault) || null;
  const activeView = viewFromId || defaultView || null;

  // ---------------------------------------------------------------------------
  // Base filters (from view first, then overlay query params)
  // ---------------------------------------------------------------------------
  let filterQ = "";
  let filterStage = "ALL";
  let filterStatus = "ALL";
  let filterTier = "ALL";

  if (activeView) {
    const filters = viewFiltersFromJson(activeView.filters);
    if (typeof filters.q === "string") filterQ = filters.q;
    if (typeof filters.stage === "string") filterStage = filters.stage;
    if (typeof filters.status === "string") filterStatus = filters.status;
    if (typeof filters.tier === "string") filterTier = filters.tier;
  }

  // Overlay explicit query params
  if (typeof searchParams.q === "string") {
    filterQ = searchParams.q;
  }

  if (typeof searchParams.stage === "string" && searchParams.stage !== "") {
    filterStage = searchParams.stage;
  }

  if (typeof searchParams.status === "string" && searchParams.status !== "") {
    filterStatus = searchParams.status;
  }

  if (typeof searchParams.tier === "string" && searchParams.tier !== "") {
    filterTier = searchParams.tier;
  }

  const rawMode =
    typeof searchParams.mode === "string" ? searchParams.mode : "kanban";
  const mode = rawMode === "list" ? "list" : "kanban";

  const stageNames =
    job.stages.length > 0
      ? job.stages.map((s) => s.name || "UNASSIGNED")
      : ["NEW", "AI SCREENING", "PHONE SCREEN", "INTERVIEW", "OFFER", "HIRED"];

  const stageOptions = stageNames;

  // Stage counts (for tabs)
  const stageCounts = new Map<string, number>();
  for (const s of stageNames) {
    stageCounts.set(s.toUpperCase(), 0);
  }
  for (const app of job.applications) {
    const stageName = (app.stage || "APPLIED").toUpperCase();
    if (stageCounts.has(stageName)) {
      stageCounts.set(stageName, (stageCounts.get(stageName) || 0) + 1);
    }
  }

  type DecoratedApp = (typeof job.applications)[number] & {
    _score: number | null;
    _tier: string | null;
    _engine: string | null;
  };

  const columns: { name: string; apps: DecoratedApp[] }[] = stageNames.map(
    (name) => ({ name, apps: [] }),
  );
  const unassigned: DecoratedApp[] = [];

  for (const app of job.applications) {
    const latestScore = app.scoringEvents[0] ?? null;
    const score =
      (latestScore?.score as number | null | undefined) ??
      (app.matchScore as number | null | undefined) ??
      null;
    const tier =
      (latestScore?.tier as string | null | undefined) ?? null;
    const engine =
      (latestScore?.engine as string | null | undefined) ?? null;

    const decorated: DecoratedApp = {
      ...app,
      _score: score,
      _tier: tier,
      _engine: engine,
    };

    // Keyword + boolean search
    const haystack = [
      app.fullName,
      app.email,
      app.location,
      app.linkedinUrl,
      app.source,
      app.candidate?.currentTitle,
      app.candidate?.currentCompany,
    ]
      .filter(Boolean)
      .join(" ");

    const matchesQuery = matchesBooleanQuery(filterQ, {
      haystack,
      fields: {
        name: app.fullName || "",
        email: app.email || "",
        location: app.location || "",
        source: app.source || "",
        stage: app.stage || "",
        status: app.status || "",
        tier: tier || "",
      },
    });

    if (!matchesQuery) continue;

    // Status filter
    if (
      filterStatus !== "ALL" &&
      (app.status || "").toUpperCase() !== filterStatus.toUpperCase()
    ) {
      continue;
    }

    // Tier filter
    if (
      filterTier !== "ALL" &&
      (tier || "").toUpperCase() !== filterTier.toUpperCase()
    ) {
      continue;
    }

    // Stage filter
    const stageName = (app.stage || "APPLIED").toUpperCase();
    if (filterStage !== "ALL" && stageName !== filterStage.toUpperCase()) {
      continue;
    }

    const col = columns.find(
      (c) => c.name.toUpperCase() === stageName.toUpperCase(),
    );
    if (col) {
      col.apps.push(decorated);
    } else {
      unassigned.push(decorated);
    }
  }

  if (unassigned.length > 0) {
    columns.push({ name: "UNASSIGNED", apps: unassigned });
  }

  const allVisibleApplicationIds = columns.flatMap((c) =>
    c.apps.map((a) => a.id),
  );
  const visibleAppsFlat: DecoratedApp[] = columns.flatMap((c) => c.apps);

  const uniqueTiers = Array.from(
    new Set(
      job.applications
        .flatMap((a) => a.scoringEvents)
        .map((e) => (e?.tier as string | null | undefined) || null)
        .filter(Boolean) as string[],
    ),
  ).sort();

  const currentViewId =
    typeof searchParams.viewId === "string"
      ? searchParams.viewId
      : activeView?.id || "";

  // ---------------------------------------------------------------------------
  // Job header metrics
  // ---------------------------------------------------------------------------
  const totalApplications = job.applications.length;

  const activeStatuses = ["PENDING", "SCREENING", "INTERVIEW", "OFFER"];
  const activeInPipeline = job.applications.filter((a) =>
    activeStatuses.includes((a.status || "PENDING").toUpperCase()),
  ).length;

  const interviewReady = job.applications.filter((a) => {
    const s = (a.stage || "").toUpperCase();
    const status = (a.status || "").toUpperCase();
    return s.includes("INTERVIEW") || status === "INTERVIEW";
  }).length;

  let avgDaysInPipeline = 0;
  if (totalApplications > 0) {
    const totalDays = job.applications.reduce((acc, a) => {
      const created = a.createdAt ?? now;
      const diffMs = now.getTime() - created.getTime();
      return acc + diffMs / (1000 * 60 * 60 * 24);
    }, 0);
    avgDaysInPipeline = Math.round(totalDays / totalApplications);
  }

  const tenantPlan = (tenant as any).plan as string | undefined;

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-50">
      {/* Header with job overview + metrics */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/ats/jobs" className="hover:underline">
              Jobs
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-700">
              {job.title}
            </span>
          </div>
          <div className="flex flex-col items-end text-right text-[11px] text-slate-500">
            <span>
              Tenant:{" "}
              <span className="font-medium text-slate-700">
                {tenant.name}
              </span>
            </span>
            {tenantPlan && (
              <span className="mt-0.5 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-700">
                Plan: {tenantPlan}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-slate-900">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              {job.department && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {job.department}
                </span>
              )}
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {job.location}
                </span>
              )}
              {job.clientCompany && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {job.clientCompany.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Posted {formatShortDate(job.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <button className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700 hover:bg-slate-50">
              Export
            </button>
            <button className="inline-flex h-8 items-center rounded-full bg-indigo-600 px-3 text-[11px] font-semibold text-white hover:bg-indigo-500">
              Add candidate
            </button>
          </div>
        </div>

        {/* Stat tiles row */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-sky-50 px-4 py-3">
            <div className="text-[11px] font-medium text-sky-700">
              Total applications
            </div>
            <div className="mt-1 text-2xl font-semibold text-sky-900">
              {totalApplications}
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3">
            <div className="text-[11px] font-medium text-emerald-700">
              Active in pipeline
            </div>
            <div className="mt-1 text-2xl font-semibold text-emerald-900">
              {activeInPipeline}
            </div>
          </div>
          <div className="rounded-2xl bg-violet-50 px-4 py-3">
            <div className="text-[11px] font-medium text-violet-700">
              Interview ready
            </div>
            <div className="mt-1 text-2xl font-semibold text-violet-900">
              {interviewReady}
            </div>
          </div>
          <div className="rounded-2xl bg-amber-50 px-4 py-3">
            <div className="text-[11px] font-medium text-amber-700">
              Avg. days in pipeline
            </div>
            <div className="mt-1 text-2xl font-semibold text-amber-900">
              {avgDaysInPipeline}
            </div>
          </div>
        </div>
      </header>

      {/* Controls: stage tabs + filters + views */}
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        {/* Stage tabs (All + per-stage) */}
        <form
          method="GET"
          className="mb-3 flex items-center gap-2 overflow-x-auto text-xs"
        >
          {/* Keep current filters + mode when changing stage */}
          <input type="hidden" name="q" value={filterQ} />
          <input type="hidden" name="status" value={filterStatus} />
          <input type="hidden" name="tier" value={filterTier} />
          <input type="hidden" name="viewId" value={currentViewId} />
          <input type="hidden" name="mode" value={mode} />

          <button
            type="submit"
            name="stage"
            value="ALL"
            className={[
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px]",
              filterStage === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100",
            ].join(" ")}
          >
            <span>All candidates</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
              {totalApplications}
            </span>
          </button>

          {stageNames.map((stage) => {
            const upper = stage.toUpperCase();
            const count = stageCounts.get(upper) || 0;
            const isActive =
              filterStage.toUpperCase() === upper && filterStage !== "ALL";

            return (
              <button
                key={stage}
                type="submit"
                name="stage"
                value={upper}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px]",
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100",
                ].join(" ")}
              >
                <span>{stage}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                  {count}
                </span>
              </button>
            );
          })}
        </form>

        {/* Filters + view selector + view mode toggle */}
        <form
          className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
          method="GET"
        >
          <div className="flex flex-wrap items-end gap-2 text-xs">
            {/* View selector */}
            <div className="flex flex-col">
              <label className="mb-1 text-[11px] text-slate-600">
                View
              </label>
              <select
                name="viewId"
                defaultValue={currentViewId}
                className="h-8 min-w-[140px] rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
              >
                <option value="">All candidates</option>
                {jobViews.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.isDefault ? " · default" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex flex-col">
              <label className="mb-1 text-[11px] text-slate-600">
                Search candidates
              </label>
              <input
                type="text"
                name="q"
                defaultValue={filterQ}
                placeholder='e.g. "data engineer" email:gmail.com -contract'
                className="h-8 w-64 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col">
              <label className="mb-1 text-[11px] text-slate-600">
                Status
              </label>
              <select
                name="status"
                defaultValue={filterStatus}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
              >
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="SCREENING">Screening</option>
                <option value="INTERVIEW">Interview</option>
                <option value="OFFER">Offer</option>
                <option value="HIRED">Hired</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Tier */}
            <div className="flex flex-col">
              <label className="mb-1 text-[11px] text-slate-600">
                Tier
              </label>
              <select
                name="tier"
                defaultValue={filterTier}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
              >
                <option value="ALL">All</option>
                {uniqueTiers.map((t) => (
                  <option key={t} value={t.toUpperCase()}>
                    Tier {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View mode toggle + apply/reset */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5">
              <button
                type="submit"
                name="mode"
                value="kanban"
                className={[
                  "h-7 rounded-full px-3 text-[11px]",
                  mode === "kanban"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100",
                ].join(" ")}
              >
                Kanban
              </button>
              <button
                type="submit"
                name="mode"
                value="list"
                className={[
                  "h-7 rounded-full px-3 text-[11px]",
                  mode === "list"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100",
                ].join(" ")}
              >
                List
              </button>
            </div>

            <button
              type="submit"
              name="mode"
              value={mode}
              className="inline-flex h-8 items-center rounded-full bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
            >
              Apply filters
            </button>
            <Link
              href={`/ats/jobs/${job.id}`}
              className="inline-flex h-8 items-center rounded-full border border-slate-300 bg-white px-3 text-[11px] text-slate-600 hover:bg-slate-100"
            >
              Reset
            </Link>
          </div>
        </form>

        {/* Save current filters as a named view */}
        <form
          action="/api/ats/views"
          method="POST"
          className="mt-3 flex flex-wrap items-end gap-2 text-xs"
        >
          <input type="hidden" name="scope" value="job_pipeline" />
          <input type="hidden" name="jobId" value={job.id} />
          <input
            type="hidden"
            name="redirectTo"
            value={`/ats/jobs/${job.id}`}
          />
          <input type="hidden" name="q" value={filterQ} />
          <input type="hidden" name="stage" value={filterStage} />
          <input type="hidden" name="status" value={filterStatus} />
          <input type="hidden" name="tier" value={filterTier} />

          <div className="flex flex-col">
            <label className="mb-1 text-[11px] text-slate-600">
              Save current filters as view
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Tier A · Interview ready"
              className="h-8 w-56 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
            />
          </div>

          <label className="mb-1 flex items-center gap-1 text-[11px] text-slate-600">
            <input
              type="checkbox"
              name="setDefault"
              className="h-3 w-3 rounded border-slate-400"
            />
            <span>Set as default view for this job</span>
          </label>

          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-full bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
          >
            Save view
          </button>
        </form>
      </div>

      {/* Pipeline / list + bulk move bar */}
      <form
        action="/api/ats/applications/bulk-stage"
        method="POST"
        className="flex flex-1 flex-col overflow-hidden"
      >
        <input type="hidden" name="jobId" value={job.id} />
        <input
          type="hidden"
          name="visibleApplicationIds"
          value={allVisibleApplicationIds.join(",")}
        />

        {/* Main board */}
        <div className="flex-1 overflow-x-auto bg-slate-50 px-4 py-4">
          {mode === "kanban" ? (
            <div className="flex min-w-full gap-4">
              {columns.map((column) => (
                <div
                  key={column.name}
                  className="flex min-w-[260px] max-w-xs flex-1 flex-col rounded-2xl border border-slate-200 bg-slate-950/95 text-slate-50"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                        {column.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {column.apps.length}{" "}
                        {column.apps.length === 1
                          ? "candidate"
                          : "candidates"}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                    {column.apps.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-3 text-center text-[11px] text-slate-500">
                        No candidates in this stage yet.
                      </div>
                    )}

                    {column.apps.map((app) => (
                      <article
                        key={app.id}
                        className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-100"
                      >
                        {/* Top row: checkbox + name + score/tier */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              name="applicationIds"
                              value={app.id}
                              className="mt-1 h-3 w-3 rounded border-slate-500 text-slate-900"
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-[13px] font-semibold">
                                  {app.fullName}
                                </span>
                                {app._tier && (
                                  <span
                                    className={[
                                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                      getTierColor(app._tier),
                                    ].join(" ")}
                                  >
                                    Tier {app._tier}
                                  </span>
                                )}
                                {app._score != null && (
                                  <span
                                    className={[
                                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                                      scoreColor(app._score),
                                    ].join(" ")}
                                  >
                                    Score {app._score}
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 text-[11px] text-slate-400">
                                {app.email}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Meta row: location, source, applied date */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          {app.location && (
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                              {app.location}
                            </span>
                          )}
                          {app.source && (
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                              Source: {app.source}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                            Applied: {formatShortDate(app.createdAt)}
                          </span>
                        </div>

                        {/* Inline stage / status editor */}
                        <ApplicationStageStatusInline
                          applicationId={app.id}
                          currentStage={app.stage}
                          currentStatus={app.status}
                          stageOptions={stageOptions}
                        />

                        {/* Match reason */}
                        {app.matchReason && (
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">
                            {app.matchReason}
                          </p>
                        )}

                        {/* Activity + quick actions */}
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                          <div className="flex flex-wrap items-center gap-2">
                            {app.candidate?.currentTitle && (
                              <span className="inline-flex items-center gap-1">
                                <span className="h-1 w-1 rounded-full bg-slate-500" />
                                {app.candidate.currentTitle}
                              </span>
                            )}
                            {app.notes.length > 0 && (
                              <span className="inline-flex items-center gap-1">
                                📝 {app.notes.length} note
                                {app.notes.length === 1 ? "" : "s"}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-slate-700"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="rounded-full bg-emerald-700/80 px-2 py-0.5 text-[10px] text-emerald-50 hover:bg-emerald-600"
                            >
                              Advance
                            </button>
                            <button
                              type="button"
                              className="rounded-full bg-rose-700/80 px-2 py-0.5 text-[10px] text-rose-50 hover:bg-rose-600"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-slate-700"
                            >
                              Email
                            </button>
                            <button
                              type="button"
                              className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-slate-700"
                            >
                              Schedule
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List view
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              {visibleAppsFlat.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[11px] text-slate-500">
                  No candidates match the current filters. Adjust your
                  search or clear filters to see more results.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-fixed text-left text-[11px] text-slate-600">
                    <thead className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="w-8 py-2 pr-2" />
                        <th className="w-40 py-2 pr-2">Candidate</th>
                        <th className="w-24 py-2 pr-2 text-right">
                          Score / Tier
                        </th>
                        <th className="w-28 py-2 pr-2">Stage</th>
                        <th className="w-28 py-2 pr-2">Status</th>
                        <th className="w-40 py-2 pr-2">Source</th>
                        <th className="w-32 py-2 pr-2">Location</th>
                        <th className="w-32 py-2 pr-2">Applied</th>
                        <th className="w-40 py-2 pr-2 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleAppsFlat.map((app) => (
                        <tr
                          key={app.id}
                          className="border-b border-slate-50 last:border-0"
                        >
                          <td className="py-2 pr-2 align-middle">
                            <input
                              type="checkbox"
                              name="applicationIds"
                              value={app.id}
                              className="h-3 w-3 rounded border-slate-400"
                            />
                          </td>
                          <td className="py-2 pr-2 align-middle">
                            <div className="flex flex-col">
                              <span className="text-[12px] font-medium text-slate-800">
                                {app.fullName}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {app.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 pr-2 text-right align-middle">
                            <div className="inline-flex flex-col items-end gap-1">
                              {app._score != null && (
                                <span
                                  className={[
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                                    scoreColor(app._score),
                                  ].join(" ")}
                                >
                                  {app._score}
                                </span>
                              )}
                              {app._tier && (
                                <span
                                  className={[
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                    getTierColor(app._tier),
                                  ].join(" ")}
                                >
                                  Tier {app._tier}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 pr-2 align-middle text-[11px] text-slate-700">
                            {app.stage || "APPLIED"}
                          </td>
                          <td className="py-2 pr-2 align-middle text-[11px] text-slate-700">
                            {app.status || "PENDING"}
                          </td>
                          <td className="py-2 pr-2 align-middle text-[11px] text-slate-700">
                            {app.source || "—"}
                          </td>
                          <td className="py-2 pr-2 align-middle text-[11px] text-slate-700">
                            {app.location || "—"}
                          </td>
                          <td className="py-2 pr-2 align-middle text-[11px] text-slate-700">
                            {formatShortDate(app.createdAt)}
                          </td>
                          <td className="py-2 pr-2 text-right align-middle">
                            <div className="inline-flex flex-wrap items-center justify-end gap-1">
                              <button
                                type="button"
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-200"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-emerald-50 hover:bg-emerald-500"
                              >
                                Advance
                              </button>
                              <button
                                type="button"
                                className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] text-rose-50 hover:bg-rose-500"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bulk move bar */}
        <div className="border-t border-slate-200 bg-white px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
            <div>
              <span className="font-medium text-slate-800">
                Bulk actions
              </span>{" "}
              <span className="text-slate-500">
                Select candidates above, then move them to a new stage.
                Bulk email + tagging can plug in here later.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                name="stage"
                className="h-8 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
              >
                <option value="">Select stage…</option>
                {stageNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800"
              >
                Move selected
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
