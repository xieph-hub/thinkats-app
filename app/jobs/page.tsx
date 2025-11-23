// app/jobs/page.tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export const revalidate = 60;

export default async function JobsIndexPage() {
  const supabase = await createSupabaseServerClient();

  const { data: jobs, error } = await supabase
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
      created_at,
      status,
      visibility
    `
    )
    .eq("status", "open")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading jobs index:", error);
  }

  const list = jobs ?? [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Open roles
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Roles we&apos;re actively hiring for through Resourcin.
        </p>
      </header>

      {list.length === 0 ? (
        <p className="text-sm text-slate-500">No open roles right now.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((job: any) => {
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
                <Link href={`/jobs/${slugOrId}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        {job.title}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {job.location || "Location flexible"}
                        {job.department ? ` • ${job.department}` : ""}
                        {job.seniority ? ` • ${job.seniority}` : ""}
                      </p>
                    </div>
                    {createdLabel && (
                      <p className="text-[11px] text-slate-400">
                        Posted {createdLabel}
                      </p>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-medium text-[#172965]">
                    View role →
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
