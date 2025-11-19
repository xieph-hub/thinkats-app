// app/jobs/[slug]/page.tsx

import JobApplyForm from "../JobApplyForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function fetchJobBySlugOrId(slugOrId: string) {
  // 1) Try match by slug
  let job = await prisma.job.findFirst({
    where: { slug: slugOrId },
    include: {
      tenant: true,
      clientCompany: true,
    },
  });

  // 2) Fallback: if nothing by slug, try by id
  if (!job) {
    job = await prisma.job.findUnique({
      where: { id: slugOrId },
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
      title: "Role not found · Resourcin",
    };
  }

  const employerName =
    job.clientCompany?.name ?? job.tenant?.name ?? "Resourcin search";

  return {
    title: `${job.title} – ${employerName} · Jobs`,
    description:
      job.summary ??
      "Executive and specialist roles across product, engineering, data, operations and growth.",
    alternates: {
      canonical: `${SITE_URL}/jobs/${job.slug ?? params.slug}`,
    },
  };
}

export default async function JobDetailPage({
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

  const nameForInitials =
    job.clientCompany?.name ?? job.tenant?.name ?? "Resourcin";

  const initials = nameForInitials
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const postedAt = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(job.createdAt);

  const tags = job.tags ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <div className="mb-4">
          <Link
            href="/jobs"
            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to all roles
          </Link>
        </div>

        {/* Header card */}
        <section className="mb-6 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#172965] text-sm font-semibold text-white shadow-sm">
                {initials}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  {job.title}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {employerName} · {job.location}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 text-xs text-slate-500 sm:items-end">
              <span>Posted {postedAt}</span>
              {/* you don’t have salary_range on new table, so we skip it */}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-[0.7rem] text-slate-600 sm:text-xs">
            {job.function && (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                {job.function}
              </span>
            )}
            {job.employmentType && (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                {job.employmentType}
              </span>
            )}
            {job.seniority && (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                {job.seniority} level
              </span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] text-slate-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>

        {/* Body + how to express interest */}
        <section className="space-y-6 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
          {job.summary && (
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {job.summary}
            </div>
          )}

          <article className="prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-900 prose-a:text-[#172965]">
            {job.description ? (
              <div dangerouslySetInnerHTML={{ __html: job.description }} />
            ) : (
              <p>
                Full description will be shared at screening. This role is
                currently in active search via Resourcin.
              </p>
            )}
          </article>

          <div className="border-t border-slate-100 pt-4 text-sm text-slate-700">
            <p className="font-semibold text-[#172965]">
              How to express interest
            </p>
            <p className="mt-1">
              The easiest way is to use the application form below so we can
              match you directly to this role. If you’d rather share your
              details more broadly, you can also use the{" "}
              <Link
                href={`/talent-network?utm_source=job_detail&utm_campaign=${encodeURIComponent(
                  job.slug ?? params.slug
                )}`}
                className="font-medium text-[#172965] underline-offset-2 hover:underline"
              >
                talent network form
              </Link>{" "}
              and mention this role in the notes.
            </p>
          </div>
        </section>

        {/* Application form (new) */}
        <JobApplyForm jobSlug={job.slug} jobTitle={job.title} />
      </main>
    </div>
  );
}
