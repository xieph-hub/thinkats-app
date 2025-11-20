// app/jobs/[slug]/apply/page.tsx

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

type JobDetail = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
};

type ApplyPageProps = {
  params: { slug: string };
};

async function fetchPublicJobForApply(
  slugOrId: string
): Promise<JobDetail | null> {
  const supabase = await createSupabaseServerClient();

  const selectCols = `
    id,
    slug,
    title,
    location,
    status,
    visibility
  `;

  // 1) Try by slug
  let { data, error } = await supabase
    .from("jobs")
    .select(selectCols)
    .eq("slug", slugOrId)
    .eq("status", "open")
    .eq("visibility", "public")
    .limit(1);

  if (error) {
    console.error("Error loading job for apply by slug", error);
  }

  if (data && data.length > 0) {
    const row: any = data[0];
    return {
      id: row.id,
      slug: row.slug ?? null,
      title: row.title,
      location: row.location ?? null,
    };
  }

  // 2) Try by id
  const { data: dataById, error: errorById } = await supabase
    .from("jobs")
    .select(selectCols)
    .eq("id", slugOrId)
    .eq("status", "open")
    .eq("visibility", "public")
    .limit(1);

  if (errorById) {
    console.error("Error loading job for apply by id", errorById);
  }

  if (!dataById || dataById.length === 0) {
    return null;
  }

  const row: any = dataById[0];

  return {
    id: row.id,
    slug: row.slug ?? null,
    title: row.title,
    location: row.location ?? null,
  };
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const job = await fetchPublicJobForApply(params.slug);

  if (!job) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          Role not available
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This job may have been closed or is no longer visible.
        </p>
        <div className="mt-4">
          <Link
            href="/jobs"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to all jobs
          </Link>
        </div>
      </main>
    );
  }

  const slugOrId = job.slug || job.id;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
        <Link
          href={`/jobs/${slugOrId}`}
          className="text-xs font-medium text-[#172965] hover:underline"
        >
          ← Back to job
        </Link>
      </div>

      <header className="mb-6 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Apply
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {job.title}
        </h1>
        <p className="text-xs text-slate-500">
          {job.location || "Location flexible"}
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          method="POST"
          action={`/api/jobs/${slugOrId}/apply`}
          encType="multipart/form-data"
          className="space-y-4"
        >
          {/* Hidden job id so the API can trust the job */}
          <input type="hidden" name="job_id" value={job.id} />
          <input type="hidden" name="source" value="careers_site" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">
                Full name<span className="text-red-500">*</span>
              </label>
              <input
                name="full_name"
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Email<span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Phone
              </label>
              <input
                name="phone"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Location (City, Country)
              </label>
              <input
                name="location"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                LinkedIn URL
              </label>
              <input
                name="linkedin_url"
                type="url"
                placeholder="https://www.linkedin.com/in/..."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Portfolio / Website
              </label>
              <input
                name="portfolio_url"
                type="url"
                placeholder="https://"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">
                CV / Resume (PDF, max ~10MB)
              </label>
              <input
                name="cv"
                type="file"
                accept=".pdf,.doc,.docx"
                className="mt-1 block w-full text-xs text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-[#172965] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#111b4a]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">
                Short note / cover letter
              </label>
              <textarea
                name="cover_letter"
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                placeholder="Give quick context on your experience and interest in this role."
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a]"
            >
              Submit application
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
