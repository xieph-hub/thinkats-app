// app/jobs/[slug]/apply/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { prisma } from "@/lib/prisma";
import JobApplyForm from "../../JobApplyForm";

export const dynamic = "force-dynamic";

async function fetchJobBySlugOrId(slugOrId: string) {
  let job = await prisma.job.findFirst({
    where: { slug: slugOrId, isPublished: true },
    include: {
      tenant: true,
      clientCompany: true,
    },
  });

  if (!job) {
    job = await prisma.job.findFirst({
      where: { id: slugOrId, isPublished: true },
      include: {
        tenant: true,
        clientCompany: true,
      },
    });
  }

  return job;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const job = await fetchJobBySlugOrId(params.slug);

  if (!job) {
    return {
      title: "Apply · Resourcin",
    };
  }

  const employerName =
    job.clientCompany?.name ?? job.tenant?.name ?? "Resourcin search";

  return {
    title: `Apply – ${job.title} · ${employerName}`,
    description:
      job.summary ??
      "Share your details once so we can match you tightly to this search.",
    alternates: {
      canonical: `${SITE_URL}/jobs/${job.slug ?? params.slug}/apply`,
    },
  };
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

  const employerName =
    job.clientCompany?.name ?? job.tenant?.name ?? "Resourcin search";

  const backToJobPath = `/jobs/${job.slug ?? params.slug}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <div>
          <Link
            href={backToJobPath}
            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to role
          </Link>
        </div>

        <section className="rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Apply for {job.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {employerName} · {job.location}
          </p>
          <p className="mt-3 text-xs text-slate-600 sm:text-sm">
            This form feeds directly into Resourcin’s ATS. Share a current CV
            and a short context so we can match you accurately to this brief.
          </p>
        </section>

        <section className="rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
          <JobApplyForm
            jobSlug={job.slug ?? params.slug}
            jobTitle={job.title}
          />
        </section>
      </main>
    </div>
  );
}
