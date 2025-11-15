// app/jobs/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ApplyForm from "@/components/ApplyForm";

type PageProps = {
  params: { slug: string };
};

// Force this page to be rendered on each request (no static generation issues)
export const dynamic = "force-dynamic";

export default async function JobPage({ params }: PageProps) {
  const { slug } = params;

  // 1) Load job by slug (no isPublished filter here to avoid accidental 404s)
  const job = await prisma.job.findUnique({
    where: { slug },
  });

  // If there is truly no job in the DB with this slug, show 404
  if (!job) {
    notFound();
  }

  const postedDate =
    job.postedAt instanceof Date
      ? job.postedAt.toLocaleDateString("en-NG", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Back link */}
        <Link
          href="/jobs"
          className="inline-flex items-center text-xs text-slate-400 hover:text-white mb-6"
        >
          <span className="mr-1">←</span> Back to all roles
        </Link>

        {/* Job header */}
        <header className="space-y-3 mb-8">
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#FFB703] font-semibold">
            Open role
          </p>

          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            {job.title}
          </h1>

          {job.excerpt && (
            <p className="text-sm text-slate-300 max-w-2xl">{job.excerpt}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-300">
            {job.department && (
              <span className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1">
                {job.department}
              </span>
            )}
            {job.location && (
              <span className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1">
                {job.location}
              </span>
            )}
            {job.type && (
              <span className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1">
                {job.type}
              </span>
            )}
            {postedDate && (
              <span className="inline-flex items-center rounded-full border border-slate-800 px-3 py-1 text-slate-400">
                Posted {postedDate}
              </span>
            )}
          </div>
        </header>

        {/* Layout: description + apply form */}
        <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] items-start">
          {/* Job description */}
          <article className="prose prose-invert prose-sm max-w-none">
            <div
              className="prose prose-invert prose-sm max-w-none"
              // If description is plain text, it will still render; if it's HTML, it will be formatted.
              dangerouslySetInnerHTML={{ __html: job.description || "" }}
            />
          </article>

          {/* Apply sidebar */}
          <aside>
            <ApplyForm jobId={job.id} jobTitle={job.title} />
          </aside>
        </div>
      </div>
    </main>
  );
}
