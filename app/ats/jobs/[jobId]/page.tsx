// app/ats/jobs/[jobId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { matchesBooleanQuery } from "@/lib/booleanSearch";
import JobPipelineList from "./JobPipelineList";

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
    page?: string;
  };
};

type PipelineAppRow = {
  id: string; // application id
  candidateId: string | null; // for linking to candidate profile

  fullName: string;
  email: string;
  location: string | null;
  currentTitle: string | null;
  currentCompany: string | null;

  source: string | null;
  stage: string | null;
  status: string | null;

  matchScore: number | null;
  matchReason: string | null;
  tier: string | null;
  scoreReason: string | null;

  appliedAt: string; // ISO
  skillTags: { id: string; label: string; color?: string | null }[];
  experienceLabel: string | null;
};

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
          candidate: {
            include: {
              tags: {
                include: {
                  tag: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
                },
              },
            },
          },
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

  // ---------------------------------------------------------------------------
  // Saved views (per job)
  // ---------------------------------------------------------------------------

  const hasViewIdParam =
    searchParams &&
    Object.prototype.hasOwnProperty.call(searchParams, "viewId");

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
    const params = (v.filters || {}) as any;
    return params.jobId === job.id;
  });

  const viewFromId =
    rawViewId && jobViews.length
      ? jobViews.find((v) => v.id === rawViewId) || null
      : null;

  // Only auto-apply default view when there is *no* viewId param at all.
  const defaultView =
    !hasViewIdParam && jobViews.length
      ? jobViews.find((v) => v.isDefault) || null
      : null;

  const activeView = viewFromId || defaultView || null;

  // ---------------------------------------------------------------------------
  // Filters (search, stage, status, tier)
  // ---------------------------------------------------------------------------

  let filterQ = "";
  let filterStage = "ALL";
  let filterStatus = "ALL"; // maps to PENDING / ON_HOLD / REJECTED
  let filterTier = "ALL";

  if (activeView) {
    const params = (activeView.filters || {}) as any;
    if (typeof params.q === "string") filterQ = params.q;
    if (typeof params.stage === "string") filterStage = params.stage;
    if (typeof params.status === "string") filterStatus = params.status;
    if (typeof params.tier === "string") filterTier = params.tier;
  }

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

  const stageNames =
    job.stages.length > 0
      ? job.stages.map((s) => s.name || "UNASSIGNED")
      : ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

  // ---------------------------------------------------------------------------
  // Build filtered pipeline list (server-side)
  // ---------------------------------------------------------------------------

  const pipelineApps: PipelineAppRow[] = [];

  for (const app of job.applications) {
    const latestScore = app.scoringEvents[0] ?? null;
    const score =
      (latestScore?.score as number | null | undefined) ??
      (app.matchScore as number | null | undefined) ??
      null;
    const tier = (latestScore?.tier as string | null | undefined) ?? null;
    const engine = (latestScore?.engine as string | null | undefined) ?? null;
    const scoreReason =
      (latestScore?.reason as string | null | undefined) ??
      (app.matchReason as string | null | undefined) ??
      null;

    const candidate = app.candidate ?? null;

    // Boolean / keyword search
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
        engine: engine || "",
      },
    });

    if (!matchesQuery) continue;

    // Status filter (PENDING / ON_HOLD / REJECTED)
    if (
      filterStatus !== "ALL" &&
      (app.status || "PENDING").toUpperCase() !== filterStatus.toUpperCase()
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

    // Candidate tags → chips
    const skillTags =
      candidate?.tags?.map((ct) => ({
        id: ct.tag.id,
        label: ct.tag.name,
        color: ct.tag.color,
      })) ?? [];

    pipelineApps.push({
      id: app.id,
      candidateId: candidate ? candidate.id : null,

      fullName: app.fullName,
      email: app.email,
      location: app.location,
      currentTitle: candidate?.currentTitle ?? null,
      currentCompany: candidate?.currentCompany ?? null,

      source: app.source,
      stage: app.stage,
      status: app.status,

      matchScore: score,
      matchReason: app.matchReason ?? null,
      tier,
      scoreReason,

      appliedAt: app.createdAt.toISOString(),
      skillTags,
      // Future: derive from candidate profile once you collect it
      experienceLabel: null,
    });
  }

  const totalApplications = pipelineApps.length;

  // ---------------------------------------------------------------------------
  // Pagination (server-side)
  // ---------------------------------------------------------------------------

  const rawPage =
    typeof searchParams.page === "string" ? searchParams.page : undefined;
  let page = rawPage ? Number.parseInt(rawPage, 10) : 1;
  if (Number.isNaN(page) || page < 1) page = 1;

  const pageSize = 25;
  const pageCount =
    totalApplications === 0 ? 1 : Math.ceil(totalApplications / pageSize);

  if (page > pageCount) page = pageCount;

  const startIndex =
    totalApplications === 0 ? 0 : (page - 1) * pageSize;

  const paginatedPipelineApps =
    totalApplications === 0
      ? []
      : pipelineApps.slice(startIndex, startIndex + pageSize);

  const showingFrom = totalApplications === 0 ? 0 : startIndex + 1;
  const showingTo =
    totalApplications === 0
      ? 0
      : Math.min(startIndex + pageSize, totalApplications);

  const allVisibleApplicationIds = pipelineApps.map((a) => a.id);

  const uniqueTiers = Array.from(
    new Set(
      job.applications
        .flatMap((a) => a.scoringEvents)
        .map((e) => (e?.tier as string | null | undefined) || null)
        .filter(Boolean) as string[],
    ),
  ).sort();

  const activeViewId = activeView?.id || "";
  const currentViewId = activeViewId;

  // Build base query for pagination links
  const baseUrl = `/ats/jobs/${job.id}`;
  const baseParams = new URLSearchParams();

  if (currentViewId) baseParams.set("viewId", currentViewId);
  if (filterQ) baseParams.set("q", filterQ);
  if (filterStage !== "ALL") baseParams.set("stage", filterStage);
  if (filterStatus !== "ALL") baseParams.set("status", filterStatus);
  if (filterTier !== "ALL") baseParams.set("tier", filterTier);

  const buildPageHref = (pageNum: number) => {
    const params = new URLSearchParams(baseParams);
    if (pageNum > 1) {
      params.set("page", String(pageNum));
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  };

  const prevPageHref = page > 1 ? buildPageHref(page - 1) : null;
  const nextPageHref = page < pageCount ? buildPageHref(page + 1) : null;

  // ---------------------------------------------------------------------------
  // UI (LIST ONLY)
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-50">
      {/* Job header */}
      <header className="border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/ats/jobs"
            className="hover:text-slate-700 hover:underline"
          >
            Jobs
          </Link>
          <span>/</span>
          {job.clientCompany && (
            <>
              <span className="text-slate-500">{job.clientCompany.name}</span>
              <span>/</span>
            </>
          )}
          <span className="font-medium text-slate-800">{job.title}</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              {job.clientCompany && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {job.clientCompany.name}
                </span>
              )}
              {job.location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {job.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {job.applications.length} total applications
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {allVisibleApplicationIds.length} in current view
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-right text-[11px] text-slate-500">
            <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              Tenant plan:{" "}
              <span className="ml-1 capitalize">
                {(tenant as any).plan ?? "free"}
              </span>
            </span>
            {activeView && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Active view: {activeView.name}
                {activeView.isDefault ? " · default" : ""}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Filters + view management */}
      <section className="border-b border-slate-200 bg-slate-50/80 px-5 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          {/* Filters */}
          <form
  key={`filters-${currentViewId}-${filterQ}-${filterStage}-${filterStatus}-${filterTier}`}
  className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs shadow-sm"
  method="GET"
>
            {/* View selector */}
            <div className="flex flex-col">
              <label className="mb-1 text-[11px] font-medium text-slate-600">
                View
              </label>
              <select
                name="viewId"
                defaultValue={currentViewId}
                className="h-8 min-w-[140px] rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
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
              <label className="mb-1 text-[11px] font-medium text-slate-600">
                Search
              </label>
              <input
                type="text"
                name="q"
                defaultValue={filterQ}
                placeholder='e.g. "senior engineer" source:linkedin -contract'
                className="h-8 w-56 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            {/* Stage filter */}
            <div className="flex flex-col">
              <label className="mb-1 text-[11px] font-medium text-slate-600">
                Stage
              </label>
              <select
                name="stage"
                defaultValue={filterStage}
                className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="ALL">All</option>
                {stageNames.map((s) => (
                  <option key={s} value={s.toUpperCase()}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="flex flex-col">
              <label className="mb-1 text-[11px] font-medium text-slate-600">
                Decision
              </label>
              <select
                name="status"
                defaultValue={filterStatus}
                className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="ALL">All</option>
                <option value="PENDING">Accepted / active</option>
                <option value="ON_HOLD">On hold</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Tier filter */}
            <div className="flex flex-col">
              <label className="mb-1 text-[11px] font-medium text-slate-600">
                Tier
              </label>
              <select
                name="tier"
                defaultValue={filterTier}
                className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
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
              className="mt-5 inline-flex h-8 items-center rounded-full bg-indigo-600 px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Apply filters
            </button>
            {/* Reset: explicitly include viewId param so default view is NOT auto-applied */}
            <Link
              href={`/ats/jobs/${job.id}?viewId=`}
              className="mt-5 inline-flex h-8 items-center rounded-full border border-slate-300 bg-white px-3 text-[11px] text-slate-600 transition hover:bg-slate-100"
            >
              Reset
            </Link>
          </form>

          {/* Visible count + hint */}
          <div className="flex flex-col items-end gap-1 text-[11px] text-slate-500">
            <span>
              Visible applications:{" "}
              <span className="font-semibold text-slate-800">
                {allVisibleApplicationIds.length}
              </span>
            </span>
            <span className="max-w-xs text-right text-[10px]">
              Use the filters and saved views to keep your shortlists and
              interview-ready candidates one click away.
            </span>
          </div>
        </div>

        {/* Save current filters as view */}
        <form
          action="/api/ats/views"
          method="POST"
          className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs shadow-sm"
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
            <label className="mb-1 text-[11px] font-medium text-slate-600">
              Save current filters as view
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Tier A · Interview-ready"
              className="h-8 w-64 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          <label className="mb-1 mt-4 flex items-center gap-1 text-[11px] text-slate-600 md:mt-0">
            <input
              type="checkbox"
              name="setDefault"
              className="h-3 w-3 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500/40"
            />
            <span>Set as default view for this job</span>
          </label>

          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Save view
          </button>
        </form>
      </section>

      {/* Pipeline list (with bulk selection/actions) + pagination */}
      <section className="flex-1 px-5 py-4">
        <JobPipelineList
          jobId={job.id}
          applications={paginatedPipelineApps}
          stageOptions={stageNames}
          startIndex={startIndex}
        />

        {/* Pagination footer */}
        <div className="mt-3 flex flex-col items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 md:flex-row">
          <p>
            Showing{" "}
            <span className="font-semibold">
              {showingFrom}–{showingTo}
            </span>{" "}
            of{" "}
            <span className="font-semibold">
              {totalApplications}
            </span>{" "}
            {totalApplications === 1 ? "application" : "applications"}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={prevPageHref ?? "#"}
              aria-disabled={!prevPageHref}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium ${
                prevPageHref
                  ? "border-slate-300 text-slate-700 hover:bg-slate-100"
                  : "cursor-not-allowed border-slate-200 text-slate-400"
              }`}
            >
              ← Previous
            </Link>
            <span className="text-[10px] text-slate-500">
              Page {page} of {pageCount}
            </span>
            <Link
              href={nextPageHref ?? "#"}
              aria-disabled={!nextPageHref}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium ${
                nextPageHref
                  ? "border-slate-300 text-slate-700 hover:bg-slate-100"
                  : "cursor-not-allowed border-slate-200 text-slate-400"
              }`}
            >
              Next →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
