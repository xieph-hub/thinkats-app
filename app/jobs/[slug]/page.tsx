// app/jobs/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import JobApplyForm from "./apply/JobApplyForm";

type PageProps = {
  params: { slug: string };
};

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

async function fetchPublicJob(slugOrId: string): Promise<JobRecord | null> {
  const supabase = await createSupabaseServerClient();

  const selectCols = `
    id,
    slug,
    title,
    location,
    department,
    employment_type,
    seniority,
    description,
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
    console.error("Error loading job by slug", error);
  }

  if (data && data.length > 0) {
    const row: any = data[0];
    return {
      id: row.id,
      slug: row.slug ?? null,
      title: row.title,
      location: row.location ?? null,
      department: row.department ?? null,
      employment_type: row.employment_type ?? null,
      seniority: row.seniority ?? null,
      description: row.description ?? null,
    };
  }

  // 2) Try by id
  const { data: byId, error: byIdError } = await supabase
    .from("jobs")
    .select(selectCols)
    .eq("id", slugOrId)
    .eq("status", "open")
    .eq("visibility", "public")
    .limit(1);

  if (byIdError) {
    console.error("Error loading job by id", byIdError);
  }

  if (!byId || byId.length === 0) {
    return null;
  }

  const row: any = byId[0];
  return {
    id: row.id,
    slug: row.slug ?? null,
    title: row.title,
    location: row.location ?? null,
    department: row.department ?? null,
    employment_type: row.employment_type ?? null,
    seniority: row.seniority ?? null,
    description: row.description ?? null,
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const slugOrId = params.slug;
  const job = await fetchPublicJob(slugOrId);

  if (!job) {
    notFound();
  }

  const applySlug = slugOrId;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <Link
          href="/jobs"
          className="text-xs font-medium text-[#172965] hover:underline"
        >
          ← Back to all jobs
        </Link>
      </div>

      {/* Header */}
      <header className="mb-6 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Open role
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {job.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span>{job.location || "Location flexible"}</span>
          {job.employment_type && (
            <>
              <span>•</span>
              <span>{job.employment_type}</span>
            </>
          )}
          {job.seniority && (
            <>
              <span>•</span>
              <span>{job.seniority}</span>
            </>
          )}
          {job.department && (
            <>
              <span>•</span>
              <span>{job.department}</span>
            </>
          )}
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        {/* Left: Job description */}
        <section className="space-y-4 text-sm leading-relaxed text-slate-800">
          {job.description ? (
            <article className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-800 prose-ul:list-disc prose-ul:pl-4">
              <p className="whitespace-pre-line">{job.description}</p>
            </article>
          ) : (
            <p className="text-sm text-slate-500">
              No detailed description has been added for this role yet.
            </p>
          )}
        </section>

        {/* Right: Apply form */}
        <aside>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Apply for this role
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Share a few details and upload your CV. We&apos;ll review and
              reach out if there&apos;s a strong match.
            </p>

            <div className="mt-4">
              <JobApplyForm slug={applySlug} jobTitle={job.title} />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
