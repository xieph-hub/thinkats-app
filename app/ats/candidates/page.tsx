// app/ats/candidates/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { listTenantJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type RawSearchParams = {
  [key: string]: string | string[] | undefined;
};

async function getCandidatesInboxData(searchParams: {
  q?: string;
  jobId?: string;
  source?: string;
}) {
  const tenant = await getResourcinTenant();
  if (!tenant) return null;

  const jobs = await listTenantJobs(tenant.id);

  const { q, jobId, source } = searchParams;

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
    },
    sources,
  };
}

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

  const data = await getCandidatesInboxData({ q, jobId, source });

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

      {/* Filters */}
      <form
        className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        method="GET"
      >
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
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

      {/* Results */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
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

        {applications.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            No applications match your filters yet. Adjust your
            filters or share your careers page to start receiving
            candidates.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => {
              const candidateName =
                app.fullName ||
                app.candidate?.fullName ||
                app.email;

              return (
                <div
                  key={app.id}
                  className="flex flex-col gap-2 px-4 py-3 text-xs text-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left: candidate + job */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/ats/candidates/${app.candidateId}`}
                        className="truncate text-sm font-medium text-slate-900 hover:text-[#172965]"
                      >
                        {candidateName}
                      </Link>
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
                          <span className="text-slate-300">
                            •
                          </span>
                          <span>Source: {app.source}</span>
                        </>
                      )}
                      {app.linkedinUrl && (
                        <>
                          <span className="text-slate-300">
                            •
                          </span>
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

                  {/* Right: meta + actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="text-[11px] text-slate-400">
                      {formatDate(app.createdAt)}
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
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 hover:border-[#172965] hover:text-[#172965]"
                    >
                      Open job pipeline
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
