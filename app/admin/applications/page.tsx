import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Optional: you can keep this if you want to always render fresh data
export const dynamic = "force-dynamic";

export default async function ApplicationsAdminPage() {
  const applications = await prisma.jobApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      job: true,
      candidate: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#306B34]">
              Internal
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Job applications
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              Lightweight admin view of all applications submitted via the
              Resourcin website. Latest first.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              Total applications:{" "}
              <span className="font-semibold text-slate-900">
                {applications.length}
              </span>
            </span>
          </div>
        </header>

        {/* Table / empty state */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          {applications.length === 0 ? (
            <p className="text-sm text-slate-500">
              No applications yet. Once candidates apply to live roles, they
              will show up here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Candidate
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Job
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Stage / Status
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Source
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Applied at
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => {
                    const appliedAt =
                      app.createdAt instanceof Date
                        ? app.createdAt.toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : String(app.createdAt);

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/60">
                        {/* Candidate */}
                        <td className="whitespace-nowrap px-3 py-2 align-top">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {app.fullName}
                            </span>
                            <span className="text-xs text-slate-500">
                              {app.email}
                            </span>
                            {app.phone && (
                              <span className="text-xs text-slate-500">
                                {app.phone}
                              </span>
                            )}
                            {app.location && (
                              <span className="text-xs text-slate-500">
                                {app.location}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Job */}
                        <td className="whitespace-nowrap px-3 py-2 align-top">
                          {app.job ? (
                            <div className="flex flex-col">
                              <Link
                                href={`/jobs/${app.job.slug}`}
                                className="text-sm font-medium text-[#172965] hover:underline"
                              >
                                {app.job.title}
                              </Link>
                              <span className="text-xs text-slate-500">
                                {app.job.location} • {app.job.seniority}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Job no longer available
                            </span>
                          )}
                        </td>

                        {/* Stage / Status */}
                        <td className="whitespace-nowrap px-3 py-2 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-slate-700">
                              {app.stage}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-slate-500">
                              {app.status}
                            </span>
                          </div>
                        </td>

                        {/* Source */}
                        <td className="whitespace-nowrap px-3 py-2 align-top">
                          <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-slate-600">
                            {app.source ?? "Website"}
                          </span>
                        </td>

                        {/* Applied at */}
                        <td className="whitespace-nowrap px-3 py-2 align-top text-xs text-slate-500">
                          {appliedAt}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Back link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900"
          >
            ← Back to site
          </Link>
        </div>
      </div>
    </main>
  );
}
