// app/jobs/[slug]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ApplyForm from "@/components/ApplyForm";

type PageProps = {
  params: { slug: string };
};

export default async function JobPage({ params }: PageProps) {
  const job = await prisma.job.findUnique({
    where: { slug: params.slug },
  });

  if (!job || job.isPublished === false) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
            Open role
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {job.title}
          </h1>

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
        </header>

        {/* Job description */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {job.excerpt && (
            <p className="mb-4 text-sm text-slate-700">{job.excerpt}</p>
          )}
          <div className="prose prose-sm max-w-none text-slate-700">
            {/* If description is rich text / HTML, adjust accordingly.
               For now assume plain text / markdown-ish */}
            {job.description}
          </div>
        </section>

        {/* Apply form – this is where the CV / Resume field lives */}
        <ApplyForm jobTitle={job.title} jobSlug={job.slug} />
      </div>
    </main>
  );
}
