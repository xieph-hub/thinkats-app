// app/admin/jobs/page.tsx
import { prisma } from "@/lib/prisma";
import { createJob } from "./actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: {
      postedAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#FFB703] font-semibold">
            Admin · Jobs
          </p>
          <h1 className="text-2xl font-semibold">Job mandates</h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Create and manage roles that appear on{" "}
            <Link
              href="/jobs"
              className="underline text-slate-100 hover:text-white"
            >
              /jobs
            </Link>
            . Each role gets its own detail page and apply flow.
          </p>
        </header>

        {/* Create job form */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-sm font-semibold mb-1">Create new job</h2>
          <p className="text-xs text-slate-400 mb-4">
            Only title and description are truly essential. Slug is optional —
            we&apos;ll generate one if you leave it blank.
          </p>

          <form action={createJob} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Job title *
                </label>
                <input
                  name="title"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
                  placeholder="Senior Product Manager (Fintech)"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Slug (optional)
                </label>
                <input
                  name="slug"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
                  placeholder="senior-product-manager-fintech"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Defaults to a slugified version of the title.
                </p>
              </div>

              {/* Department */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Department / Team
                </label>
                <input
                  name="department"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
                  placeholder="Product, Engineering, Commercial…"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Location
                </label>
                <input
                  name="location"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
                  placeholder="Lagos, Remote, Hybrid…"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Role type
                </label>
                <input
                  name="type"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
                  placeholder="Full-time, Contract, Interim…"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Short summary (excerpt)
              </label>
              <textarea
                name="excerpt"
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703] resize-none"
                placeholder="One or two lines you want to show in the list view."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Full job description
              </label>
              <textarea
                name="description"
                rows={8}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
                placeholder="Paste the full JD here. You can use basic HTML or just plain text."
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Rich formatting: you can paste HTML from your editor, or just
                keep it as raw paragraphs and bullet points.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                Once created, the role appears on{" "}
                <span className="text-slate-100">/jobs</span> and gets an apply
                form automatically.
              </p>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-[#FFB703] px-4 py-2 text-[11px] font-semibold text-slate-950 hover:bg-[#ffca3a] transition"
              >
                Save job
              </button>
            </div>
          </form>
        </section>

        {/* Existing jobs */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Existing jobs</h2>
            <span className="text-[11px] text-slate-400">
              {jobs.length} role{jobs.length === 1 ? "" : "s"}
            </span>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-8 text-center text-sm text-slate-400">
              No jobs yet. Create your first mandate above.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-900/70">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-400">
                      Title
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-400">
                      Location
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-400">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-400">
                      Posted
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-slate-400">
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const posted =
                      job.postedAt instanceof Date
                        ? job.postedAt.toLocaleDateString("en-NG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "";

                    return (
                      <tr
                        key={job.id}
                        className="border-t border-slate-800/70 hover:bg-slate-900/70"
                      >
                        <td className="px-4 py-2 align-top">
                          <div className="font-medium text-slate-50">
                            {job.title}
                          </div>
                          {job.department && (
                            <div className="text-[10px] text-slate-400">
                              {job.department}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500">
                            {job.slug}
                          </div>
                        </td>
                        <td className="px-4 py-2 align-top text-slate-300">
                          {job.location || "—"}
                        </td>
                        <td className="px-4 py-2 align-top text-slate-300">
                          {job.type || "—"}
                        </td>
                        <td className="px-4 py-2 align-top text-slate-300">
                          {posted || "—"}
                        </td>
                        <td className="px-4 py-2 align-top text-right">
                          <Link
                            href={`/jobs/${job.slug}`}
                            className="text-[11px] text-[#FFB703] hover:text-[#ffca3a] underline"
                          >
                            View page →
                          </Link>
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
    </main>
  );
}
