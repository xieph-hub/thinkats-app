// app/jobs/[slug]/page.tsx
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import JobApplicationForm from "./JobApplicationForm";

type PageProps = {
  params: {
    slug: string;
  };
};

export default async function JobDetailPage({
  params,
}: PageProps) {
  const supabase = await createSupabaseServerClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !job) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          Job not found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This job may have been filled or removed.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Job header */}
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Resourcin · Careers
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">
          {job.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          {job.location && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs">
              {job.location}
            </span>
          )}
          {job.employment_type && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs">
              {job.employment_type}
            </span>
          )}
          {job.department && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs">
              {job.department}
            </span>
          )}
        </div>
      </header>

      <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        {/* Left: description */}
        <section className="prose prose-sm max-w-none text-slate-800">
          {job.description ? (
            <article className="whitespace-pre-wrap">
              {job.description}
            </article>
          ) : (
            <p className="text-sm text-slate-600">
              A detailed job description will appear here.
            </p>
          )}
        </section>

        {/* Right: application form */}
        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Apply for this role
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Share a few details and a link to your CV /
            LinkedIn. We&apos;ll review and get back to you.
          </p>

          <div className="mt-4">
            <JobApplicationForm
              jobId={job.id as string}
              jobTitle={job.title as string}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
