// app/jobs/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentTenantId } from "@/lib/tenant";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Jobs | Resourcin",
  description:
    "Open roles managed by Resourcin across Africa and beyond. Browse and apply without creating an account.",
};

type JobListItem = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  created_at: string;
  tags: string[] | null;
};

async function getPublicJobs(): Promise<JobListItem[]> {
  const tenantId = await getCurrentTenantId();

  if (!tenantId) {
    console.warn("getPublicJobs: no current tenant id");
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      location,
      employment_type,
      seniority,
      created_at,
      tags
    `
    )
    .eq("tenant_id", tenantId)
    .eq("status", "open")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("getPublicJobs: error loading jobs", {
      tenantId,
      error,
    });
    return [];
  }

  return data as JobListItem[];
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default async function JobsPage() {
  const jobs = await getPublicJobs();

  return (
    <main>
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          For candidates
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Open roles
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Browse live mandates from Resourcin. You can apply without creating
          an account; we&apos;ll only reach out when there&apos;s a strong
          match.
        </p>
      </header>

      {jobs.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No public roles are currently open. Check back soon or{" "}
          <Link
            href="/talent-network"
            className="font-medium text-[#172965] hover:underline"
          >
            join our talent network
          </Link>
          .
        </p>
      ) : (
        <section className="mt-6 space-y-3">
          {jobs.map((job) => {
            const slugOrId = job.slug ?? job.id;

            return (
              <Link
                key={job.id}
                href={`/jobs/${slugOrId}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#172965] hover:bg-slate-50/60"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {job.title}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <span>{job.location || "Location flexible"}</span>
                      {job.employment_type && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span>{job.employment_type}</span>
                        </>
                      )}
                      {job.seniority && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="uppercase tracking-wide">
                            {job.seniority}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Posted {formatDate(job.created_at)}
                    </p>
                    {job.tags && job.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {job.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end sm:self-start">
                    <span className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                      View role
                      <span className="ml-1 text-xs" aria-hidden="true">
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}
