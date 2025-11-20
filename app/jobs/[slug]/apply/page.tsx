// app/jobs/[slug]/apply/page.tsx

import Link from "next/link";
import supabaseAdmin from "@/lib/supabaseAdmin";

type JobRecord = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  department: string | null;
  employment_type: string | null;
  seniority: string | null;
  description: string | null;
};

async function fetchJobBySlugOrId(slugOrId: string): Promise<JobRecord | null> {
  const supabase = supabaseAdmin as any;

  // 1) Try find by slug
  const { data: bySlug, error: slugError } = await supabase
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      location,
      department,
      employment_type,
      seniority,
      description
    `
    )
    .eq("slug", slugOrId)
    .limit(1);

  if (slugError) {
    console.error("Error fetching job by slug:", slugError);
  }

  let job = (bySlug && bySlug[0]) || null;

  // 2) If not found by slug, try by id
  if (!job) {
    const { data: byId, error: idError } = await supabase
      .from("jobs")
      .select(
        `
        id,
        slug,
        title,
        location,
        department,
        employment_type,
        seniority,
        description
      `
      )
      .eq("id", slugOrId)
      .limit(1);

    if (idError) {
      console.error("Error fetching job by id:", idError);
    }

    job = (byId && byId[0]) || null;
  }

  if (!job) return null;

  return {
    id: job.id,
    slug: job.slug ?? slugOrId,
    title: job.title,
    location: job.location ?? null,
    department: job.department ?? null,
    employment_type: job.employment_type ?? null,
    seniority: job.seniority ?? null,
    description: job.description ?? null,
  };
}

type PageProps = {
  params: {
    slug: string;
  };
};

export default async function JobApplyPage({ params }: PageProps) {
  const job = await fetchJobBySlugOrId(params.slug);

  if (!job) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Job not found</h1>
        <p className="text-sm text-slate-600">
          This job either doesn&apos;t exist, is not public, or has been removed.
        </p>
        <div>
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

  const applyAction = `/api/jobs/${job.slug ?? job.id}/apply`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Resourcin · Job application
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Apply for {job.title}
        </h1>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
          {job.location && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.location}
            </span>
          )}
          {job.employment_type && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.employment_type}
            </span>
          )}
          {job.department && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.department}
            </span>
          )}
          {job.seniority && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.seniority}
            </span>
          )}
        </div>
      </header>

      {/* Optional short description */}
      {job.description && (
        <section className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Role overview
          </h2>
          <p className="whitespace-pre-line">{job.description}</p>
        </section>
      )}

      {/* Application form – posts directly to API */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Share your details
        </h2>

        <form method="POST" action={applyAction} className="space-y-4">
          {/* Name / Email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Full name
              </label>
              <input
                required
                name="full_name"
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Email
              </label>
              <input
                required
                name="email"
                type="email"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/20"
              />
            </div>
          </div>

          {/* Phone / Location */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Phone (optional)
              </label>
              <input
                name="phone"
                type="tel"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Current location (city, country)
              </label>
              <input
                name="location"
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/20"
              />
            </div>
          </div>

          {/* Links */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                LinkedIn URL (optional)
              </label>
              <input
                name="linkedin_url"
                type="url"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Portfolio / GitHub / Website (optional)
              </label>
              <input
                name="portfolio_url"
                type="url"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/20"
              />
            </div>
          </div>

          {/* CV URL */}
          <div>
            <label className="block text-xs font-medium text-slate-700">
              CV link (Google Drive, Dropbox, etc.)
            </label>
            <input
              name="cv_url"
              type="url"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/20"
              placeholder="https://..."
            />
            <p className="mt-1 text-[11px] text-slate-500">
              You can also email your CV later using the confirmation email
              you&apos;ll receive.
            </p>
          </div>

          {/* Cover letter */}
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Short note / cover letter (optional)
            </label>
            <textarea
              name="cover_letter"
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-2 focus:ring-[#172965]/20"
              placeholder="Tell us briefly why this role is a fit for you..."
            />
          </div>

          {/* Hidden source + submit */}
          <input type="hidden" name="source" value="Website" />

          <div className="mt-4 flex items-center justify-between gap-3">
            <Link
              href="/jobs"
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              ← Back to all jobs
            </Link>

            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a]"
            >
              Submit application
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
