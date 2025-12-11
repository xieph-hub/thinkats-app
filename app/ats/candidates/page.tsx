import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import CandidatesTable, {
  type CandidateRowProps,
} from "./CandidatesTable";

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
  page?: string | string[];
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

  // ---- Derive source & stage options for structured filters ----------------

  const sourceSet = new Set<string>();
  const stageSet = new Set<string>();

  for (const c of candidates as any[]) {
    const candidateSource = (c as any).source as string | undefined;
    if (candidateSource && candidateSource.trim()) {
      sourceSet.add(candidateSource.trim());
    }

    for (const app of c.applications as any[]) {
      if (app.source && (app.source as string).trim()) {
        sourceSet.add((app.source as string).trim());
      }
      if (app.stage && (app.stage as string).trim()) {
        stageSet.add((app.stage as string).trim().toUpperCase());
      }
    }
  }

  const sourceOptions = Array.from(sourceSet).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  );
  const stageOptions = Array.from(stageSet).sort();

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

  const uniqueSources = sourceOptions.length;

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

  // ---- Pagination ----------------------------------------------------------

  const rawPage = parseInt(firstString(searchParams.page) || "1", 10);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;

  const pageCandidates = filteredCandidates.slice(
    offset,
    offset + pageSize,
  );

  // ---- Map to flat rows for the client table -------------------------------

  const candidateRows: CandidateRowProps[] = pageCandidates.map(
    (candidate, idx) => {
      const apps = candidate.applications as any[];

      const primaryTier = derivePrimaryTier(apps);
      const lastSeen = deriveLastSeen(apps, candidate.createdAt);

      const latestApp = apps[0];
      const latestScore = (() => {
        if (!latestApp) return null;
        const latest = latestApp.scoringEvents?.[0];
        return (
          (latest?.score as number | null | undefined) ??
          (latestApp.matchScore as number | null | undefined) ??
          null
        );
      })();

      const latestJobTitle = latestApp?.job?.title || "—";
      const latestClient = latestApp?.job?.clientCompany?.name || null;
      const anySource =
        latestApp?.source || (candidate as any).source || "";

      const uniqueTags =
        candidate.tags
          ?.map((ct) => ct.tag)
          .filter(
            (t): t is NonNullable<typeof t> => Boolean(t),
          ) ?? [];

      return {
        id: candidate.id,
        index: offset + idx + 1,
        fullName: candidate.fullName,
        email: candidate.email,
        location: candidate.location,
        currentCompany: (candidate as any).currentCompany ?? null,
        createdAt: candidate.createdAt.toISOString(),
        tags: uniqueTags.map((t) => ({ id: t.id, name: t.name })),
        pipelines: apps.map((app: any) => ({
          id: app.id,
          title: app.job?.title || "Untitled",
          stage: app.stage || "APPLIED",
        })),
        primaryTier,
        latestScore,
        latestJobTitle,
        latestClient,
        source: anySource,
        lastSeen: lastSeen.toISOString(),
      };
    },
  );

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams();

    if (filterQ) params.set("q", filterQ);
    if (filterSource) params.set("source", filterSource);
    if (filterStage) params.set("stage", filterStage);
    if (filterTier) params.set("tier", filterTier);
    if (activeView) params.set("view", activeView.id);

    params.set("page", String(targetPage));

    const query = params.toString();
    return query ? `/ats/candidates?${query}` : "/ats/candidates";
  }

  // -------------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------------

  return (
    <div className="flex h-full flex-1 flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
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
              Talent across all roles in this workspace. Search, segment, rank
              and nurture candidates from a single, unified pool.
            </p>
          </div>
          <div className="flex flex-col items-end text-right text-[11px] text-slate-500">
            <span className="font-medium text-slate-800">
              {tenant.name}
            </span>
            <span className="text-[10px] text-slate-400">
              {totalFiltered.toLocaleString()} of{" "}
              {totalCandidates.toLocaleString()} candidates visible
            </span>
            {activeView && (
              <span className="mt-1 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                View: {activeView.name}
                {activeView.isDefault ? " · default" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-600 md:grid-cols-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Total candidates
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {totalCandidates.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Pipelines
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {totalPipelines.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">
              {totalCandidates > 0
                ? (totalPipelines / totalCandidates).toFixed(1)
                : "0.0"}{" "}
              per candidate on average
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Active in last 30 days
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {activeIn30Days.toLocaleString()}
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
              {uniqueSources} source
              {uniqueSources === 1 ? "" : "s"}
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
        {/* Filters + saved views */}
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

            <form
              className="flex flex-wrap items-center gap-2"
              method="GET"
              action="/ats/candidates"
            >
              {/* Text search */}
              <input
                type="text"
                name="q"
                defaultValue={filterQ}
                placeholder="Search by name, email, company…"
                className="h-8 min-w-[180px] flex-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              />

              {/* Source dropdown */}
              <select
                name="source"
                defaultValue={filterSource}
                className="h-8 min-w-[160px] rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="">All sources</option>
                {sourceOptions.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>

              {/* Stage dropdown */}
              <select
                name="stage"
                defaultValue={filterStage}
                className="h-8 min-w-[160px] rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="">All stages</option>
                {stageOptions.map((stg) => (
                  <option key={stg} value={stg}>
                    {stg}
                  </option>
                ))}
              </select>

              {/* Tier dropdown */}
              <select
                name="tier"
                defaultValue={filterTier}
                className="h-8 min-w-[120px] rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="">All tiers</option>
                <option value="A">Tier A</option>
                <option value="B">Tier B</option>
                <option value="C">Tier C</option>
              </select>

              {activeView && (
                <input type="hidden" name="view" value={activeView.id} />
              )}

              <button
                type="submit"
                className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
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
                        ? "bg-slate-900 text-slate-50 shadow-sm"
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
                Use views for recurring slices like leadership funnels or
                referral pools.
              </span>
            </div>

            {savedViews.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                No saved views yet. We&apos;ll use this space later for
                &ldquo;Leadership funnel&rdquo;, &ldquo;Referrals only&rdquo;
                and other curated segments.
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
          {candidateRows.length === 0 ? (
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
            <>
              <CandidatesTable rows={candidateRows} />

              {/* Pagination bar */}
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-600">
                <span>
                  Showing{" "}
                  <span className="font-semibold">
                    {totalFiltered === 0 ? 0 : offset + 1}–
                    {Math.min(offset + pageSize, totalFiltered)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    {totalFiltered.toLocaleString()}
                  </span>{" "}
                  candidates
                </span>
                <div className="inline-flex items-center gap-1">
                  <Link
                    href={buildPageHref(Math.max(1, currentPage - 1))}
                    className={[
                      "inline-flex items-center rounded-full border px-3 py-1 text-[10px]",
                      currentPage === 1
                        ? "cursor-not-allowed border-slate-200 text-slate-300"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                    aria-disabled={currentPage === 1}
                  >
                    Previous
                  </Link>
                  <span className="text-[10px] text-slate-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Link
                    href={buildPageHref(
                      Math.min(totalPages, currentPage + 1),
                    )}
                    className={[
                      "inline-flex items-center rounded-full border px-3 py-1 text-[10px]",
                      currentPage === totalPages
                        ? "cursor-not-allowed border-slate-200 text-slate-300"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                    aria-disabled={currentPage === totalPages}
                  >
                    Next
                  </Link>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
