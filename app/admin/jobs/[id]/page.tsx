// app/admin/jobs/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { updateJob } from "../actions";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type EditJobPageProps = {
  params: {
    id: string;
  };
};

export default async function EditJobPage({ params }: EditJobPageProps) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
  });

  if (!job) {
    notFound();
  }

  const posted =
    job.postedAt instanceof Date
      ? job.postedAt.toLocaleDateString("en-NG", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#FFB703] font-semibold">
            Admin · Jobs
          </p>
          <h1 className="text-2xl font-semibold">Edit role</h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            You&apos;re editing{" "}
            <span className="font-semibold text-slate-50">
              {job.title}
            </span>
            . Changes update the public job page and apply flow.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1">
              <span className="mr-1 text-slate-500">Status:</span>
              <span
                className={`inline-flex items-center gap-1 ${
                  job.isPublished ? "text-emerald-300" : "text-slate-300"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {job.isPublished ? "Published" : "Hidden"}
              </span>
            </span>

            {posted && (
              <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1">
                <span className="mr-1 text-slate-500">Posted:</span>
                <span>{posted}</span>
              </span>
            )}

            <Link
              href={`/jobs/${job.slug}`}
              className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-100 hover:border-[#FFB703] hover:text-[#FFB703] transition"
            >
              View public page →
            </Link>

            <Link
              href="/admin/jobs"
              className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-200 hover:border-slate-200 hover:text-slate-50 transition"
            >
              ← Back to jobs admin
            </Link>
          </div>
        </header>

        {/* Edit form */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <form action={updateJob} className="space-y-4">
            <input type="hidden" name="id" value={job.id} />

            <div className="grid gap-4 md:grid-cols-2">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Job title *
                </label>
                <input
                  name="title"
                  required
                  defaultValue={job.title}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Slug
                </label>
                <input
                  name="slug"
                  defaultValue={job.slug}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Changing this updates the URL. We&apos;ll avoid duplicates
                  automatically.
                </p>
              </div>

              {/* Department */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Department / Team
                </label>
                <input
                  name="department"
                  defaultValue={job.department || ""}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Location
                </label>
                <input
                  name="location"
                  defaultValue={job.location || ""}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Role type
                </label>
                <input
                  name="type"
                  defaultValue={job.type || ""}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
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
                defaultValue={job.excerpt || ""}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703] resize-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Full job description
              </label>
              <textarea
                name="description"
                rows={10}
                defaultValue={job.description || ""}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                Saving updates the job immediately for candidates.
              </p>
              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-[#FFB703] px-4 py-2 text-[11px] font-semibold text-slate-950 hover:bg-[#ffca3a] transition"
              >
                Save changes
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
