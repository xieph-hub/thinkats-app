// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { matchesBooleanQuery } from "@/lib/booleanSearch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Candidates",
  description: "All candidates in this ATS workspace.",
};

type PageProps = {
  searchParams?: {
    q?: string;
    source?: string;
    stage?: string;
    status?: string;
    tier?: string;
    viewId?: string;
  };
};

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

export default async function CandidatesPage({
  searchParams = {},
}: PageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

  const rawViewId =
    typeof searchParams.viewId === "string" ? searchParams.viewId : "";

  const savedViewsRaw = await prisma.savedView.findMany({
    where: {
      tenantId: tenant.id,
      scope: "candidates",
    },
    orderBy: { createdAt: "asc" },
  });

  const viewFromId =
    rawViewId && savedViewsRaw.length
      ? savedViewsRaw.find((v) => v.id === rawViewId) || null
      : null;

  const defaultView =
    savedViewsRaw.find((v) => v.isDefault) || null;

  const activeView = viewFromId || defaultView || null;

  // Base filters
  let filterQ = "";
  let filterSource = "ALL";
  let filterStage = "ALL";
  let filterStatus = "ALL";
  let filterTier = "ALL";

  if (activeView) {
    const params = (activeView.params || {}) as any;
    if (typeof params.q === "string") filterQ = params.q;
    if (typeof params.source === "string")
      filterSource = params.source;
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
    typeof searchParams.source === "string" &&
    searchParams.source !== ""
  ) {
    filterSource = searchParams.source;
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

  const currentViewId =
    typeof searchParams.viewId === "string"
      ? searchParams.viewId
      : activeView?.id || "";

  const candidatesRaw = await prisma.candidate.findMany({
    where: {
      tenantId: tenant.id,
    },
    orderBy: { createdAt: "desc" },
    take: 300,
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

  // Build option sets for filters
  const sourceSet = new Set<string>();
  const stageSet = new Set<string>();
  const statusSet = new Set<string>();
  const tierSet = new Set<string>();

  for (const c of candidatesRaw) {
    const primaryApp = c.applications[0] || null;
    const effectiveSource =
      (c.source || primaryApp?.source || "").trim();
    if (effectiveSource) sourceSet.add(effectiveSource);

    const stage =
      (primaryApp?.stage || "APPLIED").toUpperCase();
    stageSet.add(stage);

    const status =
      (primaryApp?.status || "PENDING").toUpperCase();
    statusSet.add(status);

    const tier = derivePrimaryTier(c.applications);
    if (tier) tierSet.add(tier.toUpperCase());
  }

  const sourceOptions = Array.from(sourceSet).sort();
  const stageOptions = Array.from(stageSet).sort();
  const statusOptions = Array.from(statusSet).sort();
  const tierOptions = Array.from(tierSet).sort();

  // Apply filters in memory
  const filteredCandidates = [];

  for (const c of candidatesRaw) {
    const primaryApp = c.applications[0] || null;
    const primaryTier = derivePrimaryTier(c.applications);

    const effectiveSource =
      (c.source || primaryApp?.source || "").trim();
    const stage =
      (primaryApp?.stage || "APPLIED").toUpperCase();
    const status =
      (primaryApp?.status || "PENDING").toUpperCase();

    const latest = primaryApp?.scoringEvents?.[0];
    const score =
      (latest?.score as number | null | undefined) ??
      (primaryApp?.matchScore as number | null | undefined) ??
      null;

    // Boolean query
    const haystack = [
      c.fullName,
      c.email,
      c.location,
      c.currentTitle,
      c.currentCompany,
      c.source,
      ...c.tags.map((ct) => ct.tag?.name ?? ""),
      ...c.applications.map((a) => a.job?.title ?? ""),
      ...c.applications.map(
        (a) => a.job?.clientCompany?.name ?? "",
      ),
    ]
      .filter(Boolean)
      .join(" ");

    const matchesQuery = matchesBooleanQuery(filterQ, {
      haystack,
      fields: {
        name: c.fullName,
        email: c.email,
        location: c.location,
        title: c.currentTitle,
        company: c.currentCompany,
        source: effectiveSource,
        stage,
        status,
        tier: primaryTier || "",
      },
    });

    if (!matchesQuery) continue;

    if (
      filterSource !== "ALL" &&
      filterSource &&
      effectiveSource.toLowerCase() !==
        filterSource.toLowerCase()
    ) {
      continue;
    }

    if (
      filterStage !== "ALL" &&
      stage !== filterStage.toUpperCase()
    ) {
      continue;
    }

    if (
      filterStatus !== "ALL" &&
      status !== filterStatus.toUpperCase()
    ) {
      continue;
    }

    if (
      filterTier !== "ALL" &&
      (primaryTier || "").toUpperCase() !==
        filterTier.toUpperCase()
    ) {
      continue;
    }

    filteredCandidates.push({
      candidate: c,
      primaryApp,
      primaryTier,
      effectiveSource,
      score,
    });
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/ats" className="hover:underline">
            Workspace
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">
            Candidates
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-slate-900">
              Candidates
            </h1>
            <p className="text-[11px] text-slate-500">
              Talent pool across all jobs in this tenant. Use views,
              search and filters to slice the pipeline.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right text-[11px] text-slate-500">
            <span>
              Total candidates:{" "}
              <span className="font-semibold text-slate-800">
                {candidatesRaw.length}
              </span>
            </span>
            <span>
              Visible now:{" "}
              <span className="font-semibold text-slate-800">
                {filteredCandidates.length}
              </span>
            </span>
            {activeView && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                Active view: {activeView.name}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Filters + saved views */}
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <form
            method="GET"
            className="flex flex-wrap items-end gap-2 text-xs"
          >
            {/* Saved view selector */}
            <div className="flex flex-col">
              <label className="mb-1 text-[11px] text-slate-600">
                View
              </label>
              <select
                name="viewId"
                defaultValue={currentViewId}
                className="h-8 min-w-[150px] rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
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
              <label className="mb-1 text-[11px] text-slate-600">
                Search
              </label>
              <input
                type="text"
                name="q"
                defaultValue={filterQ}
                placeholder='e.g. "backend engineer" source:referral -contract'
                className="h-8 w-64 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-[11px] text-slate-600">
                Source
              </label>
              <select
                name="source"
                defaultValue={filterSource}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
              >
                <option value="ALL">All</option>
                {sourceOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-[11px] text-slate-600">
                Stage (latest app)
              </label>
              <select
                name="stage"
                defaultValue={filterStage}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
              >
                <option value="ALL">All</option>
                {stageOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-[11px] text-slate-600">
                Status (latest app)
              </label>
              <select
                name="status"
                defaultValue={filterStatus}
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800"
              >
                <option value="ALL">All</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
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
                {tierOptions.map((t) => (
                  <option key={t} value={t}>
                    Tier {t}
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
              href="/ats/candidates"
              className="mt-5 inline-flex h-8 items-center rounded-full border border-slate-300 bg-white px-3 text-[11px] text-slate-600 hover:bg-slate-100"
            >
              Reset
            </Link>
          </form>

          {/* Save view form */}
          <form
            action="/api/ats/views"
            method="POST"
            className="mt-2 flex flex-wrap items-end gap-2 text-xs lg:mt-0"
          >
            <input type="hidden" name="scope" value="candidates" />
            <input
              type="hidden"
              name="redirectTo"
              value="/ats/candidates"
            />
            <input type="hidden" name="q" value={filterQ} />
            <input
              type="hidden"
              name="source"
              value={filterSource}
            />
            <input type="hidden" name="stage" value={filterStage} />
            <input
              type="hidden"
              name="status"
              value={filterStatus}
            />
            <input type="hidden" name="tier" value={filterTier} />

            <div className="flex flex-col">
              <label className="mb-1 text-[11px] text-slate-600">
                Save current filters as view
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Senior · Lagos · Interviewing"
                className="h-8 w-64 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
              />
            </div>
            <label className="mb-1 flex items-center gap-1 text-[11px] text-slate-600">
              <input
                type="checkbox"
                name="setDefault"
                className="h-3 w-3 rounded border-slate-400"
              />
              <span>Set as default view</span>
            </label>
            <button
              type="submit"
              className="inline-flex h-8 items-center rounded-full bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
            >
              Save view
            </button>
          </form>
        </div>
      </div>

      {/* Table */}
      <main className="flex flex-1 flex-col bg-slate-50 px-5 py-4">
        {filteredCandidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
            No candidates match the current filters. Try clearing the
            search or changing the view.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50">
                <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 text-left">Candidate</th>
                  <th className="px-4 py-2 text-left">Latest pipeline</th>
                  <th className="px-4 py-2 text-left">Source</th>
                  <th className="px-4 py-2 text-left">Tier / score</th>
                  <th className="px-4 py-2 text-left">Last activity</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map(
                  ({ candidate, primaryApp, primaryTier, effectiveSource, score }) => (
                    <tr key={candidate.id} className="align-top">
                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-1">
                            <Link
                              href={`/ats/candidates/${candidate.id}`}
                              className="text-[13px] font-semibold text-slate-900 hover:underline"
                            >
                              {candidate.fullName}
                            </Link>
                            {candidate.location && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                                {candidate.location}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {candidate.email}
                            {candidate.currentTitle && (
                              <>
                                {" · "}
                                {candidate.currentTitle}
                              </>
                            )}
                            {candidate.currentCompany && (
                              <>
                                {" · "}
                                {candidate.currentCompany}
                              </>
                            )}
                          </div>
                          {candidate.tags.length > 0 && (
                            <div className="mt-0.5 flex flex-wrap gap-1">
                              {candidate.tags
                                .map((ct) => ct.tag)
                                .filter(
                                  (t): t is NonNullable<typeof t> =>
                                    Boolean(t),
                                )
                                .map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-2">
                        {primaryApp ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex flex-wrap items-center gap-1">
                              {primaryApp.job && (
                                <span className="font-medium text-slate-800">
                                  {primaryApp.job.title ||
                                    "Untitled role"}
                                </span>
                              )}
                              {primaryApp.job?.clientCompany && (
                                <span className="text-[10px] text-slate-500">
                                  · {primaryApp.job.clientCompany.name}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Stage:{" "}
                              <span className="font-medium">
                                {primaryApp.stage || "APPLIED"}
                              </span>{" "}
                              · Status:{" "}
                              <span className="font-medium">
                                {primaryApp.status || "PENDING"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Not yet in any job pipeline.
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-2 text-[11px] text-slate-600">
                        {effectiveSource || "—"}
                      </td>

                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-1">
                          {primaryTier && (
                            <span
                              className={[
                                "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                tierChipColor(primaryTier),
                              ].join(" ")}
                            >
                              Tier {primaryTier}
                            </span>
                          )}
                          {score != null && (
                            <span
                              className={[
                                "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                                scoreChipColor(score),
                              ].join(" ")}
                            >
                              Score {score}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-2 text-[11px] text-slate-600">
                        {formatDate(
                          primaryApp?.createdAt ?? candidate.createdAt,
                        )}
                      </td>

                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/ats/candidates/${candidate.id}`}
                          className="inline-flex h-7 items-center rounded-full border border-slate-300 bg-white px-3 text-[11px] text-slate-700 hover:bg-slate-50"
                        >
                          Open profile
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
