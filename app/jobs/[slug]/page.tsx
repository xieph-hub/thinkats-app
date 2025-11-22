// app/jobs/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ApplyForm from "./ApplyForm";

export const revalidate = 60;

type JobPageProps = {
  params: { slug: string };
};

export default async function PublicJobPage({ params }: JobPageProps) {
  const slugOrId = params.slug;

  const job = await prisma.job.findFirst({
    where: {
      AND: [
        { status: "open" as any },
        { visibility: "public" as any },
        {
          OR: [{ slug: slugOrId }, { id: slugOrId }],
        },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      department: true,
      location: true,
      employmentType: true,
      seniority: true,
      description: true,
      tags: true,
      createdAt: true,
    },
  });

  if (!job) {
    notFound();
  }

  const slugOrIdForApply = job.slug || job.id;

  const createdLabel = job.createdAt
    ? new Date(job.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/jobs"
          className="text-xs font-medium text-[#172965] hover:underline"
        >
          ← Back to all jobs
        </Link>
      </div>

      <header className="mb-6 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Open role
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">{job.title}</h1>
        <p className="text-xs text-slate-500">
          {job.location || "Location flexible"}
          {job.department ? ` • ${job.department}` : ""}
          {job.seniority ? ` • ${job.seniority}` : ""}
        </p>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
          {job.employmentType && (
            <span className="rounded-full border border-slate-200 px-3 py-1">
              {job.employmentType}
            </span>
          )}
          {createdLabel && (
            <span className="rounded-full border border-slate-200 px-3 py-1">
              Posted {createdLabel}
            </span>
          )}
        </div>
      </header>

      <section className="prose prose-sm max-w-none text-slate-800">
        <div className="whitespace-pre-line text-sm leading-relaxed">
          {job.description || "No description provided yet."}
        </div>
      </section>

      {Array.isArray(job.tags) && job.tags.length > 0 && (
        <section className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
          {job.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-50 px-2.5 py-1"
            >
              {tag}
            </span>
          ))}
        </section>
      )}

      {/* Inline apply form */}
      <ApplyForm jobSlug={slugOrIdForApply} jobTitle={job.title} />
    </main>
  );
}
