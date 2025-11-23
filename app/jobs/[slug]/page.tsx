// app/jobs/[slug]/page.tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import ApplyForm from "./ApplyForm";

type JobDetail = {
  id: string;
  slug: string | null;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  description: string | null;
  tags: string[] | null;
  created_at: string | null;
};

type JobPageProps = {
  params: { slug: string };
};

async function fetchPublicJob(
  slugOrId: string
): Promise<JobDetail | null> {
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

  // By slug
  let { data, error } = await supabase
    .from("jobs")
    .select(selectCols)
    .eq("slug", slugOrId)
    .eq("status", "open")
    .eq("visibility", "public")
    .limit(1);

  if (error) console.error("Error loading job by slug:", error);

  if (data && data.length > 0) {
    return data[0] as JobDetail;
  }

  // Fallback by id
  const { data: byId, error: idError } = await supabase
    .from("jobs")
    .select(selectCols)
    .eq("id", slugOrId)
    .eq("status", "open")
    .eq("visibility", "public")
    .limit(1);

  if (idError) console.error("Error loading job by id:", idError);

  if (!byId || byId.length === 0) return null;

  return byId[0] as JobDetail;
}

export default async function JobDetailPage({ params }: JobPageProps) {
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
            ← Back to all jobs
          </Link>
        </div>
      </main>
    );
  }

  const slugOrId = job.slug || job.id;
  const createdLabel = job.created_at
    ? new Date(job.created_at).toLocaleDateString("en-US", {
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
          {job.employment_type && (
            <span className="rounded-full border border-slate-200 px-3 py-1">
              {job.employment_type}
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

      {/* Inline public apply form */}
      <ApplyForm jobSlug={slugOrId} jobTitle={job.title} />
    </main>
  );
}
