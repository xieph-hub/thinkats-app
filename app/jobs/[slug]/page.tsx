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
                <span className="ml-1.5 text-[0]()
