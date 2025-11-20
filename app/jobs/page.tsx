// app/jobs/page.tsx

import Link from "next/link";
import supabaseAdmin from "@/lib/supabaseAdmin";

type PublicJob = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  department: string | null;
  employment_type: string | null;
  seniority: string | null;
  created_at: string;
};

export const revalidate = 0; // always fetch fresh

async function getResourcinTenantId(): Promise<string | null> {
  const tenantSlug = process.env.RESOURCIN_TENANT_SLUG;

  if (!tenantSlug) {
    console.error("RESOURCIN_TENANT_SLUG is not set in env");
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  if (error || !data) {
    console.error("Failed to load Resourcin tenant by slug", error);
    return null;
  }

  return data.id as string;
}

async function loadPublicJobs(): Promise<PublicJob[]> {
  const tenantId = await getResourcinTenantId();
  if (!tenantId) return [];

  const { data, error } = await supabaseAdmin
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
      created_at
    `
    )
    .eq("tenant_id", tenantId)
    .eq("status", "open")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error loading public jobs", error);
    return [];
  }

  return data as PublicJob[];
}

export default async function Page() {
  const jobs = await loadPublicJobs();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Resourcin · Open Roles
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Current Opportunities
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Roles we&apos;re actively hiring for. Click any job to read the full
          description and apply via a simple form.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {jobs.length === 0 ? (
          <p className="text-sm text-slate-500">
            No open roles right now. Check back soon or send us a speculative
            application.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <li key={job.id} className="py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link
                      href={`/jobs/${job.slug ?? job.id}`}
                      className="text-sm font-semibold text-[#172965] hover:underline"
                    >
                      {job.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                      {job.location && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
                          {job.location}
                        </span>
                      )}
                      {job.employment_type && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
                          {job.employment_type}
                        </span>
                      )}
                      {job.department && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
                          {job.department}
                        </span>
                      )}
                      {job.seniority && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
                          {job.seniority}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    Posted{" "}
                    {new Date(job.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
