// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | ATS Candidates",
  description:
    "Talent pool view for all candidates associated with roles in the current ThinkATS tenant.",
};

interface CandidatesPageSearchParams {
  q?: string | string[];
  status?: string | string[];
  location?: string | string[];
  source?: string | string[];
  stage?: string | string[];
  tenantId?: string | string[];
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function titleCaseFromEnum(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStageName(value: string) {
  const key = value.toUpperCase();
  const map: Record<string, string> = {
    APPLIED: "Applied",
    SCREEN: "Screen",
    SCREENING: "Screening",
    SHORTLISTED: "Shortlisted",
    INTERVIEW: "Interview",
    INTERVIEWING: "Interviewing",
    OFFER: "Offer",
    OFFERED: "Offered",
    HIRED: "Hired",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
  };
  if (map[key]) return map[key];
  return titleCaseFromEnum(value);
}

function applicationStatusBadgeClass(value?: string | null) {
  const key = (value || "").toUpperCase();
  if (key === "PENDING") {
    return "bg-slate-50 text-slate-700 border-slate-200";
  }
  if (key === "IN_PROGRESS") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }
  if (key === "ON_HOLD") {
    return "bg-amber-50 text-amber-800 border-amber-100";
  }
  if (key === "HIRED") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (key === "REJECTED" || key === "ARCHIVED") {
    return "bg-rose-50 text-rose-700 border-rose-100";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

type CandidateView = {
  id: string;
  candidateId: string | null;
  name: string;
  email: string;
  location: string;
  primaryStage: string;
  primaryStageKey: string;
  primaryStatus: string;
  primaryStatusKey: string;
  primaryStageLabel: string;
  primaryStatusLabel: string;
  lastAppliedAt: Date;
  lastAppliedJobId: string | null;
  lastAppliedJobTitle: string | null;
  rolesCount: number;
  sources: string[];
};

export default async function AtsCandidatesPage({
  searchParams,
}: {
  searchParams?: CandidatesPageSearchParams;
}) {
  // -----------------------------
  // Resolve search params
  // -----------------------------
  const rawQ = searchParams?.q ?? "";
  const q =
    Array.isArray(rawQ) && rawQ.length > 0
      ? rawQ[0]
      : typeof rawQ === "string"
      ? rawQ
      : "";

  const rawStatus = searchParams?.status ?? "all";
  const statusFilter =
    Array.isArray(rawStatus) && rawStatus.length > 0
      ? rawStatus[0]
      : typeof rawStatus === "string"
      ? rawStatus
      : "all";
  const statusFilterKey = (statusFilter || "all").toLowerCase();

  const rawLocation = searchParams?.location ?? "all";
  const locationFilter =
    Array.isArray(rawLocation) && rawLocation.length > 0
      ? rawLocation[0]
      : typeof rawLocation === "string"
      ? rawLocation
      : "all";

  const rawSource = searchParams?.source ?? "all";
  const sourceFilter =
    Array.isArray(rawSource) && rawSource.length > 0
      ? rawSource[0]
      : typeof rawSource === "string"
      ? rawSource
      : "all";

  const rawStage = searchParams?.stage ?? "all";
  const stageFilter =
    Array.isArray(rawStage) && rawStage.length > 0
      ? rawStage[0]
      : typeof rawStage === "string"
      ? rawStage
      : "all";
  const stageFilterKey = (stageFilter || "all").toUpperCase();

  const rawTenant = searchParams?.tenantId ?? "";
  const tenantParam =
    Array.isArray(rawTenant) && rawTenant.length > 0
      ? rawTenant[0]
      : typeof rawTenant === "string"
      ? rawTenant
      : "";

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
  });

  let selectedTenant =
    (tenantParam &&
      tenants.find(
        (t) => t.id === tenantParam || (t as any).slug === tenantParam,
      )) ||
    (await getResourcinTenant());

  if (!selectedTenant) {
    throw new Error("No default tenant found.");
  }

  const tenantId = selectedTenant.id;

  // -----------------------------
  // Load applications scoped by tenant via job → tenantId
  // -----------------------------
  const applications = await prisma.jobApplication.findMany({
    where: {
      job: {
        tenantId,
      },
    },
    include: {
      candidate: true,
      job: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // -----------------------------
  // Aggregate into candidate-level view
  // -----------------------------
  const candidateMap = new Map<string, CandidateView>();

  for (const app of applications) {
    const candidate = app.candidate;
    const dbId = candidate?.id ?? null;

    const key =
      dbId ||
      `no-id:${(app as any).email || app.id || Math.random().toString(36)}`;

    const name =
      candidate?.fullName || app.fullName || "Unnamed candidate";
    const email =
      candidate?.email || (app as any).email || "";

    const location =
      candidate?.location || app.location || "Not specified";

    const stage = app.stage || "APPLIED";
    const stageKey = stage.toUpperCase();
    const status = app.status || "PENDING";
    const statusKey = status.toUpperCase();

    const jobTitle = app.job?.title || null;
    const jobId = app.job?.id || null;

    const existing = candidateMap.get(key);

    if (!existing) {
      candidateMap.set(key, {
        id: key,
        candidateId: dbId,
        name,
        email,
        location,
        primaryStage: stage,
        primaryStageKey: stageKey,
        primaryStatus: status,
        primaryStatusKey: statusKey,
        primaryStageLabel: formatStageName(stage),
        primaryStatusLabel: titleCaseFromEnum(status),
        lastAppliedAt: app.createdAt,
        lastAppliedJobId: jobId,
        lastAppliedJobTitle: jobTitle,
        rolesCount: jobId ? 1 : 0,
        sources: app.source ? [app.source] : [],
      });
    } else {
      const rolesSet = new Set<string>();
      if (existing.rolesCount > 0 && existing.lastAppliedJobId) {
        rolesSet.add(existing.lastAppliedJobId);
      }
      if (jobId) {
        rolesSet.add(jobId);
      }

      const sourcesSet = new Set(existing.sources);
      if (app.source) sourcesSet.add(app.source);

      candidateMap.set(key, {
        ...existing,
        rolesCount: rolesSet.size,
        sources: Array.from(sourcesSet),
      });
    }
  }

  const allCandidateViews = Array.from(candidateMap.values());

  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  const totalCandidates = allCandidateViews.length;
  const inProcessCandidates = allCandidateViews.filter((c) =>
    ["IN_PROGRESS", "ON_HOLD"].includes(c.primaryStatusKey),
  ).length;
  const hiredCandidates = allCandidateViews.filter(
    (c) => c.primaryStatusKey === "HIRED",
  ).length;
  const rejectedCandidates = allCandidateViews.filter((c) =>
    ["REJECTED", "ARCHIVED"].includes(c.primaryStatusKey),
  ).length;
  const newLast30Days = allCandidateViews.filter((c) => {
    return now - c.lastAppliedAt.getTime() <= THIRTY_DAYS;
  }).length;

  // Distinct locations / sources / stages for filters
  const allLocations = Array.from(
    new Set(
      allCandidateViews
        .map((c) => c.location)
        .filter((loc) => loc && loc !== "Not specified"),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const allSources = Array.from(
    new Set(
      allCandidateViews
        .flatMap((c) => c.sources)
        .filter((s) => s && s.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const allStages = Array.from(
    new Set(allCandidateViews.map((c) => c.primaryStageKey)),
  ).sort();

  // -----------------------------
  // Apply filters
  // -----------------------------
  let candidates = allCandidateViews.filter((c) => {
    let ok = true;

    // Status filter
    if (statusFilterKey !== "all") {
      if (statusFilterKey === "in_process") {
        ok =
          ok &&
          (c.primaryStatusKey === "IN_PROGRESS" ||
            c.primaryStatusKey === "ON_HOLD");
      } else if (statusFilterKey === "hired") {
        ok = ok && c.primaryStatusKey === "HIRED";
      } else if (statusFilterKey === "rejected") {
        ok =
          ok &&
          (c.primaryStatusKey === "REJECTED" ||
            c.primaryStatusKey === "ARCHIVED");
      }
    }

    // Stage filter
    if (stageFilterKey !== "ALL" && stageFilterKey !== "ALL_STAGES") {
      if (stageFilterKey !== "ALL") {
        ok = ok && c.primaryStageKey === stageFilterKey;
      }
    }

    // Location filter
    if (locationFilter !== "all") {
      ok = ok && c.location === locationFilter;
    }

    // Source filter
    if (sourceFilter !== "all") {
      ok = ok && c.sources.includes(sourceFilter);
    }

    // Search
    if (q) {
      const haystack = (
        c.name +
        " " +
        c.email +
        " " +
        (c.location || "") +
        " " +
        (c.lastAppliedJobTitle || "")
      ).toLowerCase();
      ok = ok && haystack.includes(q.toLowerCase());
    }

    return ok;
  });

  candidates.sort(
    (a, b) => b.lastAppliedAt.getTime() - a.lastAppliedAt.getTime(),
  );

  const filteredCount = candidates.length;

  const clearFiltersHref = (() => {
    const url = new URL("/ats/candidates", "http://dummy");
    url.searchParams.set("tenantId", tenantId);
    return url.pathname + url.search;
  })();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS · Candidates
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Talent pool
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            All candidates who have engaged with roles under{" "}
            <span className="font-medium text-slate-900">
              {selectedTenant.name ?? (selectedTenant as any).slug ?? "Resourcin"}
            </span>
            . Use filters to focus on active pipelines, hires or rejections.
          </p>
        </div>

        {/* Tenant selector */}
        <form method="GET" className="hidden items-center gap-2 sm:flex">
          {/* Preserve filters when switching tenant */}
          {q && <input type="hidden" name="q" value={q} />}
          {statusFilter && statusFilter !== "all" && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          {locationFilter && locationFilter !== "all" && (
            <input type="hidden" name="location" value={locationFilter} />
          )}
          {sourceFilter && sourceFilter !== "all" && (
            <input type="hidden" name="source" value={sourceFilter} />
          )}
          {stageFilter && stageFilter !== "all" && (
            <input type="hidden" name="stage" value={stageFilter} />
          )}

          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              Tenant
            </span>
            <select
              name="tenantId"
              defaultValue={tenantId}
              className="border-none bg-transparent text-[11px] text-slate-900 outline-none focus:ring-0"
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name ?? (tenant as any).slug ?? tenant.id}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="text-[11px] font-medium text-[#172965] hover:underline"
            >
              Switch
            </button>
          </div>
        </form>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Total candidates
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#172965]">
            {totalCandidates}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {filteredCount !== totalCandidates
              ? `${filteredCount} match current filters`
              : "All time across this tenant"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            In process
          </p>
          <p className="mt-2 text-2xl font-semibold text-blue-700">
            {inProcessCandidates}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Marked as in progress or on hold
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Hired
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {hiredCandidates}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Across all roles under this tenant
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            New last 30 days
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#64C247]">
            {newLast30Days}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            First seen in the last 30 days
          </p>
        </div>
      </div>

      {/* Filters */}
      <form
        method="GET"
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        {/* Keep tenantId when filtering */}
        <input type="hidden" name="tenantId" value={tenantId} />

        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label htmlFor="q" className="sr-only">
              Search candidates
            </label>
            <div className="relative">
              <input
                id="q"
                name="q"
                type="text"
                defaultValue={q}
                placeholder="Search by name, email, location, role..."
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px] text-slate-400">
                ⌕
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:w-auto">
            {/* Status filter */}
            <div>
              <label htmlFor="status" className="sr-only">
                Status filter
              </label>
              <select
                id="status"
                name="status"
                defaultValue={statusFilter || "all"}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="all">All statuses</option>
                <option value="in_process">In process</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected / archived</option>
              </select>
            </div>

            {/* Stage filter */}
            <div>
              <label htmlFor="stage" className="sr-only">
                Stage filter
              </label>
              <select
                id="stage"
                name="stage"
                defaultValue={stageFilter || "all"}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="all">All stages</option>
                {allStages.map((stageKey) => (
                  <option key={stageKey} value={stageKey}>
                    {formatStageName(stageKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* Location filter */}
            <div>
              <label htmlFor="location" className="sr-only">
                Location filter
              </label>
              <select
                id="location"
                name="location"
                defaultValue={locationFilter || "all"}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="all">All locations</option>
                {allLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Source filter */}
            <div>
              <label htmlFor="source" className="sr-only">
                Source filter
              </label>
              <select
                id="source"
                name="source"
                defaultValue={sourceFilter || "all"}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="all">All sources</option>
                {allSources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-[#172965] px-3 py-2 text-xs font-medium text-white hover:bg-[#12204d]"
            >
              Apply
            </button>
          </div>
        </div>

        {statusFilterKey !== "all" ||
        stageFilterKey !== "ALL" ||
        locationFilter !== "all" ||
        sourceFilter !== "all" ||
        !!q ? (
          <Link
            href={clearFiltersHref}
            className="text-[11px] text-slate-500 hover:text-slate-800"
          >
            Clear filters
          </Link>
        ) : null}
      </form>

      {/* Candidate list */}
      {candidates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No candidates match the current filters. Adjust your search or remove
          some filters to see more of the pool.
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="flex items-stretch justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-[#172965]/70 hover:shadow-md"
            >
              {/* Left: candidate meta */}
              <div className="flex min-w-0 flex-1 gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                  {c.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("") || "C"}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {c.name}
                    </span>
                    {c.email && (
                      <span className="truncate text-[11px] text-slate-500">
                        {c.email}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                    <span className="font-medium text-slate-800">
                      {c.location || "Location not set"}
                    </span>
                    {c.lastAppliedJobTitle && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>
                          Last applied to{" "}
                          <span className="font-medium">
                            {c.lastAppliedJobTitle}
                          </span>
                        </span>
                      </>
                    )}
                    {c.rolesCount > 1 && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{c.rolesCount} roles</span>
                      </>
                    )}
                    {c.sources.length > 0 && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>
                          Source:{" "}
                          <span className="font-medium">
                            {c.sources[0]}
                            {c.sources.length > 1 &&
                              ` (+${c.sources.length - 1} more)`}
                          </span>
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span>Last applied {formatDate(c.lastAppliedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Right: stage / status and quick links */}
              <div className="flex shrink-0 flex-col items-end justify-between gap-2 text-right text-[11px] text-slate-600">
                <div className="flex flex-wrap justify-end gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-700">
                    {formatStageName(c.primaryStage)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${applicationStatusBadgeClass(
                      c.primaryStatus,
                    )}`}
                  >
                    {c.primaryStatusLabel}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {c.lastAppliedJobId && (
                    <Link
                      href={`/ats/jobs/${c.lastAppliedJobId}?tenantId=${encodeURIComponent(
                        tenantId,
                      )}`}
                      className="text-[11px] font-medium text-[#172965] hover:underline"
                    >
                      View pipeline
                    </Link>
                  )}
                  {c.candidateId && (
                    <Link
                      href={`/ats/candidates/${c.candidateId}?tenantId=${encodeURIComponent(
                        tenantId,
                      )}`}
                      className="text-[11px] text-slate-500 hover:text-slate-800"
                    >
                      View candidate profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
