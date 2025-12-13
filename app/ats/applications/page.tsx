// app/ats/applications/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { matchesBooleanQuery } from "@/lib/booleanSearch";
import ApplicationsList from "./ApplicationsList";
import { getAtsTenantScope } from "@/lib/auth/tenantAccess";

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

type ApplicationsRow = {
  id: string;
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
  skillTags: { id: string; label: string; color?: string | null }[];
};

function formatStageLabel(raw: string): string {
  const upper = raw.toUpperCase();
  return upper
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatStatusLabel(raw: string): string {
  const upper = raw.toUpperCase();
  if (upper === "PENDING") return "Active";
  if (upper === "ON_HOLD") return "On hold";
  if (upper === "REJECTED") return "Rejected";
  return upper
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export default async function AtsApplicationsPage({
  searchParams = {},
}: {
  searchParams?: ApplicationsPageSearchParams;
}) {
  const { activeTenantId } = await getAtsTenantScope();
  if (!activeTenantId) notFound();

  const tenant = await prisma.tenant.findUnique({
    where: { id: activeTenantId },
    select: { id: true, slug: true, planTier: true },
  });
  if (!tenant) notFound();

  // ---------------------------------------------------------------------------
  // Saved views (tenant-scoped)
  // ---------------------------------------------------------------------------

  const rawViewId =
    typeof searchParams.viewId === "string" ? searchParams.viewId : "";

  const savedViewsRaw = await prisma.savedView.findMany({
    where: {
      tenantId: tenant.id,
      scope: "applications_pipeline",
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
  let filterStatus = "ALL";
  let filterTier = "ALL";

  if (activeView) {
    const params = (activeView.filters || {}) as any;
    if (typeof params.q === "string") filterQ = params.q;
    if (typeof params.stage === "string") filterStage = params.stage;
    if (typeof params.status === "string") filterStatus = params.status;
    if (typeof params.tier === "string") filterTier = params.tier;
  }

  if (typeof searchParams.q === "string") filterQ = searchParams.q;
  if (typeof searchParams.stage === "string" && searchParams.stage !== "")
    filterStage = searchParams.stage;
  if (typeof searchParams.status === "string" && searchParams.status !== "")
    filterStatus = searchParams.status;
  if (typeof searchParams.tier === "string" && searchParams.tier !== "")
    filterTier = searchParams.tier;

  // ---------------------------------------------------------------------------
  // Load applications (tenant-scoped via job.tenantId)
  // ---------------------------------------------------------------------------

  const applicationsRaw = await prisma.jobApplication.findMany({
    where: {
      job: { tenantId: tenant.id },
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

  const stageValueSet = new Set<string>();
  const statusValueSet = new Set<string>();

  for (const app of applicationsRaw) {
    stageValueSet.add((app.stage || "APPLIED").toUpperCase());
    statusValueSet.add((app.status || "PENDING").toUpperCase());
  }

  const stageNames = Array.from(stageValueSet).sort();
  const statusNames = Array.from(statusValueSet).sort();

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

    const skillTags =
      candidate?.tags?.map((ct) => ({
        id: ct.tag.id,
        label: ct.tag.name,
        color: ct.tag.color,
      })) ?? [];

    const haystack = [
      app.fullName,
      app.email,
      app.location,
      (app as any).linkedinUrl,
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

    const statusValue = (app.status || "PENDING").toUpperCase();
    if (filterStatus !== "ALL" && statusValue !== filterStatus.toUpperCase())
      continue;

    if (filterTier !== "ALL" && (tier || "").toUpperCase() !== filterTier.toUpperCase())
      continue;

    const stageValue = (app.stage || "APPLIED").toUpperCase();
    if (filterStage !== "ALL" && stageValue !== filterStage.toUpperCase())
      continue;

    pipelineApps.push({
      id: app.id,
      candidateId: candidate ? candidate.id : null,
      jobId: job ? job.id : null,
      jobTitle,
      clientName,

      fullName: app.fullName,
      email: app.email,
      location: app.location,
      currentTitle: (candidate as any)?.currentTitle ?? null,
      currentCompany: (candidate as any)?.currentCompany ?? null,

      source: app.source,
      stage: app.stage,
      status: app.status,

      matchScore: score,
      matchReason: app.matchReason ?? null,
      tier,
      scoreReason,

      appliedAt: app.createdAt.toISOString(),
      skillTags,
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

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/ats/dashboard" className="hover:text-slate-700 hover:underline">
            ATS
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Applications</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-900">Applications</h1>
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
              <span className="ml-1 capitalize">{tenant.planTier ?? "free"}</span>
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
          <form
            className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs shadow-sm"
            method="GET"
          >
            <div className="flex flex-col">
              <label className="mb-1 text-[11px] font-medium text-slate-600">View</label>
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

            <div className="flex flex-col">
              <label className="mb-1 text-[11px] font-medium text-slate-600">Search</label>
              <input
                type="text"
                name="q"
                defaultValue={filterQ}
                placeholder='e.g. "senior engineer" source:linkedin -contract'
                className="h-8 w-56 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-[11px] font-medium text-slate-600">Stage</label>
              <select
                name="stage"
                defaultValue={filterStage}
                className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="ALL">All</option>
                {stageNames.map((s) => (
                  <option key={s} value={s}>
                    {formatStageLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-[11px] font-medium text-slate-600">Decision</label>
              <select
                name="status"
                defaultValue={filterStatus}
                className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="ALL">All</option>
                {statusNames.map((s) => (
                  <option key={s} value={s}>
                    {formatStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-[11px] font-medium text-slate-600">Tier</label>
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

          <div className="flex flex-col items-end gap-1 text-[11px] text-slate-500">
            <span>
              Visible applications:{" "}
              <span className="font-semibold text-slate-800">{allVisibleApplicationIds.length}</span>
            </span>
            <span className="max-w-xs text-right text-[10px]">
              Use the filters and saved views to keep your shortlists and interview-ready candidates one click away.
            </span>
          </div>
        </div>

        <form
          action="/api/ats/views"
          method="POST"
          className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs shadow-sm"
        >
          {/* IMPORTANT: include tenantId so the API can enforce tenant-safe writes */}
          <input type="hidden" name="tenantId" value={tenant.id} />

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

      <section className="flex-1 px-5 py-4">
        <ApplicationsList applications={pipelineApps} />
      </section>
    </div>
  );
}
