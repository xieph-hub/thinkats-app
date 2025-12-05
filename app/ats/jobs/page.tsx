// app/ats/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Jobs",
  description:
    "Admin view of all open and draft roles managed under the current ThinkATS tenant.",
};

export default async function AtsJobsPage() {
  // For now we assume a single tenant ("resourcin") in this environment.
  // getResourcinTenant should just read from Prisma (no Supabase dependency).
  const tenant = await getResourcinTenant();

  const jobs = await prisma.job.findMany({
    where: {
      tenantId: tenant.id,
    },
    include: {
      clientCompany: true,
      applications: {
        select: {
          id: true,
          createdAt: true,
          matchScore: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Jobs
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Job mandates
            </h1>
            <p className="text-xs text-slate-600">
              Overview of open, draft and closed roles under the{" "}
              <span className="font-medium">{tenant.name}</span> tenant.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
              Jobs:{" "}
              <span className="ml-1 font-semibold text-slate-800">
                {jobs.length}
              </span>
            </span>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Latest jobs
            </h2>
            <p className="text-[11px] text-slate-500">
              Showing up to 100 most recently created roles.
            </p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            No jobs yet. Create your first mandate from the ATS.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-t border-slate-100 text-xs">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Applications</th>
                  <th className="px-4 py-2 text-left">Avg. score</th>
                  <th className="px-4 py-2 text-left">Last activity</th>
                  <th className="px-4 py-2 text-left">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => {
                  const appCount = job.applications.length;
                  const avgScore =
                    appCount > 0
                      ? Math.round(
                          job.applications.reduce(
                            (sum, app) =>
                              sum + (app.matchScore ?? 0),
                            0,
                          ) / appCount,
                        )
                      : null;

                  const lastActivity =
                    job.applications[0]?.createdAt ?? job.createdAt;

                  const publicJobPath = job.slug
                    ? `/jobs/${job.slug}`
                    : `/jobs/${job.id}`;

                  return (
                    <tr key={job.id} className="align-top">
                      {/* Role */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <Link
                            href={`/ats/jobs/${job.id}`}
                            className="text-xs font-semibold text-[#172965] hover:underline"
                          >
                            {job.title}
                          </Link>
                          <p className="text-[11px] text-slate-500">
                            {job.location || job.workMode || "Location not set"}
                          </p>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-800">
                          {job.clientCompany?.name || "—"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium capitalize text-slate-900">
                            {job.status || "open"}
                          </p>
                          <p className="text-[11px] text-slate-500 capitalize">
                            {job.visibility || "public"}
                          </p>
                        </div>
                      </td>

                      {/* Applications */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-slate-900">
                          {appCount}
                        </span>
                      </td>

                      {/* Avg score */}
                      <td className="px-4 py-3">
                        {avgScore === null ? (
                          <span className="text-[11px] text-slate-400">
                            No scores yet
                          </span>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-semibold text-slate-900">
                              {avgScore}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              / 100
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Last activity */}
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {lastActivity.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Links */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-[11px]">
                          <Link
                            href={`/ats/jobs/${job.id}`}
                            className="text-[#172965] hover:underline"
                          >
                            View pipeline
                          </Link>
                          <Link
                            href={publicJobPath}
                            className="text-slate-600 hover:underline"
                          >
                            View public job
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
