// app/jobs/page.tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

type PublicJob = {
  id: string;
  slug: string | null;
  title: string;
  clientName: string | null;
  location: string | null;
  employmentType: string | null;
  remoteOption: string | null;
  summary: string | null;
  postedAt: string | null;
  status: string;
};

// Revalidate every 60 seconds (static-ish but kept fresh)
export const revalidate = 60;

export default async function JobsPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs") // ✅ canonical table
    .select(
      `
        id,
        slug,
        title,
        clientName,
        location,
        employmentType,
        remoteOption,
        summary,
        postedAt,
        status,
        isPublished
      `
    )
    .eq("isPublished", true)
    .eq("status", "open")
    .order("postedAt", { ascending: false });

  if (error) {
    console.error("Error loading public jobs from jobs table:", error);
  }

  const jobs: PublicJob[] =
    (data || []).map((row: any) => ({
      id: row.id,
      slug: row.slug ?? null,
      title: row.title,
      clientName: row.clientName ?? null,
      location: row.location ?? null,
      employmentType: row.employmentType ?? null,
      remoteOption: row.remoteOption ?? null,
      summary: row.summary ?? null,
      postedAt: row.postedAt ?? null,
      status: row.status || (row.isPublished ? "open" : "draft"),
    })) ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Resourcin · Opportunities
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">
          Open roles
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          These are the roles we&apos;re actively hiring for through Resourcin
          and ThinkATS. Click a job to see the full description and apply.
        </p>
      </header>

      {jobs.length === 0 && (
        <p className="text-sm text-slate-500">
          No open roles at the moment. Check back soon.
        </p>
      )}

      <div className="space-y-4">
        {jobs.map((job) => {
          const href = `/jobs/${job.slug || job.id}`;
          const postedLabel = job.postedAt
            ? new Date(job.postedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })
            : null;

          return (
            <Link
              key={job.id}
              href={href}
              className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#172965] hover:shadow-md"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {job.title}
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-600">
                    {job.clientName && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {job.clientName}
                      </span>
                    )}
                    {job.location && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {job.location}
                      </span>
                    )}
                    {job.employmentType && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {job.employmentType}
                      </span>
                    )}
                    {job.remoteOption && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {job.remoteOption}
                      </span>
                    )}
                  </div>
                  {job.summary && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                      {job.summary}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 text-xs text-slate-500">
                  {postedLabel && <span>Posted {postedLabel}</span>}
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    Open
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
