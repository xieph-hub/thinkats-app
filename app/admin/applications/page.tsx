// app/admin/applications/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const runtime = "nodejs";

export default async function ApplicationsPage() {
  const applications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      candidate: {
        select: {
          id: true,
          fullname: true,
          email: true,
          phone: true,
          location: true,
          resumeUrl: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-semibold text-[#172965]">
          Applications
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Central view of all candidates who have applied through the website.
        </p>
      </header>

      <div className="mb-4 text-xs text-slate-500">
        {applications.length} application
        {applications.length === 1 ? "" : "s"}
      </div>

      {applications.length === 0 ? (
        <p className="text-sm text-slate-500">
          No applications yet. Share a job link and ask someone to apply.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">
                        {app.candidate?.fullname || "Unknown candidate"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {app.candidate?.email || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {app.job?.title || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-flex rounded-full bg-[#172965]/8 px-2.5 py-1 text-[11px] font-medium text-[#172965]">
                      {app.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {app.createdAt
                      ? new Date(app.createdAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="text-[#172965] underline underline-offset-2 hover:text-[#101c44]"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
