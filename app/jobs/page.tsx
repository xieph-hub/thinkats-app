// app/jobs/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type JobsPageProps = {
  searchParams?: {
    q?: string;
    location?: string;
    department?: string;
    type?: string;
  };
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const q = (searchParams?.q ?? "").trim();
  const location = (searchParams?.location ?? "").trim();
  const department = (searchParams?.department ?? "").trim();
  const type = (searchParams?.type ?? "").trim();

  const where: any = {
    isPublished: true,
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { department: { contains: q, mode: "insensitive" } },
      { type: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
    ];
  }

  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }

  if (department) {
    where.department = { equals: department };
  }

  if (type) {
    where.type = { equals: type };
  }

  const [jobs, deptRows, locationRows, typeRows] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { postedAt: "desc" },
    }),
    prisma.job.findMany({
      where: { isPublished: true },
      distinct: ["department"],
      select: { department: true },
      orderBy: { department: "asc" },
    }),
    prisma.job.findMany({
      where: { isPublished: true },
      distinct: ["location"],
      select: { location: true },
      orderBy: { location: "asc" },
    }),
    prisma.job.findMany({
      where: { isPublished: true },
      distinct: ["type"],
      select: { type: true },
      orderBy: { type: "asc" },
    }),
  ]);

  const departments = deptRows
    .map((d) => d.department)
    .filter((d): d is string => !!d);

  const locations = locationRows
    .map((l) => l.location)
    .filter((l): l is string => !!l);

  const types = typeRows
    .map((t) => t.type)
    .filter((t): t is string => !!t);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs font-medium tracking-[0.18em] text-[#6ea0ff] uppercase">
            Resourcin® Talent Network
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
            Open roles
          </h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Browse live mandates across product, engineering, finance, sales,
            and leadership. Use the filters to quickly find roles by location,
            department, or type.
          </p>
        </header>

        {/* Filters / Search */}
        <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-sm">
          <form
            method="get"
            className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]"
          >
            {/* Search */}
            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-300">
                Search
              </label>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search by role, keyword, company, location..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none focus:border-[#172965] focus:ring-2 focus:ring-[#172965]"
              />
              <p className="text-[10px] text-slate-500">
                We’ll match across title, location, department, and description.
              </p>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-300">
                Location
              </label>
              <select
                name="location"
                defaultValue={location}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none focus:border-[#172965] focus:ring-2 focus:ring-[#172965]"
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
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-300">
                Department
              </label>
              <select
                name="department"
                defaultValue={department}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none focus:border-[#172965] focus:ring-2 focus:ring-[#172965]"
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
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-slate-300">
                Type
              </label>
              <select
                name="type"
                defaultValue={type}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none focus:border-[#172965] focus:ring-2 focus:ring-[#172965]"
              >
                <option value="">All types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit button (mainly for mobile; desktop users can hit Enter) */}
            <div className="md:col-span-4 flex justify-end pt-1">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-medium text-white hover:bg-[#101c44] transition-colors"
              >
                Apply filters
              </button>
            </div>
          </form>
        </section>

        {/* Jobs list */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {jobs.length === 0
                ? "No roles match your filters."
                : `${jobs.length} role${jobs.length === 1 ? "" : "s"} found`}
            </span>
          </div>

          <div className="space-y-3">
            {jobs.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center text-xs text-slate-400">
                Try clearing filters or broadening your search keywords.
              </div>
            )}

            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.slug}`}
                className="block rounded-xl border border-slate-800 bg-slate-950/80 p-4 transition-colors hover:border-[#6ea0ff] hover:bg-slate-900/80"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-slate-50">
                      {job.title}
                    </h2>
                    {job.excerpt && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {job.excerpt}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      {job.location && (
                        <span className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1">
                          {job.location}
                        </span>
                      )}
                      {job.department && (
                        <span className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1">
                          {job.department}
                        </span>
                      )}
                      {job.type && (
                        <span className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1">
                          {job.type}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-1 text-[11px] text-slate-400 mt-1 md:mt-0">
                    {job.postedAt && (
                      <span>
                        Posted{" "}
                        {new Date(job.postedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-300">
                      View details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
