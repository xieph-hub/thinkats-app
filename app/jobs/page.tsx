// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Jobs | Resourcin",
  description:
    "Open roles managed by Resourcin across Africa and beyond. Browse and apply without creating an account.",
};

type ClientCompanyRow = {
  name: string | null;
  logo_url: string | null;
  slug: string | null;
};

type PublicJob = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  status: string | null;
  visibility: string | null;
  created_at: string;
  tags: string[] | null;
  work_mode: string | null; // remote / hybrid / onsite / flexible
  client_company: ClientCompanyRow[] | null; // Supabase nested select returns an array
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

function formatWorkMode(workMode: string | null) {
  if (!workMode) return null;
  const v = workMode.toLowerCase();
  if (v === "remote") return "Remote";
  if (v === "hybrid") return "Hybrid";
  if (v === "onsite" || v === "on-site") return "On-site";
  if (v === "flexible") return "Flexible";
  return workMode;
}

function formatEmploymentType(value: string | null) {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === "full-time" || lower === "full_time") return "Full-time";
  if (lower === "part-time" || lower === "part_time") return "Part-time";
  if (lower === "contract") return "Contract";
  if (lower === "internship") return "Internship";
  return value;
}

export default async function JobsPage() {
  // 1) Load jobs WITHOUT strict SQL filters so we don't miss rows due to case
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
      status,
      visibility,
      created_at,
      tags,
      work_mode,
      client_company (
        name,
        logo_url,
        slug
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading public jobs:", error);
  }

  const rawJobs = (data ?? []) as any[];

  // 2) Case-insensitive filter: treat null/empty as "include"
  const jobs = rawJobs
    .filter((job) => {
      const status =
        typeof job.status === "string" ? job.status.toLowerCase() : "";
      const visibility =
        typeof job.visibility === "string" ? job.visibility.toLowerCase() : "";

      const isOpen = !status || status === "open";
      const isPublic = !visibility || visibility === "public";

      return isOpen && isPublic;
    })
    .map((job) => job as PublicJob);

  const count = jobs.length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          For candidates
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Open roles
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Browse live mandates from Resourcin and our clients. You can apply
          without creating an account; we&apos;ll only reach out when
          there&apos;s a strong match.
        </p>
        {count > 0 && (
          <p className="mt-1 text-[11px] text-slate-500">
            Showing {count} open role{count === 1 ? "" : "s"}.
          </p>
        )}
      </header>

      {count === 0 ? (
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
        <section className="mt-6 space-y-4">
          {jobs.map((job) => {
            const slugOrId = job.slug || job.id;
            if (!slugOrId) {
              console.warn("Job missing slug and id", job);
              return null;
            }

            const workModeLabel = formatWorkMode(job.work_mode);
            const employmentTypeLabel = formatEmploymentType(
              job.employment_type
            );
            const company = job.client_company?.[0] ?? null;

            return (
              <article
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#172965]/70 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    {/* Company + title */}
                    <div>
                      {company?.name && (
                        <p className="text-[11px] font-medium text-slate-600">
                          {company.name}
                        </p>
                      )}
                      <h2 className="text-sm font-semibold text-slate-900">
                        <Link
                          href={`/jobs/${encodeURIComponent(slugOrId)}`}
                          className="hover:underline"
                        >
                          {job.title}
                        </Link>
                      </h2>
                    </div>

                    {/* Meta chips */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      {job.location && (
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5">
                          <span className="mr-1" aria-hidden="true">
                            📍
                          </span>
                          {job.location}
                        </span>
                      )}

                      {workModeLabel && (
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-sky-900">
                          <span className="mr-1" aria-hidden="true">
                            🏡
                          </span>
                          {workModeLabel}
                        </span>
                      )}

                      {employmentTypeLabel && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-900">
                          <span className="mr-1" aria-hidden="true">
                            💼
                          </span>
                          {employmentTypeLabel}
                        </span>
                      )}

                      {job.seniority && (
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5">
                          <span className="mr-1" aria-hidden="true">
                            ⭐
                          </span>
                          {job.seniority}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {job.tags && job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
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

                  {/* Right column: date + CTA */}
                  <div className="flex flex-col items-start gap-1 text-[11px] text-slate-500 sm:items-end">
                    <span>Posted {formatDate(job.created_at)}</span>
                    <Link
                      href={`/jobs/${encodeURIComponent(slugOrId)}`}
                      className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] transition"
                    >
                      View role
                      <span className="ml-1 text-xs" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
