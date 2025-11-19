// app/jobs/[slug]/apply/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import JobApplyForm from "./JobApplyForm";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

async function fetchJobBySlugOrId(slugOrId: string) {
  let job = await prisma.job.findFirst({
    where: { slug: slugOrId },
  });

  if (!job) {
    job = await prisma.job.findUnique({
      where: { id: slugOrId },
    });
  }

  return job;
}

export default async function JobApplyPage({
  params,
}: {
  params: { slug: string };
}) {
  const job = await fetchJobBySlugOrId(params.slug);

  if (!job) {
    notFound();
  }

  const employerName = "Apply via Resourcin";

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            href={`/jobs/${job.slug ?? params.slug}`}
            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to role
          </Link>
        </div>

        <section className="rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
          <header className="mb-4 space-y-1">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
              Application
            </p>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
              Apply for {job.title}
            </h1>
            <p className="text-xs text-slate-600 sm:text-sm">
              {employerName} · {job.location}
            </p>
          </header>

          <p className="mb-4 text-xs text-slate-600 sm:text-sm">
            This form gives us enough context to understand your experience and
            map you properly to the brief. You can attach your CV and share
            links for LinkedIn or portfolio.
          </p>

          <JobApplyForm slug={job.slug ?? params.slug} jobTitle={job.title} />
        </section>
      </main>
    </div>
  );
}
