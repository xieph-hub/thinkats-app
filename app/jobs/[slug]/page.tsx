// app/jobs/[slug]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

async function fetchJobBySlugOrId(slugOrId: string) {
  // Try by slug
  let job = await prisma.job.findFirst({
    where: { slug: slugOrId },
    include: {
      tenant: true,
      clientCompany: true,
    },
  });

  // Fallback by id
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
  const applyPath = `/jobs/${job.slug ?? params.slug}/apply`;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/jobs"
            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to all roles
          </Link>

          <Link
            href={applyPath}
            className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] sm:text-sm"
          >
            Apply for this role
            <span className="ml-1.5 text-[0.7rem]" aria-hidden="true">
              →
            </span>
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

            <div className="flex flex-col items-start gap-1 text-xs text-slate-500 sm:items-end">
              <span>Posted {postedAt}</span>
              <span>Managed by Resourcin</span>
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

        {/* Body layout: main + sidebar */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Main column */}
          <div className="space-y-6">
            {/* Snapshot / summary */}
            {job.summary && (
              <div className="rounded-2xl bg-white px-5 py-4 text-sm text-slate-800 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-sm font-semibold text-[#172965] sm:text-base">
                  Role snapshot
                </h2>
                <p className="mt-2 leading-relaxed">{job.summary}</p>
              </div>
            )}

            {/* Description */}
            <div className="rounded-2xl bg-white px-5 py-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-sm font-semibold text-[#172965] sm:text-base">
                About the role
              </h2>
              <article className="prose prose-sm mt-3 max-w-none text-slate-800 prose-headings:text-slate-900 prose-a:text-[#172965]">
                {job.description ? (
                  <div
                    // description is assumed to already be safe HTML/Markdown
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                ) : (
                  <p>
                    Full description will be shared at screening. This role is
                    currently in active search via Resourcin.
                  </p>
                )}
              </article>
            </div>

            {/* How to work with Resourcin / process */}
            <div className="rounded-2xl bg-white px-5 py-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-sm font-semibold text-[#172965] sm:text-base">
                How the process works
              </h2>
              <ol className="mt-3 space-y-2 text-sm text-slate-700">
                <li>
                  <span className="font-semibold text-[#172965]">1.</span> You
                  submit a short, structured application with your CV and core
                  context.
                </li>
                <li>
                  <span className="font-semibold text-[#172965]">2.</span> We
                  review against the brief and reach out if there&apos;s a
                  strong match.
                </li>
                <li>
                  <span className="font-semibold text-[#172965]">3.</span> You
                  get a clear outline of the role, context on the team, and the
                  interview stages.
                </li>
              </ol>

              <div className="mt-4">
                <Link
                  href={applyPath}
                  className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111c4c]"
                >
                  Start application
                  <span className="ml-1.5 text-xs" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quick facts
              </h3>
              <dl className="mt-3 space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-xs text-slate-500">Company</dt>
                  <dd className="text-xs font-medium text-slate-800 text-right">
                    {employerName}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-xs text-slate-500">Location</dt>
                  <dd className="text-xs font-medium text-slate-800 text-right">
                    {job.location}
                  </dd>
                </div>
                {job.employmentType && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-xs text-slate-500">Type</dt>
                    <dd className="text-xs font-medium text-slate-800 text-right">
                      {job.employmentType}
                    </dd>
                  </div>
                )}
                {job.seniority && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-xs text-slate-500">Seniority</dt>
                    <dd className="text-xs font-medium text-slate-800 text-right">
                      {job.seniority}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Apply via Resourcin
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                We&apos;ll use your application to understand your experience,
                career direction and constraints, and then map you against this
                brief.
              </p>
              <Link
                href={applyPath}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c]"
              >
                Apply for this role
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
