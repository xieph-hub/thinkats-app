// app/ats/[slug]/page.tsx
//
// ATS job detail view for a single job (by slug) for the *current* tenant.
// Uses lib/jobs.ts → getJobForCurrentTenantBySlug, which reads from public.jobs.

import Link from "next/link";
import { getJobForCurrentTenantBySlug } from "@/lib/jobs";

interface JobPageProps {
  params: {
    slug: string;
  };
}

// Always fetch fresh – no static cache for now
export const revalidate = 0;

export default async function JobDetailsPage({ params }: JobPageProps) {
  const job = await getJobForCurrentTenantBySlug(params.slug);

  if (!job) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          Job not found
        </h1>
        <p className="text-sm text-slate-600">
          This job either doesn&apos;t exist, doesn&apos;t belong to your
          tenant, or has been removed.
        </p>
        <div>
          <Link
            href="/ats"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to ATS dashboard
          </Link>
        </div>
      </main>
    );
  }

  // Format created date (if present)
  const createdLabel = job.created_at
    ? new Date(job.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const tags = job.tags ?? [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            ThinkATS · Job details
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {job.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {job.location || "Location not set"} ·{" "}
            {job.department || "General"} ·{" "}
            {job.employment_type || "Employment type not set"}
          </p>
          {createdLabel && (
            <p className="mt-1 text-xs text-slate-500">
              Created {createdLabel} · Status:{" "}
              <span className="font-medium">{job.status}</span> · Visibility:{" "}
              <span className="font-medium">{job.visibility}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Link
            href="/ats"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to ATS dashboard
          </Link>
        </div>
      </header>

      {/* Tags / meta */}
      {(tags.length > 0 || job.seniority) && (
        <section className="mb-6 flex flex-wrap gap-2 text-xs text-slate-600">
          {job.seniority && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              Seniority: {job.seniority}
            </span>
          )}
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
            >
              {tag}
            </span>
          ))}
        </section>
      )}

      {/* Description */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Job description
        </h2>

        {job.description ? (
          <article className="prose prose-sm max-w-none text-slate-800">
            {/* For now treat as plain text – we can later support Markdown/HTML */}
            <pre className="whitespace-pre-wrap break-words text-sm font-normal">
              {job.description}
            </pre>
          </article>
        ) : (
          <p className="text-sm text-slate-500">
            No description has been added for this job yet.
          </p>
        )}
      </section>
    </main>
  );
}
