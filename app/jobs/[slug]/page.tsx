// app/jobs/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import ApplyForm from "@/components/ApplyForm";

type JobPageProps = {
  params: { slug: string };
};

export default async function JobPage({ params }: JobPageProps) {
  const { slug } = params;

  // 🔹 Look up the job strictly by slug
  const job = await prisma.job.findUnique({
    where: { slug },
  });

  // 🔹 If no job or explicitly unpublished, show a friendly message
  if (!job || job.isPublished === false) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          Job not found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This role may no longer be available or the link might be incorrect.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#172965]">
          Open role
        </p>

        {/* Title */}
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">
          {job.title}
        </h1>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
          {job.department && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.department}
            </span>
          )}
          {job.location && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.location}
            </span>
          )}
          {job.type && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.type}
            </span>
          )}
        </div>

        {/* Description */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Role overview
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {job.description}
          </p>
        </div>

        {/* Apply form */}
        <ApplyForm jobTitle={job.title} jobId={job.id} />
      </div>
    </div>
  );
}
