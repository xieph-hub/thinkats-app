// app/ats/applications/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Applications",
  description:
    "Workspace-wide view of all job applications, across roles and clients, with filters for status and job.",
};

type ApplicationsPageSearchParams = {
  q?: string | string[];
  status?: string | string[];
  jobId?: string | string[];
};

type PageProps = {
  searchParams?: ApplicationsPageSearchParams;
};

function firstString(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default async function AtsApplicationsPage({
  searchParams = {},
}: PageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

  // 🔓 No per-page tenant membership gate here.
  // Access is enforced in app/ats/layout.tsx,
  // and data is scoped by tenantId in the queries below.

  const filterQ = firstString(searchParams.q).trim();
  const rawStatus = firstString(searchParams.status).trim().toUpperCase();
  const filterStatus =
    rawStatus === "PENDING" ||
    rawStatus === "IN_REVIEW" ||
    rawStatus === "OFFERED" ||
    rawStatus === "HIRED" ||
    rawStatus === "REJECTED"
      ? rawStatus
      : "ALL";

  const filterJobId = firstString(searchParams.jobId).trim();

  // Base scoping – applications for jobs under this tenant
  const baseWhere: any = {
    job: {
      tenantId: tenant.id,
    },
  };

  const where: any = { ...baseWhere };
  const andConditions: any[] = [];

  if (filterQ) {
    andConditions.push({
      OR: [
        { fullName: { contains: filterQ, mode: "insensitive" } },
        { email: { contains: filterQ, mode: "insensitive" } },
        {
          job: {
            title: { contains: filterQ, mode: "insensitive" },
          },
        },
        {
          candidate: {
            fullName: { contains: filterQ, mode: "insensitive" },
          },
        },
      ],
    });
  }

  if (filterStatus !== "ALL") {
    andConditions.push({
      status: filterStatus,
    });
  }

  if (filterJobId) {
    andConditions.push({
      jobId: filterJobId,
    });
  }

  if (andConditions.length > 0) {
    (where as any).AND = andConditions;
  }

  const [totalApplications, applications, jobs] = await Promise.all([
    prisma.jobApplication.count({ where: baseWhere }),
    prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        job: true,
        candidate: true,
      },
    }),
    prisma.job.findMany({
      where: { tenantId: tenant.id },
      orderBy: { title: "asc" },
    }),
  ]);

  const visibleApplications = applications.length;

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/ats/dashboard" className="hover:underline">
            ATS
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">Applications</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Applications
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Every job application across this workspace. Filter by job,
              candidate, or status to manage your pipeline at a glance.
            </p>
          </div>

          <div className="flex flex-col items-end text-right text-[11px] text-slate-500">
            <span className="font-medium text-slate-800">
              {tenant.name}
            </span>
            <span className="text-[10px] text-slate-400">
              {visibleApplications} of {totalApplications} applications visible
            </span>
          </div>
        </div>
      </header>

      {/* Filters + table */}
      <main className="flex flex-1 flex-col bg-slate-50 px-5 py-4">
        {/* Filters row */}
        <section className="mb-3 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-[11px] text-slate-700">
          <form className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              name="q"
              defaultValue={filterQ}
              placeholder="Search by candidate, email or job…"
              className="h-8 min-w-[220px] flex-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
            />

            <select
              name="jobId"
              defaultValue={filterJobId || ""}
              className="h-8 w-[220px] rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
            >
              <option value="">All jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={filterStatus === "ALL" ? "" : filterStatus}
              className="h-8 w-[180px] rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In review</option>
              <option value="OFFERED">Offered</option>
              <option value="HIRED">Hired</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              type="submit"
              className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800"
            >
              Apply filters
            </button>
            <Link
              href="/ats/applications"
              className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-600 hover:bg-slate-50"
            >
              Reset
            </Link>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>
              Use this view to see where candidates are in the funnel, then
              click into any row for full context.
            </span>
          </div>
        </section>

        {/* Applications table */}
        <section className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white">
          {applications.length === 0 ? (
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
                  {applications.map((app, idx) => {
                    const candidateName =
                      app.candidate?.fullName || app.fullName || "Unnamed";
                    const candidateEmail = app.email || app.candidate?.email;
                    const jobTitle = app.job?.title || "Job removed";
                    const createdDate = app.createdAt.toISOString().slice(0, 10);
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
                              {candidateName}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {candidateEmail || "No email on record"}
                            </span>
                          </div>
                        </td>

                        {/* Job */}
                        <td className="border-b border-slate-100 px-3 py-2 align-top">
                          <div className="flex flex-col gap-0.5">
                            {app.job ? (
                              <Link
                                href={`/ats/jobs/${app.jobId}`}
                                className="text-[11px] font-medium text-slate-900 hover:underline"
                              >
                                {jobTitle}
                              </Link>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-900">
                                {jobTitle}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500">
                              {app.location || "Location not set"}
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
        </section>
      </main>
    </div>
  );
}
