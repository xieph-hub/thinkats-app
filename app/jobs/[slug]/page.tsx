// app/jobs/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import PublicJobApplyForm from "../PublicJobApplyForm";

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
  status: string | null;
  visibility: string | null;
};

type JobPageProps = {
  params: { slug: string };
};

async function fetchPublicJob(slugOrId: string): Promise<JobDetail | null> {
  const supabase = createSupabaseAdminClient();

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

  // Try by slug first
  let { data, error } = await supabase
    .from("jobs")
    .select(selectCols)
    .eq("slug", slugOrId)
    .eq("status", "open")
    .eq("visibility", "public")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error loading public job by slug:", error);
  }

  if (!data) {
    // Fallback: try by id
    const byId = await supabase
      .from("jobs")
      .select(selectCols)
      .eq("id", slugOrId)
      .eq("status", "open")
      .eq("visibility", "public")
      .limit(1)
      .maybeSingle();

    if (byId.error) {
      console.error("Error loading public job by id:", byId.error);
    }

    if (!byId.data) return null;
    data = byId.data;
  }

  return data as JobDetail;
}

export default async function PublicJobPage({ params }: JobPageProps) {
  const job = await fetchPublicJob(params.slug);

  if (!job) {
    notFound();
  }

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

      {/* NEW: inline public apply form */}
      <PublicJobApplyForm jobId={job.id} jobTitle={job.title} />
    </main>
  );
}
