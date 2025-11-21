// app/jobs/page.tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export const revalidate = 30;

type JobRow = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  department: string | null;
  employment_type: string | null;
  seniority: string | null;
  tags: string[] | null;
  created_at: string | null;
};

async function fetchPublicJobs(): Promise<JobRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
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
        tags,
        created_at,
        status,
        visibility
      `
    )
    .eq("status", "open")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading public jobs list", error);
    return [];
  }

  return data ?? [];
}

export default async function JobsIndexPage() {
  const jobs = await fetchPublicJobs();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Job openings
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Roles we&apos;re currently working on. You don&apos;t need an
          account to view or apply.
        </p>
      </header>

      {jobs.length === 0 && (
        <p className="text-sm text-slate-500">
          No open roles are visible right now.
        </p>
      )}

      <ul className="space-y-4">
        {jobs.map((job) => {
          const slugOrId = job.slug || job.id;
          const createdLabel = job.created_at
            ? new Date(job.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : null;

          return (
            <li
              key={job.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#172965] hover:shadow-md"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    <Link href={`/jobs/${slugOrId}`}>{job.title}</Link>
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {job.location || "Location flexible"}
                    {job.department ? ` • ${job.department}` : ""}
                    {job.seniority ? ` • ${job.seniority}` : ""}
                    {createdLabel ? ` • Posted ${createdLabel}` : ""}
                  </p>
                  {job.tags && job.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-50 px-2.5 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end">
                  <Link
                    href={`/jobs/${slugOrId}`}
                    className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#111b4a]"
                  >
                    View role
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
