// app/admin/overview/page.tsx

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Basic stats in parallel
  const [
    totalJobs,
    publishedJobs,
    totalApplications,
    applicationsLast7Days,
    pipelineRaw,
    latestApplications,
  ] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { isPublished: true } }),
    prisma.application.count(),
    prisma.application.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    // Group by stage – cast to any so TypeScript doesn’t cry
    (prisma as any).application.groupBy({
      by: ["stage"],
      _count: { _all: true },
    }),
    prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        job: { select: { id: true, title: true, slug: true } },
        candidate: {
          select: { id: true, fullname: true, email: true, location: true },
        },
      },
    }),
  ]);

  const pipeline = (pipelineRaw as { stage: string; _count: { _all: number } }[])
    .sort((a, b) => b._count._all - a._count._all);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#172965]">
              Resourcin · Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              Talent pipeline overview
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-xl">
              High-level view of jobs and applications across your mandates. Use
              this as home base, then drill into Applications or Candidates.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/applications"
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
            >
              View applications
            </Link>
            <Link
              href="/admin/candidates"
              className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#101c44]"
            >
              View candidates
            </Link>
          </div>
        </header>

        {/* Top stats */}
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium text-slate-500">
              Total jobs
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {totalJobs}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {publishedJobs} currently published
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium text-slate-500">
              Total applications
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {totalApplications}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {applicationsLast7Days} in the last 7 days
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium text-slate-500">
              Active stages
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {pipeline.length}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Based on current applications
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium text-slate-500">
              Snapshot
            </p>
            <p className="mt-1 text-sm text-slate-800">
              {pipeline[0]
                ? `${pipeline[0]._count._all} candidate${
                    pipeline[0]._count._all === 1 ? "" : "s"
                  } in “${pipeline[0].stage}”`
                : "No applications yet"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Top stage by volume
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pipeline by stage */}
          <section className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Pipeline by stage
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Quick sense of where candidates are currently sitting.
            </p>

            {pipeline.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">
                No applications yet. Once candidates start applying, you&apos;ll
                see distribution by stage here.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {pipeline.map((row) => (
                  <li
                    key={row.stage}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-slate-700">
                      {row.stage}
                    </span>
                    <span className="text-slate-500">{row._count._all}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Latest applications */}
          <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Latest applications
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  The five most recent applications across all roles.
                </p>
              </div>
              <Link
                href="/admin/applications"
                className="text-[11px] font-medium text-[#172965] hover:underline"
              >
                View all
              </Link>
            </div>

            {latestApplications.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">
                No applications yet. Share your{" "}
                <Link
                  href="/jobs"
                  className="text-[#172965] underline underline-offset-2"
                >
                  /jobs
                </Link>{" "}
                link to start collecting candidates.
              </p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">
                        Candidate
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">
                        Role
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">
                        Location
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-slate-500">
                        Applied
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-slate-500">
                        View
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {latestApplications.map((app) => (
                      <tr key={app.id}>
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">
                              {app.candidate?.fullname ?? "Unknown"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {app.candidate?.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {app.job?.title ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {app.candidate?.location ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {new Date(app.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="text-[11px] font-medium text-[#172965] hover:underline"
                          >
                            Open →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
