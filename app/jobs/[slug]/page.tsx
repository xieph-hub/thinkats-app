// app/jobs/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type JobsPageProps = {
  searchParams?: {
    q?: string;
    location?: string;
    type?: string;
    department?: string;
  };
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const q = (searchParams?.q ?? "").trim();
  const locationFilter = (searchParams?.location ?? "").trim();
  const typeFilter = (searchParams?.type ?? "").trim();
  const deptFilter = (searchParams?.department ?? "").trim();

  // 1) Pull all jobs (we can later add isPublished if you're using it)
  const jobs = await prisma.job.findMany({
    orderBy: {
      postedAt: "desc",
    },
  });

  // 2) Build filter options from existing jobs
  const locations = Array.from(
    new Set(jobs.map((j) => j.location).filter(Boolean))
  ) as string[];

  const types = Array.from(
    new Set(jobs.map((j) => j.type).filter(Boolean))
  ) as string[];

  const departments = Array.from(
    new Set(jobs.map((j) => j.department).filter(Boolean))
  ) as string[];

  // 3) Apply filters + search in memory
  const filteredJobs = jobs.filter((job) => {
    if (q) {
      const haystack = (
        (job.title || "") +
        " " +
        (job.excerpt || "") +
        " " +
        (job.description || "")
      ).toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }
    if (locationFilter && job.location !== locationFilter) return false;
    if (typeFilter && job.type !== typeFilter) return false;
    if (deptFilter && job.department !== deptFilter) return false;
    return true;
  });

  const totalCount = jobs.length;
  const showingCount = filteredJobs.length;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-10 space-y-3">
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#FFB703] font-semibold">
            Open roles
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold">
            Join teams we&apos;re hiring for
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Curated mandates across fintech, SaaS, and high-growth businesses.
            Filter by location or role type, then share roles directly to
            LinkedIn or X.
          </p>
        </header>

        {/* Filters: pure server-side via query params */}
        <form
          className="mb-8 grid gap-3 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]"
          method="GET"
        >
          {/* Search input */}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by title, keyword, company…"
            className="rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs outline-none placeholder:text-slate-500 focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
          />

          {/* Location filter */}
          <select
            name="location"
            defaultValue={locationFilter}
            className="rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
          >
            <option value="">All locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Type filter */}
          <select
            name="type"
            defaultValue={typeFilter}
            className="rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Department filter */}
          <select
            name="department"
            defaultValue={deptFilter}
            className="rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs outline-none focus:border-[#FFB703] focus:ring-1 focus:ring-[#FFB703]"
          >
            <option value="">All teams</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </form>

        {/* Meta line */}
        <div className="mb-4 text-[11px] text-slate-400 flex justify-between items-center gap-3">
          <span>
            Showing <span className="text-slate-100">{showingCount}</span> of{" "}
            <span className="text-slate-100">{totalCount}</span> open roles
          </span>
          <span>Powered by Resourcin ATS</span>
        </div>

        {/* Job list */}
        {filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-10 text-center text-sm text-slate-400">
            No roles match your filters yet. Try clearing filters or check back
            soon.
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredJobs.map((job) => {
              const jobUrl = `${siteUrl}/jobs/${job.slug}`;

              return (
                <li
                  key={job.id}
                  className="group rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4 transition hover:border-[#FFB703] hover:bg-slate-900"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    {/* Left side: title & meta */}
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/jobs/${job.slug}`}
                          className="text-sm font-medium text-slate-50 group-hover:text-white"
                        >
                          {job.title}
                        </Link>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                        {job.department && <span>{job.department}</span>}
                        {job.location && (
                          <>
                            <span>•</span>
                            <span>{job.location}</span>
                          </>
                        )}
                        {job.type && (
                          <>
                            <span>•</span>
                            <span>{job.type}</span>
                          </>
                        )}
                      </div>

                      {job.excerpt && (
                        <p className="mt-2 text-xs text-slate-400">
                          {job.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Right side: CTA + social share */}
                    <div className="mt-3 flex flex-col items-start gap-2 md:mt-0 md:items-end">
                      <Link
                        href={`/jobs/${job.slug}`}
                        className="inline-flex items-center rounded-full bg-[#FFB703] px-4 py-1.5 text-[11px] font-medium text-slate-950 hover:bg-[#ffca3a] transition"
                      >
                        View role
                        <span className="ml-1">→</span>
                      </Link>

                      {/* Social share */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="uppercase tracking-[0.16em] text-slate-500">
                          Share
                        </span>
                        <a
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                            jobUrl
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-slate-100"
                        >
                          LinkedIn
                        </a>
                        <span className="text-slate-600">·</span>
                        <a
                          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                            job.title + " – via Resourcin"
                          )}&url=${encodeURIComponent(jobUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-slate-100"
                        >
                          X (Twitter)
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
