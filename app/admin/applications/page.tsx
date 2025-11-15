// app/admin/applications/page.tsx

import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getApplications() {
  const applications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      job: true,
      candidate: true,
    },
    take: 200, // safety cap so we don't load thousands at once
  });

  return applications;
}

export default async function AdminApplicationsPage() {
  const applications = await getApplications();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Applications
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Latest candidates across all roles in your ATS.
            </p>
          </div>

          <Link
            href="/admin/jobs"
            className="text-xs sm:text-sm text-amber-400 hover:text-amber-300 underline underline-offset-4"
          >
            ← Back to jobs
          </Link>
        </header>

        {/* Empty state */}
        {applications.length === 0 && (
          <div className="border border-dashed border-slate-700 rounded-2xl px-6 py-10 text-center">
            <p className="text-sm text-slate-300 font-medium mb-1">
              No applications yet.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Once you share a job link and candidates apply from the website,
              they will appear here with their contact details and role applied for.
            </p>
          </div>
        )}

        {/* Table */}
        {applications.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg shadow-black/30">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/80 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-400 text-xs uppercase tracking-wide">
                      Candidate
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400 text-xs uppercase tracking-wide">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400 text-xs uppercase tracking-wide">
                      Stage
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400 text-xs uppercase tracking-wide">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400 text-xs uppercase tracking-wide">
                      Applied
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-t border-slate-800/80 hover:bg-slate-900/60 transition-colors"
                    >
                      {/* Candidate */}
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium">
                          {app.candidate?.name || "—"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {app.candidate?.email || "No email"}
                        </div>
                        {app.candidate?.phone && (
                          <div className="text-xs text-slate-500">
                            {app.candidate.phone}
                          </div>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium">
                          {app.job?.title || "—"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {app.job?.location || "Location N/A"}
                        </div>
                      </td>

                      {/* Stage */}
                      <td className="px-4 py-3 align-top">
                        <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-200">
                          {app.stage}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3 align-top text-xs text-slate-400">
                        {app.source || "Website"}
                      </td>

                      {/* Applied date */}
                      <td className="px-4 py-3 align-top text-xs text-slate-400">
                        {app.createdAt
                          ? new Date(app.createdAt).toISOString().slice(0, 10)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
