// app/jobs/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import ApplyFormClient from "./ApplyFormClient";

const RESOURCIN_TENANT_ID = "54286a10-0503-409b-a9d4-a324e9283c1c";

type PageProps = {
  params: {
    slug: string;
  };
};

async function loadJobBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      slug,
      location,
      employment_type,
      seniority,
      function,
      tags,
      summary,
      description,
      created_at,
      is_published
    `
    )
    .eq("tenant_id", RESOURCIN_TENANT_ID)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) {
    console.error("Error loading job by slug", error);
    return null;
  }

  return data;
}

export default async function JobDetailPage({ params }: PageProps) {
  const job = await loadJobBySlug(params.slug);

  if (!job) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/jobs"
        className="text-xs font-medium text-[#172965] hover:underline"
      >
        ← Back to all roles
      </Link>

      <header className="mt-4 border-b border-slate-200 pb-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Resourcin · Open role
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          {job.title}
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
          {job.function && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.function}
            </span>
          )}
          {job.seniority && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.seniority}
            </span>
          )}
        </div>
      </header>

      <section className="mt-6 space-y-4 text-sm leading-relaxed text-slate-700">
        {job.summary && (
          <p className="font-medium text-slate-800">{job.summary}</p>
        )}
        {job.description && (
          <div className="prose prose-sm max-w-none text-slate-700">
            {/* If your descriptions are plain text, this is fine.
               If you later store Markdown/HTML, we can adjust how it's rendered. */}
            <p>{job.description}</p>
          </div>
        )}
        {job.tags && job.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {job.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1 text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Apply form – feeds into job_applications for this job */}
      <ApplyFormClient jobId={job.id} jobTitle={job.title} />
    </main>
  );
}
