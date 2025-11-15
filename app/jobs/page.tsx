// app/jobs/page.tsx

import Link from "next/link";
import { prisma } from "@/lib/prisma";

type JobsPageProps = {
  searchParams?: {
    q?: string;
    location?: string;
    department?: string;
    type?: string;
  };
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const q = (searchParams?.q ?? "").toString();
  const location = (searchParams?.location ?? "").toString();
  const department = (searchParams?.department ?? "").toString();
  const type = (searchParams?.type ?? "").toString();

  // ------- Build Prisma "where" filter ------- //
  const where: any = {
    isPublished: true,
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }

  if (department) {
    where.department = { contains: department, mode: "insensitive" };
  }

  if (type) {
    where.type = type;
  }

  // ------- Fetch jobs + distinct filter options ------- //
  const [jobs, locationsRaw, departmentsRaw, typesRaw] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { postedAt: "desc" },
    }),
    prisma.job.findMany({
      where: { isPublished: true },
      select: { location: true },
      distinct: ["location"],
      orderBy: { location: "asc" },
    }),
    prisma.job.findMany({
      where: { isPublished: true },
      select: { department: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    }),
    prisma.job.findMany({
      where: { isPublished: true },
      select: { type: true },
      distinct: ["type"],
      orderBy: { type: "asc" },
    }),
  ]);

  const locations = Array.from(
    new Set(
      locationsRaw
        .map((j) => j.location)
        .filter((v): v is string => Boolean(v && v.trim()))
    )
  );

  const departments = Array.from(
    new Set(
      departmentsRaw
        .map((j) => j.department)
        .filter((v): v is string => Boolean(v && v.trim()))
    )
  );

  const types = Array.from(
    new Set(
      typesRaw
        .map((j) => j.type)
        .filter((v): v is string => Boolean(v && v.trim()))
    )
  );

  const hasFilters = Boolean(q || location || department || type);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#172965]">
            Resourcin · Opportunities
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Open roles
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">
            Browse roles across our clients and internal mandates. Use the
            filters to narrow down by location, department, and role type.
          </p>
        </header>

        {/* Filters */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <form className="grid gap-4 md:grid-cols-4" method="GET">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Search
              </label>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search by job title, keywords, or description"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-2 focus:ring-[#172965]"
              />
            </div>

            {/* Location */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Location
              </label>
              <select
                name="location"
                defaultValue={location}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-2 focus:ring-[#172965]"
              >
                <option value="">All locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Department
              </label>
              <select
                name="department"
                defaultValue={department}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-2 focus:ring-[#172965]"
              >
                <option value="">All departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Role type
              </label>
              <select
                name="type"
                defaultValue={type}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-2 focus:ring-[#172965]"
              >
                <option value="">All types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter button row */}
            <div className="md:col-span-4 flex items-center justify-between pt-1">
              <div className="text-xs text-slate-500">
                {hasFilters ? (
                  <span>
                    Showing <span className="font-semibold">{jobs.length}</span>{" "}
                    role{jobs.length === 1 ? "" : "s"} with applied filters.
                  </span>
                ) : (
                  <span>
                    Showing{" "}
                    <span className="font-semibold">{jobs.length}</span> open
                    role{jobs.length === 1 ? "" : "s"}.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasFilters && (
                  <Link
                    href="/jobs"
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Clear filters
                  </Link>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#101c44]"
                >
                  Apply filters
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Jobs list */}
        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No roles match your filters yet. Try removing a filter or check back
            later.
          </div>
        ) : (
          <section className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#172965] hover:shadow-md"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {job.title}
                    </h2>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5">
                        {job.location}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5">
                        {job.department}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5">
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 mt-1 md:mt-0">
                    <p>
                      Posted{" "}
                      {new Date(job.postedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-[#172965] font-medium">
                      View &amp; apply →
                    </p>
                  </div>
                </div>

                {job.excerpt && (
                  <p className="mt-3 line-clamp-2 text-xs text-slate-600">
                    {job.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
