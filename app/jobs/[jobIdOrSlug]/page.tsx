// app/jobs/[jobIdOrSlug]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPublicJobBySlugOrId } from "@/lib/jobs";
import { JobApplyForm } from "./JobApplyForm";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: { jobIdOrSlug: string };
}) {
  const job = await getPublicJobBySlugOrId(params.jobIdOrSlug);

  if (!job) {
    notFound();
  }

  const isConfidential = job.isConfidential;
  const client = job.clientCompany;

  const clientLabel = (() => {
    if (!client) return "Resourcin";
    if (isConfidential) return "Confidential client";
    return client.name;
  })();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/jobs"
        className="mb-4 inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900"
      >
        ← Back to all roles
      </Link>

      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {job.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>{clientLabel}</span>
            {job.location && (
              <>
                <span className="text-slate-300">•</span>
                <span>{job.location}</span>
              </>
            )}
            {job.employmentType && (
              <>
                <span className="text-slate-300">•</span>
                <span>{job.employmentType}</span>
              </>
            )}
          </div>
        </div>

        {/* Logo only if non-confidential and available */}
        {client && !isConfidential && client.logoUrl && (
          <div className="shrink-0">
            <Image
              src={client.logoUrl}
              alt={client.name}
              width={64}
              height={64}
              className="h-14 w-14 rounded-md object-contain"
            />
          </div>
        )}
      </header>

      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
        {/* Description */}
        <article className="space-y-4 text-sm text-slate-700">
          {job.description ? (
            <div
              className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          ) : (
            <p>No description provided for this role yet.</p>
          )}
        </article>

        {/* Apply box */}
        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Apply for this role
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            You can apply without creating an account. Just share your details and CV.
          </p>

          <div className="mt-4">
            <JobApplyForm jobId={job.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}
