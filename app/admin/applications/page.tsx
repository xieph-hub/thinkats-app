// app/admin/applications/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";

type SearchParams = {
  jobId?: string;
  stage?: string;
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { jobId, stage } = searchParams;

  const where: any = {};
  if (jobId) where.jobId = jobId;
  if (stage) where.stage = stage;

  // Cast results to `any` so we don't fight TypeScript over Prisma types
  const [jobsRaw, applicationsRaw] = await Promise.all([
    prisma.job.findMany({
      // No orderBy here because your Job model doesn't have createdAt
      select: { id: true, title: true },
    }) as any,
    prisma.application.findMany({
      where,
      orderBy: { createdAt: "desc" } as any,
      include: {
        job: { select: { title: true } },
      },
    }) as any,
  ]);

  const jobs = jobsRaw as any[];
  const applications = applicationsRaw as any[];

  const stages = [
    "APPLIED",
    "SCREENING",
    "HM_INTERVIEW",
    "PANEL",
    "OFFER",
    "HIRED",
    "REJECTED",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Applications</h1>
            <p className="text-sm text-slate-400">
              Internal view of all candidates across roles.
            </p>
          </div>
        </header>

        {/* Filters */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form className="flex flex-wrap gap-3 items-center">
            <select
              name="jobId"
              defaultValue={jobId ?? ""}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">All jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>

            <select
              name="stage"
              defaultValue={stage ?? ""}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">All stages</option>
              {stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              Filter
            </button>
          </form>
        </section>

        {/* Table */}
        <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Candidate
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Job
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Stage
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Applied
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No applications yet for this filter.
                  </td>
                </tr>
              ) : (
                applications.map((application: any) => {
                  const appliedDate =
                    application.createdAt &&
                    application.createdAt.toLocaleDateString
                      ? application.createdAt.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "";

                  const name =
                    application.fullName ??
                    application.fullname ??
                    application.name ??
                    "Candidate";

                  return (
                    <tr
                      key={application.id}
                      className="border-b border-slate-800/70 hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{name}</span>
                          <span className="text-xs text-slate-400">
                            {application.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        {application.job?.title ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium">
                          {application.stage ?? "APPLIED"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {appliedDate || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/applications/${application.id}`}
                          className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                        >
                          View / Update
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
