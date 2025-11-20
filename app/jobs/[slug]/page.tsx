// app/jobs/[slug]/page.tsx

import Link from "next/link";
import supabaseAdmin from "@/lib/supabaseAdmin";
import ApplyForm from "./ApplyForm";

type PageProps = {
  params: {
    slug: string;
  };
};

type JobDetail = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  department: string | null;
  employment_type: string | null;
  seniority: string | null;
  description: string | null;
  created_at: string;
};

export const revalidate = 0;

async function loadJobBySlug(slug: string): Promise<JobDetail | null> {
  const { data, error } = await supabaseAdmin
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
      description,
      created_at
    `
    )
    .eq("slug", slug)
    .eq("status", "open")
    .eq("visibility", "public")
    .single();

  if (error || !data) {
    console.error("Failed to load public job by slug", error);
    return null;
  }

  return data as JobDetail;
}

export default async function Page({ params }: PageProps) {
  const job = await loadJobBySlug(params.slug);

  if (!job) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Resourcin · Jobs
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Job not found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This job may have been closed or the link is invalid.
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Resourcin · Job
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          {job.title}
        </h1>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
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

        <p className="mt-3 text-[13px] text-slate-500">
          Posted{" "}
          {new Date(job.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
          })}
        </p>
      </header>

      <section className="prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-900 prose-a:text-[#172965]">
        {job.description ? (
          <article className="whitespace-pre-line text-sm leading-relaxed">
            {job.description}
          </article>
        ) : (
          <p className="text-sm text-slate-600">
            Full description coming soon. You can still apply if this role is
            relevant to you.
          </p>
        )}
      </section>

      <ApplyForm jobSlug={params.slug} jobTitle={job.title} />

      <div className="mt-6">
        <Link
          href="/jobs"
          className="text-xs font-medium text-[#172965] hover:underline"
        >
          ← Back to all jobs
        </Link>
      </div>
    </main>
  );
}
