// app/careers/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All open roles | ThinkATS",
  description:
    "Browse open roles across all companies hiring on ThinkATS – one search, multiple employers.",
};

type CareersSearchParams = {
  q?: string | string[];
  tenant?: string | string[];
};

function normaliseParam(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function formatPosted(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 7) return `Posted ${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `Posted ${weeks} week${weeks > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function CareersIndexPage({
  searchParams,
}: {
  searchParams?: CareersSearchParams;
}) {
  const qRaw = normaliseParam(searchParams?.q).trim();
  const tenantSlugFilter = normaliseParam(searchParams?.tenant).trim();

  const q = qRaw || undefined;

  // Build a single "where" object so it's easy to tweak later
  const where: any = {
    status: "open",
    visibility: "public",
    tenant: {
      status: "active",
      ...(tenantSlugFilter ? { slug: tenantSlugFilter } : {}),
    },
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
            {
              tenant: {
                name: { contains: q, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };

  const jobs = await prisma.job.findMany({
    where,
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 150, // safety cap for now
  });

  const uniqueTenants = Array.from(
    new Map(
      jobs
        .filter((job) => job.tenant?.slug)
        .map((job) => [
          job.tenant!.slug,
          {
            slug: job.tenant!.slug,
            name: job.tenant!.name,
          },
        ]),
    ).values(),
  );

  const totalJobs = jobs.length;
  const totalTenants = uniqueTenants.length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 lg:px-0">
      {/* Header + search */}
      <header className="mb-8 space-y-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Open roles across ThinkATS
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            One place to browse roles from agencies and in-house teams using
            ThinkATS. Filter by company or search by title, location or keyword.
          </p>
        </div>

        <form className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="flex-1">
            <label
              htmlFor="q"
              className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500"
            >
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={qRaw}
              placeholder="Search by job title, company or location"
              className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          {uniqueTenants.length > 0 && (
            <div className="sm:w-64">
              <label
                htmlFor="tenant"
                className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500"
              >
                Company
              </label>
              <select
                id="tenant"
                name="tenant"
                defaultValue={tenantSlugFilter}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
              >
                <option value="">All companies</option>
                {uniqueTenants.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-1 sm:pt-6">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c48]"
            >
              Apply filters
            </button>
          </div>
        </form>

        <p className="text-xs text-slate-500">
          Showing <span className="font-semibold">{totalJobs}</span> open{" "}
          job{totalJobs === 1 ? "" : "s"} across{" "}
          <span className="font-semibold">{totalTenants}</span>{" "}
          compan{totalTenants === 1 ? "y" : "ies"} using ThinkATS.
        </p>
      </header>

      {/* Jobs list */}
      {jobs.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
          <p className="font-medium text-slate-800">No roles match your filters.</p>
          <p className="mt-2 text-xs text-slate-500">
            Try clearing the company filter or using a broader search term.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {jobs.map((job) => {
            const tenant = job.tenant!;
            const tenantSlug = tenant.slug;
            const careersUrl = tenantSlug
              ? `/careers/${encodeURIComponent(tenantSlug)}`
              : undefined;

            return (
              <article
                key={job.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-1 items-start gap-3">
                  {/* Logo / initial */}
                  {tenant.logoUrl ? (
                    <div className="relative mt-0.5 h-9 w-9 overflow-hidden rounded-md border border-slate-200 bg-white">
                      <Image
                        src={tenant.logoUrl}
                        alt={`${tenant.name} logo`}
                        width={36}
                        height={36}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-700">
                      {tenant.name?.charAt(0).toUpperCase() ?? "T"}
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-slate-900">
                        {job.title}
                      </h2>
                      {tenantSlug && (
                        <Link
                          href={careersUrl!}
                          className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100"
                        >
                          {tenant.name}
                        </Link>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      {job.location && (
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
                          📍 {job.location}
                        </span>
                      )}
                      {job.experienceLevel && (
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
                          🎯 {job.experienceLevel}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {formatPosted(job.createdAt)}
                      </span>
                    </div>
                    {job.shortDescription && (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                        {job.shortDescription}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-2 text-xs sm:items-end">
                  <Link
                    href={`/jobs/${job.slug || job.id}`}
                    className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0f1c48]"
                  >
                    View role
                  </Link>
                  {careersUrl && (
                    <Link
                      href={careersUrl}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View all jobs at {tenant.name}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
