// app/jobs/page.tsx

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export const revalidate = 30; // refresh every 30s

type PublicJob = {
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

async function loadPublicJobs(): Promise<PublicJob[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
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
      `
    )
    .eq("status", "open")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error loading public jobs", error);
    return [];
  }

  return data.map((row: any) => ({
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
  }));
}

export default async function JobsPage() {
  const jobs = await loadPublicJobs();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Open roles
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Jobs through Resourcin
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          These roles are managed with ThinkATS. Apply once and we can reuse
          your profile for similar mandates.
        </p>
      </header>

      {jobs.length === 0 ? (
        <p className="text-sm text-slate-500">
          No open roles right now. Please check back soon.
        </p>
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => {
            const slugOrId = job.slug || job.id;

            const createdLabel = job.createdAt
              ? new Date(job.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : null;

            return (
              <li key={job.id}>
                <Link
                  href={`/jobs/${slugOrId}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#172965] hover:shadow-md"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <h2 className="text-base font-semibold text-slate-900">
                        {job.title}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {job.location || "Location flexible"}
                        {job.department ? ` • ${job.department}` : ""}
                        {job.seniority ? ` • ${job.seniority}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
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
                  </div>

                  {job.tags && job.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-50 px-2.5 py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
