// app/admin/candidates/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CandidatesPage() {
  // We cast to any to avoid wrestling with Prisma's TS types here
  const candidates = (await prisma.candidate.findMany({
    include: {
      job: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      // if createdAt exists, great; Prisma will handle it
      // if not, this will be ignored at runtime since we are in codegen
      id: "desc",
    } as any,
  })) as any[];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Candidates</h1>
            <p className="text-sm text-slate-400">
              People who have entered your Resourcin funnel.
            </p>
          </div>

          <div className="text-xs text-slate-500">
            Total candidates:{" "}
            <span className="font-semibold text-slate-100">
              {candidates.length}
            </span>
          </div>
        </header>

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
                  Source
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Resume
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No candidates yet. Submit an application from the site to
                    see it appear here.
                  </td>
                </tr>
              ) : (
                candidates.map((candidate) => {
                  const name =
                    candidate.fullname ??
                    candidate.name ??
                    "Unnamed candidate";

                  return (
                    <tr
                      key={candidate.id}
                      className="border-b border-slate-800/70 hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{name}</span>
                          <span className="text-xs text-slate-400">
                            {candidate.email}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-200">
                        {candidate.job?.title ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {candidate.source ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {candidate.resumeUrl ? (
                          <a
                            href={candidate.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-emerald-400 hover:text-emerald-300"
                          >
                            View resume
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/applications?stage=&jobId=`}
                          className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                        >
                          View applications
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
