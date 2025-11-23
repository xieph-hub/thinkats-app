// app/jobs/[slug]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobApplyForm from "./apply/JobApplyForm";
import { getJobForCurrentTenantBySlug } from "@/lib/jobs";

export const revalidate = 60;

type PageParams = { slug: string };

function getBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";
  if (fromEnv.startsWith("http")) return fromEnv;
  return `https://${fromEnv}`;
}

// Optional but nice: SEO metadata for job detail
export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const baseUrl = getBaseUrl();
  const job = await getJobForCurrentTenantBySlug(params.slug);

  // If job not found or not open/public, fall back to generic
  if (!job || job.status !== "open" || job.visibility !== "public") {
    const title = "Role not available | Resourcin";
    const description =
      "This role may have been closed or is no longer visible.";
    const url = `${baseUrl.replace(/\/$/, "")}/jobs`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        url,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  }

  const slugOrId = job.slug ?? job.id;
  const title = `${job.title} | Resourcin`;
  const description =
    job.description?.slice(0, 200) ||
    `Apply for ${job.title} through Resourcin.`;

  const url = `${baseUrl.replace(/\/$/, "")}/jobs/${slugOrId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const job = await getJobForCurrentTenantBySlug(params.slug);

  // ✅ No UUID casting here. We only look up by slug in getJobForCurrentTenantBySlug.
  if (!job || job.status !== "open" || job.visibility !== "public") {
    notFound();
  }

  const slugOrId = job.slug ?? job.id;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {/* Back link */}
      <div className="mb-6">
        <a
          href="/jobs"
          className="text-xs font-medium text-[#172965] hover:underline"
        >
          ← Back to all jobs
        </a>
      </div>

      {/* Job header */}
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Open role
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">{job.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
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
      </header>

      {/* Job body */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {job.description ? (
          <div className="prose prose-sm max-w-none text-slate-800">
            {/* If you later store structured sections, we can render them properly.
               For now we just render the description as simple text. */}
            <p className="whitespace-pre-line">{job.description}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Full description will be shared with shortlisted candidates.
          </p>
        )}
      </section>

      {/* Apply section */}
      <section className="mt-10">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">
          Apply for this role
        </h2>
        <p className="mb-4 text-xs text-slate-600">
          Share a few details and your CV. We&apos;ll review and get in touch
          if there&apos;s a strong match.
        </p>
        <JobApplyForm slug={slugOrId} jobTitle={job.title} />
      </section>
    </main>
  );
}
