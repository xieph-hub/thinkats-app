// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentTenantId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidates in pipeline | Resourcin ATS",
  description:
    "All applicants across mandates. Use this view to jump quickly into CVs and specific roles.",
};

type JobRow = {
  id: string;
  title: string;
  slug: string | null;
  tenant_id: string;
};

type ApplicationRow = {
  id: string;
  job_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  stage: string | null;
  status: string | null;
  cv_url: string | null;
  created_at: string;
};

type CandidateView = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  stage: string;
  status: string;
  appliedAt: string;
  jobTitle: string;
  jobSlug: string | null;
  cvUrl: string | null;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default async function AtsCandidatesPage() {
  const tenantId = await getCurrentTenantId();

  if (!tenantId) {
    // If something is wrong with tenant resolution, just render empty state
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-slate-600">
          You need to be signed into a tenant to view ATS candidates.
        </p>
      </main>
    );
  }

  const [{ data: jobsData, error: jobsError }, { data: appsData, error: appsError }] =
    await Promise.all([
      supabaseAdmin
        .from("jobs")
        .select("id, title, slug, tenant_id")
        .eq("tenant_id", tenantId),
      supabaseAdmin
        .from("job_applications")
        .select(
          "id, job_id, full_name, email, phone, location, stage, status, cv_url, created_at"
        )
        .order("created_at", { ascending: false }),
    ]);

  if (jobsError) {
    console.error("ATS candidates – error loading jobs:", jobsError);
  }
  if (appsError) {
    console.error("ATS candidates – error loading job_applications:", appsError);
  }

  const jobs = (jobsData ?? []) as JobRow[];
  const apps = (appsData ?? []) as ApplicationRow[];

  // Map jobs by id for quick lookup
  const jobsById = new Map<string, JobRow>();
  for (const job of jobs) {
    jobsById.set(job.id, job);
  }

  // Only keep applications whose job belongs to this tenant
  const candidates: CandidateView[] = apps
    .filter((app) => app.job_id && jobsById.has(app.job_id))
    .map((app) => {
      const job = jobsById.get(app.job_id!)!;
      return {
        id: app.id,
        fullName: app.full_name,
        email: app.email,
        phone: app.phone,
        location: app.location,
        stage: (app.stage || "APPLIED").toUpperCase(),
        status: app.status || "PENDING",
        appliedAt: formatDate(app.created_at),
        jobTitle: job.title,
        jobSlug: job.slug,
        cvUrl: app.cv_url,
      };
    });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Candidates in pipeline
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          All applicants across mandates. Use this view to jump quickly into CVs
          and specific roles.
        </p>
      </header>

      {candidates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          No candidates in the ATS yet. Once applications come in, they&apos;ll
          appear here.
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Candidate</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Stage</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Applied</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4 text-right">CV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((c) => (
                  <tr key={c.id} className="align-middle">
                    <td className="py-3 pr-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {c.fullName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {c.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {c.jobSlug ? (
                        <a
                          href={`/ats/jobs/${c.jobSlug}`}
                          className="text-sm text-[#172965] hover:underline"
                        >
                          {c.jobTitle}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-700">
                          {c.jobTitle}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-700">
                      {c.stage}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-600">
                      {c.appliedAt}
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700">
                      {c.location || "—"}
                    </td>
                    <td className="py-3 pr-4 text-right text-xs">
                      {c.cvUrl ? (
                        <a
                          href={c.cvUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#172965] hover:underline"
                        >
                          Open CV ↗
                        </a>
                      ) : (
                        <span className="text-slate-400">No CV</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
