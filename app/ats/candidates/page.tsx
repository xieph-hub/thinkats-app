// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Candidates",
  description:
    "Workspace-wide view of candidates, pipelines and sourcing performance.",
};

type CandidatesPageSearchParams = {
  q?: string | string[];
  source?: string | string[];
  stage?: string | string[];
  tier?: string | string[];
  view?: string | string[];
};

type PageProps = {
  searchParams?: CandidatesPageSearchParams;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firstString(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function scoreChipColor(score?: number | null) {
  if (score == null) return "bg-slate-100 text-slate-600";
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 65) return "bg-sky-100 text-sky-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function tierChipColor(tier?: string | null) {
  if (!tier) return "bg-slate-100 text-slate-600";
  const upper = tier.toUpperCase();
  if (upper === "A") return "bg-emerald-100 text-emerald-700";
  if (upper === "B") return "bg-sky-100 text-sky-700";
  if (upper === "C") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function derivePrimaryTier(apps: any[]): string | null {
  const tiers = new Set<string>();
  for (const app of apps) {
    const latest = app.scoringEvents?.[0];
    const tier = (latest?.tier as string | null | undefined) ?? null;
    if (tier) tiers.add(tier.toUpperCase());
  }
  if (!tiers.size) return null;

  const ordered = ["A", "B", "C", "D"];
  for (const t of ordered) {
    if (tiers.has(t)) return t;
  }
  return Array.from(tiers)[0];
}

function deriveLastSeen(apps: any[], fallback: Date): Date {
  if (!apps.length) return fallback;
  return apps[0].createdAt ?? fallback;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CandidatesPage({ searchParams = {} }: PageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

  // ---- URL filters ---------------------------------------------------------

  let filterQ = (firstString(searchParams.q) || "").trim();
  let filterSource = (firstString(searchParams.source) || "").trim();
  let filterStage = (firstString(searchParams.stage) || "").trim().toUpperCase();
  let filterTier = (firstString(searchParams.tier) || "").trim().toUpperCase();
  const activeViewId = firstString(searchParams.view);

  // ---- Saved views (scope = "candidates") ---------------------------------

  const savedViews = await prisma.savedView.findMany({
    where: {
      tenantId: tenant.id,
      scope: "candidates",
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const activeView =
    savedViews.find((v) => v.id === activeViewId) ||
    savedViews.find((v) => v.isDefault) ||
    null;

  // If a saved view is active, let its filters fill in *missing* URL filters.
  if (activeView && activeView.filters) {
    const filters = activeView.filters as any;

    if (!filterQ && typeof filters.q === "string") {
      filterQ = filters.q.trim();
    }
    if (!filterSource && typeof filters.source === "string") {
      filterSource = filters.source.trim();
    }
    if (!filterStage && typeof filters.stage === "string") {
      filterStage = filters.stage.trim().toUpperCase();
    }
    if (!filterTier && typeof filters.tier === "string") {
      filterTier = filters.tier.trim().toUpperCase();
    }
  }

  // ---- Base candidate query (text search server-side) ----------------------

  const candidateWhere: any = {
    tenantId: tenant.id,
  };

  if (filterQ) {
    candidateWhere.OR = [
      { fullName: { contains: filterQ, mode: "insensitive" } },
      { email: { contains: filterQ, mode: "insensitive" } },
      { location: { contains: filterQ, mode: "insensitive" } },
      { currentCompany: { contains: filterQ, mode: "insensitive" } },
    ];
  }

  const candidates = await prisma.candidate.findMany({
    where: candidateWhere,
    orderBy: { createdAt: "desc" },
    include: {
      tags: {
        include: { tag: true },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          job: {
            include: {
              clientCompany: true,
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

  // ---- In-memory filters for source / stage / tier -------------------------

  const filteredCandidates = candidates.filter((candidate) => {
    const apps = candidate.applications;

    // Filter by source
    if (filterSource) {
      const matchSource = apps.some((app) => {
        const src = (app.source || "").trim().toLowerCase();
        return src === filterSource.toLowerCase();
      });
      if (!matchSource) return false;
    }

    // Filter by stage
    if (filterStage) {
      const matchStage = apps.some((app) => {
        const stg = (app.stage || "").trim().toUpperCase();
        return stg === filterStage;
      });
      if (!matchStage) return false;
    }

    // Filter by tier
    if (filterTier) {
      const primaryTier = derivePrimaryTier(apps);
      if (!primaryTier || primaryTier.toUpperCase() !== filterTier) {
        return false;
      }
    }

    return true;
  });

  const totalCandidates = candidates.length;
  const totalFiltered = filteredCandidates.length;
  const totalPipelines = candidates.reduce(
    (sum, c) => sum + c.applications.length,
    0,
  );

  const now = new Date();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const activeIn30Days = candidates.filter((c) =>
    c.applications.some(
      (a: any) =>
        a.createdAt &&
        now.getTime() - a.createdAt.getTime() <= THIRTY_DAYS_MS,
    ),
  ).length;

  const uniqueSources = (() => {
    const set = new Set<string>();
    for (const c of candidates) {
      if (c.source) set.add(c.source.trim().toLowerCase());
      for (const app of c.applications as any[]) {
        if (app.source) set.add((app.source as string).trim().toLowerCase());
      }
    }
    return set.size;
  })();

  const tierCounts = (() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, OTHER: 0 };
    for (const c of candidates) {
      const t = derivePrimaryTier(c.applications as any[]);
      if (!t) continue;
      const up = t.toUpperCase();
      if (up === "A" || up === "B" || up === "C") {
        counts[up] += 1;
      } else {
        counts.OTHER += 1;
      }
    }
    return counts;
  })();

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/ats/jobs" className="hover:underline">
            ATS
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">Candidates</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Candidates
            </h1>
            <p className="mt-0.5 max-w-xl text-[11px] text-slate-500">
              Talent across all roles in this workspace. Search, segment and
              tier candidates into a single, unified view.
            </p>
          </div>
          <div className="flex flex-col items-end text-right text-[11px] text-slate-500">
            <span className="font-medium text-slate-800">
              {tenant.name}
            </span>
            <span className="text-[10px] text-slate-400">
              {totalFiltered} of {totalCandidates} candidates visible
            </span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-600 md:grid-cols-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Total candidates
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {totalCandidates}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Pipelines
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {totalPipelines}
            </span>
            <span className="text-[10px] text-slate-400">
              {Math.max(totalCandidates, 1)
                ? (totalPipelines / Math.max(totalCandidates, 1)).toFixed(1)
                : "0.0"}{" "}
              per candidate on average
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Active in last 30 days
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {activeIn30Days}
            </span>
            <span className="text-[10px] text-slate-400">
              {totalCandidates
                ? Math.round((activeIn30Days / totalCandidates) * 100)
                : 0}
              % of pool
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Sources &amp; tiers
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {uniqueSources} sources
            </span>
            <div className="mt-0.5 flex flex-wrap gap-1 text-[9px] text-slate-500">
              <span>Tier A {tierCounts.A}</span>
              <span className="text-slate-300">•</span>
              <span>Tier B {tierCounts.B}</span>
              <span className="text-slate-300">•</span>
              <span>Tier C {tierCounts.C}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex flex-1 flex-col bg-slate-50 px-5 py-4">
        {/* Filters + saved views + quick chips */}
        <section className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)]">
          {/* Filters card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-[11px] text-slate-700">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Filters
              </span>
              <Link
                href="/ats/candidates"
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                Reset
              </Link>
            </div>

            <form className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                name="q"
                defaultValue={filterQ}
                placeholder="Search by name, email, company…"
                className="h-8 min-w-[180px] flex-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
              />
              <input
                type="text"
                name="source"
                defaultValue={filterSource}
                placeholder="Source (e.g. LinkedIn, Referral…)"
                className="h-8 min-w-[140px] rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
              />
              <input
                type="text"
                name="stage"
                defaultValue={filterStage}
                placeholder="Stage (e.g. APPLIED, INTERVIEW…)"
                className="h-8 min-w-[140px] rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
              />
              <input
                type="text"
                name="tier"
                defaultValue={filterTier}
                placeholder="Tier (A, B, C…)"
                className="h-8 min-w-[100px] rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
              />
              {activeView && (
                <input type="hidden" name="view" value={activeView.id} />
              )}
              <button
                type="submit"
                className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800"
              >
                Apply filters
              </button>
            </form>

            {/* Quick tier chips */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                Quick tiers
              </span>
              {["A", "B", "C"].map((tier) => {
                const params = new URLSearchParams();
                params.set("tier", tier);
                if (activeView) params.set("view", activeView.id);
                const href = `/ats/candidates?${params.toString()}`;
                const isActive = filterTier === tier;

                return (
                  <Link
                    key={tier}
                    href={href}
                    className={[
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px]",
                      isActive
                        ? "bg-slate-900 text-slate-50"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    ].join(" ")}
                  >
                    Tier {tier}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Saved views / view chips */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-[11px] text-slate-700">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Saved views
              </span>
              <span className="text-[10px] text-slate-400">
                Views are workspace-wide. Build sourcing &amp; screening
                dashboards here.
              </span>
            </div>

            {savedViews.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                No saved views yet. We&apos;ll use this space later for things
                like &ldquo;Leadership funnel&rdquo; or &ldquo;Referrals
                only&rdquo;.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {savedViews.map((view) => {
                  const isActive = activeView && activeView.id === view.id;
                  const params = new URLSearchParams();
                  params.set("view", view.id);
                  const href = `/ats/candidates?${params.toString()}`;

                  return (
                    <Link
                      key={view.id}
                      href={href}
                      className={[
                        "inline-flex items-center rounded-full px-3 py-1 text-[10px]",
                        isActive
                          ? "bg-slate-900 text-slate-50 shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                      ].join(" ")}
                    >
                      {view.name}
                      {view.isDefault && (
                        <span className="ml-1 text-[9px] text-slate-300">
                          • default
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Candidates table / list */}
        <section className="flex-1 rounded-2xl border border-slate-200 bg-white">
          {filteredCandidates.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center text-[11px] text-slate-500">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white shadow-sm">
                ATS
              </div>
              <p className="mb-1 text-[12px] font-medium text-slate-800">
                No candidates match these filters.
              </p>
              <p className="max-w-sm text-[11px] text-slate-500">
                Try clearing one or more filters, or widen your search term to
                see more of your talent pool.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-1 px-2 text-[11px]">
                <thead>
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Candidate</th>
                    <th className="px-3 py-2">Pipelines</th>
                    <th className="px-3 py-2 text-right">Tier / score</th>
                    <th className="px-3 py-2">Latest role</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2 text-right">Last touch</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((candidate) => {
                    const apps = candidate.applications as any[];
                    const primaryTier = derivePrimaryTier(apps);
                    const lastSeen = deriveLastSeen(
                      apps,
                      candidate.createdAt,
                    );

                    const latestApp = apps[0];
                    const latestScore = (() => {
                      if (!latestApp) return null;
                      const latest = latestApp.scoringEvents?.[0];
                      return (
                        (latest?.score as number | null | undefined) ??
                        (latestApp.matchScore as
                          | number
                          | null
                          | undefined) ??
                        null
                      );
                    })();

                    const latestJobTitle =
                      latestApp?.job?.title || "—";
                    const latestClient =
                      latestApp?.job?.clientCompany?.name || null;
                    const anySource =
                      latestApp?.source || (candidate as any).source || "";

                    const uniqueTags =
                      candidate.tags
                        ?.map((ct) => ct.tag)
                        .filter(
                          (t): t is NonNullable<typeof t> => Boolean(t),
                        ) ?? [];

                    return (
                      <tr key={candidate.id}>
                        {/* Candidate */}
                        <td className="align-top px-3 py-2">
                          <div className="flex flex-col gap-0.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Link
                                  href={`/ats/candidates/${candidate.id}`}
                                  className="text-[11px] font-semibold text-slate-900 hover:underline"
                                >
                                  {candidate.fullName}
                                </Link>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                                  {candidate.email && (
                                    <span>{candidate.email}</span>
                                  )}
                                  {candidate.location && (
                                    <>
                                      <span className="text-slate-300">
                                        •
                                      </span>
                                      <span>{candidate.location}</span>
                                    </>
                                  )}
                                  {(candidate as any).currentCompany && (
                                    <>
                                      <span className="text-slate-300">
                                        •
                                      </span>
                                      <span>
                                        {(candidate as any).currentCompany}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end text-[10px] text-slate-500">
                                <span>
                                  Added {formatDate(candidate.createdAt)}
                                </span>
                              </div>
                            </div>

                            {uniqueTags.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {uniqueTags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-700"
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                                {uniqueTags.length > 3 && (
                                  <span className="text-[9px] text-slate-400">
                                    +{uniqueTags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Pipelines */}
                        <td className="align-top px-3 py-2 text-[10px] text-slate-600">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-slate-900">
                              {apps.length}{" "}
                              {apps.length === 1
                                ? "pipeline"
                                : "pipelines"}
                            </span>
                            {apps.slice(0, 2).map((app) => (
                              <div
                                key={app.id}
                                className="flex items-center gap-1 text-[10px]"
                              >
                                <span className="truncate text-slate-700">
                                  {app.job?.title || "Untitled"}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500">
                                  {app.stage || "APPLIED"}
                                </span>
                              </div>
                            ))}
                            {apps.length > 2 && (
                              <span className="text-[9px] text-slate-400">
                                +{apps.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Tier / score */}
                        <td className="align-top px-3 py-2 text-right">
                          <div className="flex flex-col items-end gap-1">
                            {primaryTier && (
                              <span
                                className={[
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                  tierChipColor(primaryTier),
                                ].join(" ")}
                              >
                                Tier {primaryTier}
                              </span>
                            )}
                            {latestScore != null && (
                              <span
                                className={[
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                                  scoreChipColor(latestScore),
                                ].join(" ")}
                              >
                                Score {latestScore}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Latest role */}
                        <td className="align-top px-3 py-2 text-[10px] text-slate-600">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-900">
                              {latestJobTitle}
                            </span>
                            {latestClient && (
                              <span className="text-slate-500">
                                {latestClient}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Source */}
                        <td className="align-top px-3 py-2 text-[10px] text-slate-600">
                          {anySource || "—"}
                        </td>

                        {/* Last seen */}
                        <td className="align-top px-3 py-2 text-right text-[10px] text-slate-600">
                          {formatDate(lastSeen)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
