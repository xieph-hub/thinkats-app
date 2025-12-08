// app/ats/applications/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { matchesBooleanQuery } from "@/lib/booleanSearch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Applications",
  description:
    "Workspace-wide pipeline view of all job applications, across roles and clients.",
};

type ApplicationsPageSearchParams = {
  q?: string;
  stage?: string;
  status?: string;
  tier?: string;
  viewId?: string;
};

type PageProps = {
  searchParams?: ApplicationsPageSearchParams;
};

type ApplicationsRow = {
  id: string; // application id
  candidateId: string | null;
  jobId: string | null;
  jobTitle: string;
  clientName: string | null;

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
};

export default async function AtsApplicationsPage({
  searchParams = {},
}: PageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

  // ---------------------------------------------------------------------------
  // Saved views (workspace-wide applications)
  // ---------------------------------------------------------------------------

  const rawViewId =
    typeof searchParams.viewId === "string" ? searchParams.viewId : "";

  const savedViewsRaw = await prisma.savedView.findMany({
    where: {
      tenantId: tenant.id,
      scope: "applications_pipeline", // separate scope from job_pipeline
    },
    orderBy: { createdAt: "asc" },
  });

  const viewFromId =
    rawViewId && savedViewsRaw.length
      ? savedViewsRaw.find((v) => v.id === rawViewId) || null
      : null;

  const defaultView = savedViewsRaw.find((v) => v.isDefault) || null;

  const activeView = viewFromId || defaultView || null;

  // ---------------------------------------------------------------------------
  // Filters (search, stage, status, tier)
  // ---------------------------------------------------------------------------

  let filterQ = "";
  let filterStage = "ALL";
  let filterStatus = "ALL"; // PENDING / ON_HOLD / REJECTED
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

  // Canonical stage list for workspace-wide view
  const stageNames = [
    "APPLIED",
    "SCREENING",
    "INTERVIEW",
    "OFFER",
    "HIRED",
    "REJECTED",
  ];

  // ---------------------------------------------------------------------------
  // Load applications (tenant-wide) + build filtered list
  // ---------------------------------------------------------------------------

  const applicationsRaw = await prisma.jobApplication.findMany({
    where: {
      job: {
        tenantId: tenant.id,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        include: {
          clientCompany: true,
        },
      },
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
  });

  const totalApplications = applicationsRaw.length;

  const pipelineApps: ApplicationsRow[] = [];

  for (const app of applicationsRaw) {
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
    const job = app.job ?? null;

    const jobTitle = job?.title ?? "Job removed";
    const clientName = job?.clientCompany?.name ?? null;

    // Boolean / keyword search (workspace-wide)
    const haystack = [
      app.fullName,
      app.email,
      app.location,
      app.linkedinUrl,
      app.source,
      jobTitle,
      clientName,
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
        job: jobTitle,
        client: clientName || "",
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

    pipelineApps.push({
      id: app.id,
      candidateId: candidate ? candidate.id : null,
      jobId: job ? job.id : null,
      jobTitle,
      clientName,

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
    });
  }

  const allVisibleApplicationIds = pipelineApps.map((a) => a.id);

  const uniqueTiers = Array.from(
    new Set(
      applicationsRaw
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
  // UI – mirrored from JobPipelinePage
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-50">
      {/* Header (matches job pipeline shell) */}
      <header className="border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/ats/dashboard"
            className="hover:text-slate-700 hover:underline"
          >
            ATS
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Applications</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900">
              Applications
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {totalApplications} total applications
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

      {/* Filters + view management (copied layout) */}
      <section className="border-b border-slate-200 bg-slate-50/80 px-5 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          {/* Filters */}
          <form
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
                {savedViewsRaw.map((v) => (
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
            <Link
              href="/ats/applications"
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

        {/* Save current filters as view (same layout) */}
        <form
          action="/api/ats/views"
          method="POST"
          className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs shadow-sm"
        >
          <input type="hidden" name="scope" value="applications_pipeline" />
          <input type="hidden" name="redirectTo" value="/ats/applications" />
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
            <span>Set as default view for this workspace</span>
          </label>

          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Save view
          </button>
        </form>
      </section>

      {/* Applications list (styled to sit under the same shell) */}
      <section className="flex-1 px-5 py-4">
        <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white">
          {pipelineApps.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-[11px] text-slate-500">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/90 text-xs font-semibold text-white shadow-sm">
                ATS
              </div>
              <p className="text-xs font-medium text-slate-900">
                No applications match your current filters.
              </p>
              <p className="max-w-sm text-[11px] text-slate-500">
                Try clearing filters or check back after publishing roles and
                collecting candidates.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-[11px] text-slate-700">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-2 text-left">
                      Candidate
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 text-left">
                      Job
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 text-left">
                      Stage
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 text-left">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 text-left">
                      Source
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 text-right">
                      Match
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2 text-right">
                      Applied
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineApps.map((app, idx) => {
                    const createdDate = app.appliedAt.slice(0, 10);
                    const matchScore =
                      app.matchScore != null ? `${app.matchScore}%` : "—";

                    return (
                      <tr
                        key={app.id}
                        className={
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                        }
                      >
                        {/* Candidate */}
                        <td className="border-b border-slate-100 px-3 py-2 align-top">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[12px] font-semibold text-slate-900">
                              {app.fullName || "Unnamed"}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {app.email || "No email on record"}
                            </span>
                          </div>
                        </td>

                        {/* Job */}
                        <td className="border-b border-slate-100 px-3 py-2 align-top">
                          <div className="flex flex-col gap-0.5">
                            {app.jobId ? (
                              <Link
                                href={`/ats/jobs/${app.jobId}`}
                                className="text-[11px] font-medium text-slate-900 hover:underline"
                              >
                                {app.jobTitle}
                              </Link>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-900">
                                {app.jobTitle}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500">
                              {app.clientName || "Client not set"}
                            </span>
                          </div>
                        </td>

                        {/* Stage */}
                        <td className="border-b border-slate-100 px-3 py-2 align-top">
                          <span className="text-[10px] text-slate-700">
                            {app.stage || "APPLIED"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="border-b border-slate-100 px-3 py-2 align-top">
                          <span className="text-[10px] text-slate-700">
                            {app.status || "PENDING"}
                          </span>
                        </td>

                        {/* Source */}
                        <td className="border-b border-slate-100 px-3 py-2 align-top">
                          <span className="text-[10px] text-slate-700">
                            {app.source || "—"}
                          </span>
                        </td>

                        {/* Match score */}
                        <td className="border-b border-slate-100 px-3 py-2 text-right align-top">
                          <span className="text-[10px] text-slate-700">
                            {matchScore}
                          </span>
                        </td>

                        {/* Applied date */}
                        <td className="border-b border-slate-100 px-3 py-2 text-right align-top">
                          <span className="text-[10px] text-slate-500">
                            {createdDate}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
