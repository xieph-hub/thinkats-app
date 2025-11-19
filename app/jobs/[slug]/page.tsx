// app/jobs/[slug]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function fetchJobBySlugOrId(slugOrId: string) {
  // 1) Try by slug
  let job = await prisma.job.findFirst({
    where: { slug: slugOrId, isPublished: true },
    include: {
      tenant: true,
      clientCompany: true,
    },
  });

  // 2) Fallback by id
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
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Back link */}
        <div>
          <Link
            href="/jobs"
            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to all roles
          </Link>
        </div>

        {/* Hero / summary header */}
        <section className="rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-slate-200 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#172965] text-sm font-semibold text-white shadow-sm">
                {initials}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 sm:text-2xl">
                  {job.title}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {employerName} · {job.location}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[0.7rem] text-slate-600 sm:text-xs">
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
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 text-xs text-slate-500 sm:items-end">
              <span>Posted {postedAt}</span>
              <Link
                href={applyPath}
                className="inline-flex items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] sm:text-sm"
              >
                Apply for this role
                <span className="ml-1.5 text-[0.7rem]" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Snapshot cards */}
        <section className="grid gap-3 text-xs sm:grid-cols-3 sm:text-sm">
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
              Role snapshot
            </p>
            <p className="mt-1 text-slate-700">
              {job.function || "Multi-disciplinary"} ·{" "}
              {job.seniority || "All levels"} · {job.employmentType || "Full-time"}
            </p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
              Location & ways of working
            </p>
            <p className="mt-1 text-slate-700">
              {job.location}. Remote / hybrid specifics are usually agreed with
              the hiring team during process.
            </p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
              How we hire
            </p>
            <p className="mt-1 text-slate-700">
              Structured stages, clear feedback where possible, and no black
              holes. We aim for a concise, respectful process.
            </p>
          </div>
        </section>

        {/* Main content grid: left = sections, right = sidebar */}
        <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Left: rich sections */}
          <div className="space-y-8">
            {/* About the role */}
            <section>
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                About the role
              </h2>
              <p className="mt-2 text-sm text-slate-700">
                {job.summary ||
                  "This search is being run by Resourcin on behalf of a growth-focused team. Below is the full brief shared with shortlisted candidates."}
              </p>
            </section>

            {/* Full brief / description */}
            <section>
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                Full brief
              </h2>
              <div className="mt-3 prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-900 prose-a:text-[#172965]">
                {job.description ? (
                  <div dangerouslySetInnerHTML={{ __html: job.description }} />
                ) : (
                  <p>
                    Full description will be shared at screening. This role is
                    currently in active search via Resourcin.
                  </p>
                )}
              </div>
            </section>

            {/* How Resourcin works with candidates */}
            <section>
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                How we work with candidates
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>No spam and no CV-blast. We only approach you for real, active briefs.</li>
                <li>
                  We try to share context on the team, reporting lines and expectations
                  before you commit to a process.
                </li>
                <li>
                  Where we can, we offer honest feedback to help you calibrate future
                  applications.
                </li>
              </ul>
            </section>
          </div>

          {/* Right: sidebar */}
          <aside className="space-y-6">
            <section className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200 sm:px-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Key details
              </h3>
              <dl className="mt-3 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Employer</dt>
                  <dd className="text-right">{employerName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="text-right">{job.location}</dd>
                </div>
                {job.function && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Function</dt>
                    <dd className="text-right">{job.function}</dd>
                  </div>
                )}
                {job.seniority && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Seniority</dt>
                    <dd className="text-right">{job.seniority}</dd>
                  </div>
                )}
                {job.employmentType && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Employment type</dt>
                    <dd className="text-right">{job.employmentType}</dd>
                  </div>
                )}
              </dl>

              <Link
                href={applyPath}
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] sm:text-sm"
              >
                Apply for this role
                <span className="ml-1.5 text-[0.7rem]" aria-hidden="true">
                  →
                </span>
              </Link>
            </section>

            <section className="rounded-2xl bg-slate-900 px-4 py-4 text-xs text-slate-100 shadow-sm sm:px-5">
              <h3 className="text-sm font-semibold text-white">
                Not quite this role?
              </h3>
              <p className="mt-2 text-slate-100/90">
                You can still share your profile once via the talent network.
                When we run searches that match your experience, we reach out
                with a clear brief.
              </p>
              <Link
                href={`/talent-network?utm_source=job_detail&utm_campaign=${encodeURIComponent(
                  job.slug ?? params.slug
                )}`}
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-white px-3 py-1.5 text-[0.75rem] font-semibold text-slate-900 hover:bg-slate-100"
              >
                Join the talent network
                <span className="ml-1.5 text-[0.7rem]" aria-hidden="true">
                  →
                </span>
              </Link>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
