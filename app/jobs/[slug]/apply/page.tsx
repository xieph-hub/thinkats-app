// app/jobs/[slug]/apply/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import ApplyFormClient from "../ApplyFormClient";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

async function fetchJobBySlugOrId(slugOrId: string) {
  // 1) Try slug
  let job = await prisma.job.findFirst({
    where: { slug: slugOrId },
  });

  // 2) Fallback: id
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

  const employerName = "Resourcin search"; // you can expand this later

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <div className="mb-4">
          <Link
            href={`/jobs/${job.slug ?? params.slug}`}
            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to role
          </Link>
        </div>

        <section className="rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
          <header className="mb-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Application
            </p>
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              Apply for {job.title}
            </h1>
            <p className="text-sm text-slate-600">
              {employerName} · {job.location}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Short, structured form so we can understand your experience and
              where you create the most value. You can always share an updated
              profile later.
            </p>
          </header>

          <ApplyFormClient jobId={job.id} jobTitle={job.title} />
        </section>
      </main>
    </div>
  );
}
