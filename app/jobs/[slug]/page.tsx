// app/jobs/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import JobApplyForm from "./JobApplyForm";

type PageProps = {
  params: { slug: string };
};

export default async function JobDetailPage({ params }: PageProps) {
  const slugOrId = params.slug;

  const { data: jobs, error } = await supabaseAdmin
    .from("jobs")
    .select(
      "id,title,location,employment_type,seniority,description,status,visibility"
    )
    .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .limit(1);

  if (error) {
    console.error("Error loading job detail:", error);
    throw new Error("Failed to load job.");
  }

  const job = jobs?.[0];

  if (!job || job.visibility !== "public") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
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
            ← Back to all jobs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-4">
        <Link
          href="/jobs"
          className="text-xs font-medium text-[#172965] hover:underline"
        >
          ← Back to all jobs
        </Link>
      </div>

      <header className="mb-6 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Open role
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {job.title}
        </h1>
        <p className="text-xs text-slate-500">
          {job.location || "Location flexible"}
          {job.employment_type ? ` • ${job.employment_type}` : ""}
          {job.seniority ? ` • ${job.seniority}` : ""}
        </p>
      </header>

      <section className="prose prose-sm max-w-none text-slate-800">
        {job.description ? (
          <p className="whitespace-pre-line">{job.description}</p>
        ) : (
          <p>More details will be shared during the interview process.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Apply for this role
        </h2>
        <JobApplyForm
          slug={slugOrId}
          jobId={job.id}
          jobTitle={job.title}
        />
      </section>
    </main>
  );
}
