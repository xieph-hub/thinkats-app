// app/ats/candidates/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { listTenantJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

// ----------------------
// Small helpers
// ----------------------
function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalize(value: string | null | undefined) {
  if (!value) return "";
  return String(value).toUpperCase();
}

function formatLabel(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  const clean = value.toString().trim().replace(/\s+/g, " ");
  return clean
    .toLowerCase()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stageBadgeClass(stage: string | null | undefined) {
  const v = normalize(stage);
  if (v === "OFFER") {
    // Offer – Resourcin Yellow
    return "rounded-full bg-[#FFC000]/10 px-2 py-0.5 text-[10px] font-medium text-[#7A5600]";
  }
  if (v === "HIRED" || v === "Hired") {
    // Hired – Resourcin Greens
    return "rounded-full bg-[#64C247]/10 px-2 py-0.5 text-[10px] font-medium text-[#306B34]";
  }
  if (v === "REJECTED") {
    return "rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700";
  }
  if (v === "INTERVIEW" || v === "INTERVIEWING" || v === "SCREENING") {
    // In process – Resourcin Blue
    return "rounded-full bg-[#172965]/10 px-2 py-0.5 text-[10px] font-medium text-[#172965]";
  }
  // Default
  return "rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600";
}

function statusBadgeClass(status: string | null | undefined) {
  const v = normalize(status);
  if (v === "PENDING" || v === "OPEN") {
    return "rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600";
  }
  if (v === "ACTIVE" || v === "IN_PROGRESS") {
    return "rounded-full bg-[#172965]/10 px-2 py-0.5 text-[10px] font-medium text-[#172965]";
  }
  if (v === "ON_HOLD") {
    return "rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700";
  }
  if (v === "REJECTED" || v === "ARCHIVED") {
    return "rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700";
  }
  // Fallback
  return "rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600";
}

type RawSearchParams = {
  [key: string]: string | string[] | undefined;
};

// 🔑 Safely derive the candidate link id
function getCandidateLinkId(app: any): string | null {
  // Prefer the Candidate relation if present
  if (app.candidate?.id && app.candidate.id !== "null") {
    return app.candidate.id;
  }

  // Fall back to the foreign key on JobApplication if it exists
  if (app.candidateId && app.candidateId !== "null") {
    return app.candidateId;
  }

  // As a last resort, you *can* link by email – candidate detail
  // page is written to understand non-UUID identifiers too.
  if (app.candidate?.email) {
    return app.candidate.email;
  }
  if (app.email) {
    return app.email;
  }

  return null;
}

// ----------------------
// Data loader
// ----------------------
async function getCandidatesInboxData(searchParams: {
  q?: string;
  jobId?: string;
  source?: string;
  view?: string;
}) {
  const tenant = await getResourcinTenant();
  if (!tenant) return null;

  const jobs = await listTenantJobs(tenant.id);

  const { q, jobId, source, view } = searchParams;

  const where: any = {
    job: {
      tenantId: tenant.id,
    },
  };

  if (q && q.trim()) {
    where.OR = [
      {
        fullName: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        candidate: {
          fullName: {
            contains: q,
            mode: "insensitive",
          },
        },
      },
      {
        job: {
          title: {
            contains: q,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  if (jobId && jobId !== "all") {
    where.jobId = jobId;
  }

  if (source && source !== "all") {
    where.source = source;
  }

  // Saved views → translate to simple stage/status filters
  if (view && view !== "all") {
    const andClauses: any[] = where.AND ? [...where.AND] : [];

    if (view === "new") {
      // New leads: fresh applicants
      andClauses.push({ stage: "APPLIED" });
    } else if (view === "interviewing") {
      andClauses.push({
        stage: {
          in: ["SCREENING", "INTERVIEW", "INTERVIEWING"],
        },
      });
    } else if (view === "offer") {
      andClauses.push({ stage: "OFFER" });
    } else if (view === "rejected") {
      andClauses.push({ status: "REJECTED" });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }
  }

  const applications = await prisma.jobApplication.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      job: true,
      candidate: true,
    },
    take: 50,
  });

  // Derive available sources for filter
  const sources = Array.from(
    new Set(
      applications
        .map((a) => a.source)
        .filter((s): s is string => !!s && s.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return {
    tenant,
    jobs,
    applications,
    filters: {
      q: q || "",
      jobId: jobId || "all",
      source: source || "all",
      view: view || "all",
    },
    sources,
  };
}

// ----------------------
// Page component
// ----------------------
export default async function CandidatesInboxPage({
  searchParams,
}: {
  searchParams?: RawSearchParams;
}) {
  const q =
    typeof searchParams?.q === "string" ? searchParams.q : "";
  const jobId =
    typeof searchParams?.jobId === "string"
      ? searchParams.jobId
      : "all";
  const source =
    typeof searchParams?.source === "string"
      ? searchParams.source
      : "all";
  const view =
    typeof searchParams?.view === "string"
      ? searchParams.view
      : "all";

  const data = await getCandidatesInboxData({
    q,
    jobId,
    source,
    view,
  });

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-xl font-semibold text-slate-900">
          Candidates inbox
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default tenant configured. Please ensure{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_ID
          </code>{" "}
          or{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_SLUG
          </code>{" "}
          are set.
        </p>
      </div>
    );
  }

  const { tenant, jobs, applications, filters, sources } = data;

  const buildViewHref = (viewId: string) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.jobId && filters.jobId !== "all") {
      params.set("jobId", filters.jobId);
    }
    if (filters.source && filters.source !== "all") {
      params.set("source", filters.source);
    }
    if (viewId && viewId !== "all") {
      params.set("view", viewId);
    }
    const query = params.toString();
    return query ? `/ats/candidates?${query}` : "/ats/candidates";
  };

  const viewTabs = [
    { id: "all", label: "All" },
    { id: "new", label: "New leads" },
    { id: "interviewing", label: "Interviewing" },
    { id: "offer", label: "Offer" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Candidates
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Inbox view of applications and candidate activity for{" "}
            <span className="font-medium text-slate-900">
              {tenant.name || "Resourcin"}
            </span>
            .
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
          Tenant:{" "}
          <span className="font-medium">
            {tenant.slug || tenant.name || "resourcin"}
          </span>
        </div>
      </div>

      {/* Saved views */}
      <div className="mb-4 flex flex-wrap gap-2">
        {viewTabs.map((tab) => {
          const isActive =
            filters.view === tab.id ||
            (!filters.view && tab.id === "all");
          return (
            <Link
              key={tab.id}
              href={buildViewHref(tab.id)}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium ${
                isActive
                  ? "border-[#172965] bg-[#172965] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#172965] hover:text-[#172965]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Filters */}
      <form
        className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        method="GET"
      >
        {/* Search */}
        <div className="min-w-[200px] flex-1">
          <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Search
          </label>
          <input
            type="text"
            name="q"
            defaultValue={filters.q}
            placeholder="Search by candidate, email or job title"
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        {/* Job filter */}
        <div className="w-full sm:w-56">
          <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Job
          </label>
          <select
            name="jobId"
            defaultValue={filters.jobId}
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
          >
            <option value="all">All jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {/* Source filter */}
        <div className="w-full sm:w-48">
          <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Source
          </label>
          <select
            name="source"
            defaultValue={filters.source}
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
          >
            <option value="all">All sources</option>
            {sources.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        </div>

        {/* Keep current view on filter submit */}
        <input type="hidden" name="view" value={filters.view} />

        {/* Submit */}
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-[#172965] px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#111d4f]"
          >
            Apply filters
          </button>
        </div>
      </form>

      {/* Inbox + bulk actions */}
      <form
        method="POST"
        action="/api/ats/candidates/bulk"
        className="rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Preserve filters in bulk action POST */}
        <input type="hidden" name="q" value={filters.q} />
        <input type="hidden" name="jobId" value={filters.jobId} />
        <input type="hidden" name="source" value={filters.source} />
        <input type="hidden" name="view" value={filters.view} />

        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Candidate inbox
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Showing latest {applications.length} applications.
            </p>
          </div>
        </div>

        {/* Bulk actions toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[11px] text-slate-600">
          <span className="font-medium text-slate-700">
            With selected:
          </span>

          {/* Stage */}
          <div className="flex flex-wrap items-center gap-1">
            <label className="sr-only" htmlFor="bulk-stage">
              Stage
            </label>
            <select
              id="bulk-stage"
              name="stage"
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            >
              <option value="">Change stage…</option>
              <option value="APPLIED">Applied</option>
              <option value="SCREENING">Screening</option>
              <option value="INTERVIEWING">Interviewing</option>
              <option value="OFFER">Offer</option>
              <option value="HIRED">Hired</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button
              type="submit"
              name="action"
              value="setStage"
              className="rounded-md bg-[#172965] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#111d4f]"
            >
              Update stage
            </button>
          </div>

          {/* Status */}
          <div className="flex flex-wrap items-center gap-1">
            <label className="sr-only" htmlFor="bulk-status">
              Status
            </label>
            <select
              id="bulk-status"
              name="status"
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            >
              <option value="">Change status…</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On hold</option>
              <option value="REJECTED">Rejected</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <button
              type="submit"
              name="action"
              value="setStatus"
              className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-black"
            >
              Update status
            </button>
          </div>

          {/* Tagging */}
          <div className="flex flex-wrap items-center gap-1">
            <label className="sr-only" htmlFor="bulk-tag">
              Tag
            </label>
            <input
              id="bulk-tag"
              name="tag"
              type="text"
              placeholder="Add tag (e.g. silver medalist)"
              className="w-40 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
            <button
              type="submit"
              name="action"
              value="addTag"
              className="rounded-md bg-[#306B34] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#234f27]"
            >
              Add tag
            </button>
          </div>

          {/* Export emails */}
          <button
            type="submit"
            name="action"
            value="exportEmails"
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
          >
            Export emails
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            No applications match your filters yet. Adjust your filters
            or share your careers page to start receiving candidates.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => {
              const candidateName =
                app.fullName || app.candidate?.fullName || app.email;

              const stage = (app as any).stage as
                | string
                | null
                | undefined;
              const status = (app as any).status as
                | string
                | null
                | undefined;

              const stageLabel = formatLabel(stage, "Applied");
              const statusLabel = formatLabel(status, "Pending");

              const candidateLinkId = getCandidateLinkId(app);

              return (
                <div
                  key={app.id}
                  className="flex flex-col gap-2 px-4 py-3 text-xs text-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left: checkbox + candidate + job */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <input
                          type="checkbox"
                          name="applicationIds"
                          value={app.id}
                          className="h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {candidateLinkId ? (
                            <Link
                              href={`/ats/candidates/${candidateLinkId}`}
                              className="truncate text-sm font-medium text-slate-900 hover:text-[#172965]"`
                            >
                              {candidateName}
                            </Link>
                          ) : (
                            <span className="truncate text-sm font-medium text-slate-900">
                              {candidateName || "Unknown candidate"}
                            </span>
                          )}

                          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                            {app.location || "Location unknown"}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span>
                            Applied for{" "}
                            <span className="font-medium text-slate-800">
                              {app.job?.title || "Unknown role"}
                            </span>
                          </span>
                          {app.source && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>Source: {app.source}</span>
                            </>
                          )}
                          {app.linkedinUrl && (
                            <>
                              <span className="text-slate-300">•</span>
                              <a
                                href={app.linkedinUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#172965] hover:underline"
                              >
                                LinkedIn
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: stage/status + meta + actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className={stageBadgeClass(stage)}>
                      {stageLabel}
                    </span>
                    <span className={statusBadgeClass(status)}>
                      {statusLabel}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      {formatDate(app.createdAt as any)}
                    </span>

                    {app.cvUrl && (
                      <a
                        href={app.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-[#172965] hover:bg-slate-100"
                      >
                        View CV
                      </a>
                    )}

                    <Link
                      href={`/ats/jobs/${app.jobId}`}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 hover:border-[#172965] hover:text-[#172965]"`
                    >
                      Open job pipeline
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </form>
    </div>
  );
}
