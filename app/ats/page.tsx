// app/ats/page.tsx
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

async function getDashboardData() {
  const tenant = await getResourcinTenant();

  if (!tenant) {
    return null;
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  );

  const [
    jobsForTenant,
    totalCandidates,
    applicationsLast30Days,
    recentApplications,
  ] = await Promise.all([
    listTenantJobs(tenant.id),
    prisma.candidate.count({
      where: { tenantId: tenant.id },
    }),
    prisma.jobApplication.count({
      where: {
        job: { tenantId: tenant.id },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.jobApplication.findMany({
      where: {
        job: { tenantId: tenant.id },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        job: true,
        candidate: true,
      },
      take: 8,
    }),
  ]);

  const openJobs = jobsForTenant.filter(
    (job) => job.status === "open",
  );
  const openJobsCount = openJobs.length;

  const recentJobs = jobsForTenant.slice(0, 5);

  const avgCandidatesPerOpenJob =
    openJobsCount > 0
      ? Math.round(
          (applicationsLast30Days / openJobsCount) * 10,
        ) / 10
      : 0;

  return {
    tenant,
    openJobsCount,
    totalCandidates,
    applicationsLast30Days,
    avgCandidatesPerOpenJob,
    recentJobs,
    recentApplications,
  };
}

export default async function AtsDashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-xl font-semibold text-slate-900">
          ThinkATS dashboard
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
          are set in your environment.
        </p>
      </div>
    );
  }

  const {
    tenant,
    openJobsCount,
    totalCandidates,
    applicationsLast30Days,
    avgCandidatesPerOpenJob,
    recentJobs,
    recentApplications,
  } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            ThinkATS dashboard
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Overview of jobs, candidates and activity for{" "}
            <span className="font-medium text-slate-900">
              {tenant.name || "Resourcin"}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
            Tenant:{" "}
            <span className="font-medium">
              {tenant.slug || tenant.name || "resourcin"}
            </span>
          </div>
          <Link
            href="/ats/jobs/new"
            className="inline-flex items-center rounded-md bg-[#172965] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#111d4f]"
          >
            + New job
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Open jobs */}
        <div className="rounded-xl bg-[#172965] px-4 py-3 text-white shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-200">
            Open jobs
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {openJobsCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-200">
            Jobs currently accepting applications.
          </p>
        </div>

        {/* Applications last 30 days */}
        <div className="rounded-xl border border-[#FFC000]/40 bg-[#FFF9E6] px-4 py-3 text-slate-900 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-[#8F6A00]">
            Applications (30 days)
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {applicationsLast30Days}
          </p>
          <p className="mt-1 text-[11px] text-[#8F6A00]">
            New applications across all jobs.
          </p>
        </div>

        {/* Total candidates */}
        <div className="rounded-xl border border-[#64C247]/40 bg-[#F0FAF3] px-4 py-3 text-slate-900 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-[#306B34]">
            Candidates in talent pool
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {totalCandidates}
          </p>
          <p className="mt-1 text-[11px] text-[#306B34]">
            Unique candidates under this tenant.
          </p>
        </div>

        {/* Avg candidates per open job */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            Avg. applications / open job
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {avgCandidatesPerOpenJob}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Based on last 30 days of applications.
          </p>
        </div>
      </div>

      {/* Main grid: recent jobs + candidate inbox */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        {/* Recent jobs */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Recent jobs
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest roles created for this tenant.
              </p>
            </div>
            <Link
              href="/ats/jobs"
              className="text-xs font-medium text-[#172965] hover:underline"
            >
              View all jobs →
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No jobs yet. Create your first role to start using
              ThinkATS.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/ats/jobs/${job.id}`}
                        className="truncate text-sm font-medium text-slate-900 hover:text-[#172965]"
                      >
                        {job.title}
                      </Link>
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                        {job.status || "draft"}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      {job.location && (
                        <span>{job.location}</span>
                      )}
                      {job.employmentType && (
                        <>
                          <span className="text-slate-300">
                            •
                          </span>
                          <span>{job.employmentType}</span>
                        </>
                      )}
                      <span className="text-slate-300">•</span>
                      <span>
                        Created {formatDate(job.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <Link
                      href={`/jobs/${job.slug || job.id}`}
                      className="block text-[11px] font-medium text-[#172965] hover:underline"
                    >
                      View public page
                    </Link>
                    <Link
                      href={`/ats/jobs/${job.id}/edit`}
                      className="mt-1 block text-[11px] text-slate-500 hover:text-slate-700"
                    >
                      Edit job
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Candidate inbox */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Candidate inbox
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Most recent applications across all jobs.
              </p>
            </div>
            <Link
              href="/ats/candidates"
              className="text-xs font-medium text-[#172965] hover:underline"
            >
              View all →
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No applications yet. Share your careers page to
              start receiving candidates.
            </div>
          ) : (
            <ul className="space-y-2">
              {recentApplications.map((app) => {
                const candidateName =
                  app.fullName ||
                  app.candidate?.fullName ||
                  app.email;
                return (
                  <li
                    key={app.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">
                          {candidateName}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          Applied for{" "}
                          <span className="font-medium text-slate-800">
                            {app.job?.title || "Unknown role"}
                          </span>
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {formatDate(app.createdAt)}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      {app.source && (
                        <span className="rounded-full bg-white px-2 py-0.5">
                          Source: {app.source}
                        </span>
                      )}
                      {app.location && (
                        <span className="rounded-full bg-white px-2 py-0.5">
                          {app.location}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
