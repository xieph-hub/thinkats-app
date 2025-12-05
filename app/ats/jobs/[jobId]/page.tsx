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
    stage?: string;
    status?: string;
    tier?: string;
    viewId?: string;
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
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 65) return "bg-sky-100 text-sky-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
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
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  // Load saved views for this job
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
    const params = (v.params || {}) as any;
    return params.jobId === job.id;
  });

  const viewFromId =
    rawViewId && jobViews.length
      ? jobViews.find((v) => v.id === rawViewId) || null
      : null;

  const defaultView =
    jobViews.find((v) => v.isDefault) || null;

  const activeView = viewFromId || defaultView || null;

  // Base filters
  let filterQ = "";
  let filterStage = "ALL";
  let filterStatus = "ALL";
  let filterTier = "ALL";

  if (activeView) {
    const params = (activeView.params || {}) as any;
    if (typeof params.q === "string") filterQ = params.q;
    if (typeof params.stage === "string")
      filterStage = params.stage;
    if (typeof params.status === "string")
      filterStatus = params.status;
    if (typeof params.tier === "string") filterTier = params.tier;
  }

  // Overlay explicit query params
  if (typeof searchParams.q === "string") {
    filterQ = searchParams.q;
  }

  if (
    typeof searchParams.stage === "string" &&
    searchParams.stage !== ""
  ) {
    filterStage = searchParams.stage;
  }

  if (
    typeof searchParams.status === "string" &&
    searchParams.status !== ""
  ) {
    filterStatus = searchParams.status;
  }

  if (
    typeof searchParams.tier === "string" &&
    searchParams.tier !== ""
  ) {
    filterTier = searchParams.tier;
  }

  const stageNames =
    job.stages.length > 0
      ? job.stages.map((s) => s.name || "UNASSIGNED")
      : ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

  const stageOptions = stageNames;

  type DecoratedApp = (typeof job.applications)[number] & {
    _score: number | null;
    _tier: string | null;
    _engine: string | null;
  };

  const columns: { name: string; apps: DecoratedApp[] }[] =
    stageNames.map((name) => ({ name, apps: [] }));
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

    // status filter
    if (
      filterStatus !== "ALL" &&
      (app.status || "").toUpperCase() !==
        filterStatus.toUpperCase()
    ) {
      continue;
    }

    // tier filter
    if (
      filterTier !== "ALL" &&
      (tier || "").toUpperCase() !== filterTier.toUpperCase()
    ) {
      continue;
    }

    const stageName = (app.stage || "APPLIED").toUpperCase();
    if (
      filterStage !== "ALL" &&
      stageName !== filterStage.toUpperCase()
    ) {
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

  const uniqueTiers = Array.from(
    new Set(
      job.applications
        .flatMap((a) => a.scoringEvents)
        .map(
          (e) =>
            (e?.tier as string | null | undefined) || null,
        )
        .filter(Boolean) as string[],
    ),
  ).sort();

  const currentViewId =
    typeof searchParams.viewId === "string"
      ? searchParams.viewId
      : activeView?.id || "";

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/ats/jobs" className="hover:underline">
            Jobs
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">
            {job.title}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-slate-900">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              {job.clientCompany && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {job.clientCompany.name}
                </span>
              )}
              {job.location && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {job.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                {job.applications.length} applications
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end text-right text-[11px] text-slate-500">
            <span>
              Tenant plan:{" "}
              <span className="font-medium capitalize">
                {tenant.plan}
              </span>
            </span>
            {activeView && (
              <span className="mt-0.5 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                Active view: {activeView.name}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Filters + bulk bar + saved views */}
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          {/* Filters */}
          <form
            className="flex flex-wrap items-end gap-2 text-xs"
            method="GET"
          >
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

            <div className="flex flex-col">
              <label className="mb-1 text-[11px] text-slate-600">
                Search
              </label>
              <input
                type="text"
                name="q"
                defaultValue={filterQ}
                placeholder='e.g. "senior engineer" email:gmail.com -contract'
                className="h-8 w-56 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-[11px] text-slate-600">
                Stage
              </label>
              <select
                name="stage"
                defaultValue={filterStage}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
              >
                <option value="ALL">All</option>
                {stageNames.map((s) => (
                  <option key={s} value={s.toUpperCase()}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

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

            <button
              type="submit"
              className="mt-5 inline-flex h-8 items-center rounded-full bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
            >
              Apply filters
            </button>
            <Link
              href={`/ats/jobs/${job.id}`}
              className="mt-5 inline-flex h-8 items-center rounded-full border border-slate-300 bg-white px-3 text-[11px] text-slate-600 hover:bg-slate-100"
            >
              Reset
            </Link>
          </form>

          {/* Bulk info */}
          <div className="flex flex-col items-end text-[11px] text-slate-500">
            <span>
              Visible applications:{" "}
              <span className="font-semibold text-slate-700">
                {allVisibleApplicationIds.length}
              </span>
            </span>
            <span className="text-[10px]">
              Use the checkboxes below + bulk move bar to update stages.
            </span>
          </div>
        </div>

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

      {/* Pipeline + bulk move form */}
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

        <div className="flex-1 overflow-x-auto bg-slate-50 px-4 py-4">
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
                      </div>

                      <ApplicationStageStatusInline
                        applicationId={app.id}
                        currentStage={app.stage}
                        currentStatus={app.status}
                        stageOptions={stageOptions}
                      />

                      {app.matchReason && (
                        <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">
                          {app.matchReason}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bulk move bar */}
        <div className="border-t border-slate-200 bg-white px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
            <div>
              <span className="font-medium text-slate-800">
                Bulk move
              </span>{" "}
              <span className="text-slate-500">
                Select candidates above, then move them to a new
                stage.
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
