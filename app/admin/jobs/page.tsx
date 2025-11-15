// app/admin/jobs/page.tsx

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function toggleJobPublish(formData: FormData) {
  "use server";

  const jobId = formData.get("jobId");
  const current = formData.get("current");

  if (!jobId || typeof jobId !== "string") {
    return;
  }

  const isPublished =
    typeof current === "string" ? current === "true" : Boolean(current);

  await prisma.job.update({
    where: { id: jobId },
    data: { isPublished: !isPublished },
  });
}

export default async function AdminJobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { postedAt: "desc" },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#172965]">
              Resourcin · Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              Jobs
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-xl">
              Manage which roles are visible on the public /jobs page and see
              how many applications each role has.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/overview"
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
            >
              ← Back to overview
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#101c44]"
            >
              View public jobs
            </Link>
          </div>
        </header>

        {/* Jobs table */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {jobs.length === 0 ? (
            <p className="text-xs text-slate-500">
              No jobs found. Once you add jobs in your database, they&apos;ll
              appear here.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">
                      Role
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">
                      Applications
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">
                      Posted
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      {/* Role */}
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">
                            {job.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {job.department} · {job.location} · {job.type}
                          </span>
                          <span className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                            {job.excerpt}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2 align-top">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            job.isPublished
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-slate-50 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {job.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>

                      {/* Applications count */}
                      <td className="px-3 py-2 align-top text-slate-700">
                        {job._count.applications}
                      </td>

                      {/* Posted date */}
                      <td className="px-3 py-2 align-top text-slate-500">
                        {job.postedAt
                          ? new Date(job.postedAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2 align-top text-right">
                        <div className="flex flex-col items-end gap-1">
                          {job.isPublished && (
                            <Link
                              href={`/jobs/${job.slug}`}
                              className="text-[11px] font-medium text-[#172965] hover:underline"
                              target="_blank"
                            >
                              View live ↗
                            </Link>
                          )}

                          <form action={toggleJobPublish}>
                            <input type="hidden" name="jobId" value={job.id} />
                            <input
                              type="hidden"
                              name="current"
                              value={job.isPublished ? "true" : "false"}
                            />
                            <button
                              type="submit"
                              className="mt-1 inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
                            >
                              {job.isPublished ? "Set as draft" : "Publish"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
