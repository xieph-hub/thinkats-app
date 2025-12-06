// app/ats/jobs/[jobId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { matchesBooleanQuery } from "@/lib/booleanSearch";
import JobPipelineBoard from "./JobPipelineBoard";

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

type PipelineAppRow = {
  id: string;
  fullName: string;
  email: string;
  location: string | null;
  source: string | null;
  stage: string | null;
  status: string | null;
  matchScore: number | null;
  matchReason: string | null;
  tier: string | null;
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
                  tag: true,
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

  const defaultView = jobViews.find((v) => v.isDefault) || null;

  const activeView = viewFromId || defaultView || null;

  // ---------------------------------------------------------------------------
  // Filters (search, stage, status, tier) – keep behaviour as before
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

  const stageOptions = stageNames;

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
    const tier =
      (latestScore?.tier as string | null | undefined) ?? null;
    const engine =
      (latestScore?.engine as string | null | undefined) ?? null;

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

    // Status filter (PENDING / ON_HOLD / REJECTED) – "Accept / On hold / Reject"
    if (
      filterStatus !== "ALL" &&
      (app.status || "PENDING").toUpperCase() !==
        filterStatus.toUpperCase()
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
    if (
      filterStage !== "ALL" &&
      stageName !== filterStage.toUpperCase()
    ) {
      continue;
    }

    // Candidate tags → skills
    const skillTags =
      app.candidate?.tags?.map((ct) => ({
        id: ct.tag.id,
        label: ct.tag.name,
        color: ct.tag.color,
      })) ?? [];

    pipelineApps.push({
      id: app.id,
      fullName: app.fullName,
      email: app.email,
      location: app.location,
      source: app.source,
      stage: app.stage,
      status: app.status,
      matchScore: score,
      matchReason: app.matchReason,
      tier,
      appliedAt: app.createdAt.toISOString(),
      skillTags,
      // Placeholder – once you collect years of experience per candidate,
      // you can populate this field.
      experienceLabel: null,
    });
  }

  const allVisibleApplicationIds = pipelineApps.map((a) => a.id);

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

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

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
                {(tenant as any).plan ?? "free"}
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

      {/* Filters + info */}
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

            {/* Search */}
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

            {/* Stage filter */}
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

            {/* Status filter (Accept / On hold / Reject) */}
            <div className="flex flex-col">
              <label className="mb-1 text-[11px] text-slate-600">
                Decision
              </label>
              <select
                name="status"
                defaultValue={filterStatus}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
              >
                <option value="ALL">All</option>
                <option value="PENDING">Accepted / active</option>
                <option value="ON_HOLD">On hold</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Tier filter */}
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

          {/* Visible count */}
          <div className="flex flex-col items-end text-[11px] text-slate-500">
            <span>
              Visible applications:{" "}
              <span className="font-semibold text-slate-700">
                {allVisibleApplicationIds.length}
              </span>
            </span>
            <span className="text-[10px]">
              Use status and stage inline controls below to manage the
              pipeline.
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

      {/* Pipeline board – ThinkATS dark list, inline status & stage, bulk actions */}
      <JobPipelineBoard
        jobId={job.id}
        stageOptions={stageOptions}
        apps={pipelineApps}
      />
    </div>
  );
}
