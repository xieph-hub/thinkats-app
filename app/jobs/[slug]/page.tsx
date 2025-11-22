// app/jobs/[slug]/page.tsx

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import ApplyForm from "./ApplyForm";

export const revalidate = 60;

type JobDetail = {
  id: string;
  slug: string | null;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  seniority: string | null;
  description: string | null;
  tags: string[] | null;
  createdAt: string | null;
};

type JobPageProps = {
  params: { slug: string };
};

/**
 * Fetch an open, public job either by slug or by id (uuid),
 * using Supabase directly against the `jobs` table.
 */
async function fetchPublicJob(slugOrId: string): Promise<JobDetail | null> {
  const supabase = await createSupabaseServerClient();

  const selectCols = `
    id,
    slug,
    title,
    department,
    location,
    employment_type,
    seniority,
    description,
    tags,
    created_at,
    status,
    visibility
  `;

  // 1) Try match by slug
  let { data, error } = await supabase
    .from("jobs")
    .select(selectCols)
    .eq("slug", slugOrId)
    .eq("status", "open")
    .eq("visibility", "public")
    .limit(1);

  if (error) {
    console.error("Error loading public job by slug", error);
  }

  if (data && data.length > 0) {
    const row: any = data[0];
    return {
      id: row.id,
      slug: row.slug ?? null,
      title: row.title,
      department: row.department ?? null,
      location: row.location ?? null,
      employmentType: row.employment_type ?? null,
      seniority: row.seniority ?? null,
      description: row.description ?? null,
      tags: row.tags ?? null,
      createdAt: row.created_at ?? null,
    };
  }

  // 2) If not found, try match by id (UUID path like /jobs/<id>)
  const { data: dataById, error: errorById } = await supabase
    .from("jobs")
    .select(selectCols)
    .eq("id", slugOrId)
    .eq("status", "open")
    .eq("visibility", "public")
    .limit(1);

  if (errorById) {
    console.error("Error loading public job by id", errorById);
  }

  if (!dataById || dataById.length === 0) {
    return null;
  }

  const row: any = dataById[0];

  return {
    id: row.id,
    slug: row.slug ?? null,
    title: row.title,
    department: row.department ?? null,
    location: row.location ?? null,
    employmentType: row.employment_type ?? null,
    seniority: row.seniority ?? null,
    description: row.description ?? null,
    tags: row.tags ?? null,
    createdAt: row.created_at ?? null,
  };
}

export default async function PublicJobPage({ params }: JobPageProps) {
  const job = await fetchPublicJob(params.slug);

  if (!job) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          Role not found
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

  const createdLabel = job.createdAt
    ? new Date(job.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6">
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
          {job.department ? ` • ${job.department}` : ""}
          {job.seniority ? ` • ${job.seniority}` : ""}
        </p>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
          {job.employmentType && (
            <span className="rounded-full border border-slate-200 px-3 py-1">
              {job.employmentType}
            </span>
          )}
          {createdLabel && (
            <span className="rounded-full border border-slate-200 px-3 py-1">
              Posted {createdLabel}
            </span>
          )}
        </div>
      </header>

      <section className="prose prose-sm max-w-none text-slate-800">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {job.description || "No description provided yet."}
        </div>
      </section>

      {job.tags && job.tags.length > 0 && (
        <section className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
          {job.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-50 px-2.5 py-1"
            >
              {tag}
            </span>
          ))}
        </section>
      )}

      {/* Inline apply form that talks to /api/jobs/[slug]/apply via JSON */}
      <section className="mt-8">
        <ApplyForm jobSlug={slugOrId} jobTitle={job.title} />
      </section>
    </main>
  );
}
