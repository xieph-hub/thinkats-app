// app/jobs/[slug]/apply/page.tsx

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import JobApplyForm from "./JobApplyForm";

type JobDetail = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
};

type ApplyPageProps = {
  params: { slug: string };
};

async function fetchPublicJobForApply(slugOrId: string): Promise<JobDetail | null> {
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
        <h1 className="text-2xl font-semibold text-slate-900">{job.title}</h1>
        <p className="text-xs text-slate-500">
          {job.location || "Location flexible"}
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <JobApplyForm slug={slugOrId} jobTitle={job.title} />
      </section>
    </main>
  );
}
