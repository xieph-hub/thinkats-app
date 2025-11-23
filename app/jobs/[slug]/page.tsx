import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import JobApplyForm from "./JobApplyForm";

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
  status: string;
  visibility: string;
};

async function fetchPublicJob(slugOrId: string): Promise<JobDetail | null> {
  const supabase = await createSupabaseServerClient();

  const selectColumns = `
    id,
    slug,
    title,
    department,
    location,
    employment_type,
    seniority,
    description,
    tags,
    status,
    visibility
  `;

  // 1) Try by slug
  let { data, error } = await supabase
    .from("jobs")
    .select(selectColumns)
    .eq("slug", slugOrId)
    .eq("status", "open")
    .eq("visibility", "public")
    .limit(1);

  if (error) {
    console.error("Error loading job by slug:", error);
  }

  let row = data?.[0];

  // 2) Fallback: try by id
  if (!row) {
    const { data: byId, error: errorById } = await supabase
      .from("jobs")
      .select(selectColumns)
      .eq("id", slugOrId)
      .eq("status", "open")
      .eq("visibility", "public")
      .limit(1);

    if (errorById) {
      console.error("Error loading job by id:", errorById);
    }

    row = byId?.[0];
  }

  if (!row) return null;

  return {
    id: row.id as string,
    slug: (row.slug as string | null) ?? null,
    title: row.title as string,
    department: (row.department as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    employmentType: (row.employment_type as string | null) ?? null,
    seniority: (row.seniority as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    tags: (row.tags as string[] | null) ?? null,
    status: row.status as string,
    visibility: row.visibility as string,
  };
}

export default async function JobPage({
  params,
}: {
  params: { slug: string };
}) {
  const job = await fetchPublicJob(params.slug);

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
            ← Back to all jobs
          </Link>
        </div>
      </main>
    );
  }

  const slugOrId = job.slug ?? job.id;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-6">
        <Link
          href="/jobs"
          className="text-xs font-medium text-[#172965] hover:underline"
        >
          ← Back to all jobs
        </Link>
      </div>

      <header className="mb-8 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Open role
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">{job.title}</h1>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {job.location && <span>{job.location}</span>}
          {job.employmentType && (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              <span>{job.employmentType}</span>
            </>
          )}
          {job.seniority && (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              <span>{job.seniority}</span>
            </>
          )}
        </div>

        {job.tags && job.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <section className="mb-10 space-y-4 text-sm leading-relaxed text-slate-800">
        {job.description ? (
          <article className="prose prose-sm max-w-none">
            <p className="whitespace-pre-line">{job.description}</p>
          </article>
        ) : (
          <p className="text-sm text-slate-600">
            Full description coming soon. You can still apply if this role is a
            strong match.
          </p>
        )}
      </section>

      <section className="mt-10 border-t border-slate-200 pt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Apply for this role
        </h2>
        <p className="mb-4 text-xs text-slate-600">
          Share a few details and your CV. We review every application
          carefully.
        </p>

        <JobApplyForm slug={slugOrId} jobTitle={job.title} />
      </section>
    </main>
  );
}
