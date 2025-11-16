"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Briefcase, Clock, Tag, Filter, Share2, MessageCircle } from "lucide-react";
import { SITE_URL } from "@/lib/site";

type JobLite = {
  slug: string;
  title: string;
  summary: string;
  location?: string | null;
  employerName?: string | null;
  jobFunction?: string | null;
  seniority?: string | null;
  workType?: string | null; // On-site / Hybrid / Remote
  tags?: string[] | null;
  salaryCurrency?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
};

type JobsListingProps = {
  jobs: JobLite[];
  tenantId?: string; // for future multi-tenant SaaS board wiring
};

function buildShareUrls(job: JobLite) {
  const jobUrl = `${SITE_URL}/jobs/${job.slug}?utm_source=share&utm_medium=organic&utm_campaign=job_board`;
  const text = encodeURIComponent(`${job.title} — via Resourcin`);
  const encodedUrl = encodeURIComponent(jobUrl);

  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const twitter = `https://x.com/intent/tweet?text=${text}&url=${encodedUrl}`;
  const whatsapp = `https://wa.me/?text=${text}%0A${encodedUrl}`;

  return { linkedin, twitter, whatsapp, jobUrl };
}

export default function JobsListing({ jobs }: JobsListingProps) {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("All");
  const [functionFilter, setFunctionFilter] = useState<string>("All");
  const [seniorityFilter, setSeniorityFilter] = useState<string>("All");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const { locations, functions, seniorities, allTags } = useMemo(() => {
    const locSet = new Set<string>();
    const fnSet = new Set<string>();
    const senSet = new Set<string>();
    const tagSet = new Set<string>();

    for (const job of jobs) {
      if (job.location) locSet.add(job.location);
      if (job.jobFunction) fnSet.add(job.jobFunction);
      if (job.seniority) senSet.add(job.seniority);
      if (job.tags) {
        for (const t of job.tags) tagSet.add(t);
      }
    }

    return {
      locations: ["All", ...Array.from(locSet).sort()],
      functions: ["All", ...Array.from(fnSet).sort()],
      seniorities: ["All", ...Array.from(senSet).sort()],
      allTags: Array.from(tagSet).sort(),
    };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const s = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !s ||
        job.title.toLowerCase().includes(s) ||
        job.summary.toLowerCase().includes(s) ||
        (job.employerName ?? "").toLowerCase().includes(s);

      const matchesLocation =
        locationFilter === "All" || job.location === locationFilter;

      const matchesFunction =
        functionFilter === "All" || job.jobFunction === functionFilter;

      const matchesSeniority =
        seniorityFilter === "All" || job.seniority === seniorityFilter;

      const matchesTag =
        !tagFilter || (job.tags ?? []).includes(tagFilter);

      return matchesSearch && matchesLocation && matchesFunction && matchesSeniority && matchesTag;
    });
  }, [jobs, search, locationFilter, functionFilter, seniorityFilter, tagFilter]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header + search / filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Open roles
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Curated opportunities from growth-focused employers. Filter by location,
            function, and seniority — then join the Talent Network to stay in the loop.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role, company, or keyword"
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 pr-9 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:w-72"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Filter className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        <span className="mr-1 text-[11px] uppercase tracking-wide text-slate-500">
          Filters:
        </span>

        {/* Location */}
        {locations.map((loc) => (
          <button
            key={`loc-${loc}`}
            onClick={() => setLocationFilter(loc)}
            className={`rounded-full border px-3 py-1 transition-colors ${
              locationFilter === loc
                ? "border-sky-500 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {loc === "All" ? "All locations" : loc}
          </button>
        ))}

        {/* Function */}
        {functions.map((fn) => (
          <button
            key={`fn-${fn}`}
            onClick={() => setFunctionFilter(fn)}
            className={`rounded-full border px-3 py-1 transition-colors ${
              functionFilter === fn
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {fn === "All" ? "All functions" : fn}
          </button>
        ))}

        {/* Seniority */}
        {seniorities.map((sen) => (
          <button
            key={`sen-${sen}`}
            onClick={() => setSeniorityFilter(sen)}
            className={`rounded-full border px-3 py-1 transition-colors ${
              seniorityFilter === sen
                ? "border-violet-500 bg-violet-50 text-violet-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {sen === "All" ? "All levels" : sen}
          </button>
        ))}
      </div>

      {/* Tag chips row */}
      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Tag className="h-3 w-3" />
            Tags
          </span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter((prev) => (prev === tag ? null : tag))}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                tagFilter === tag
                  ? "border-amber-500 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mb-4 text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-800">{filteredJobs.length}</span>{" "}
        role{filteredJobs.length === 1 ? "" : "s"}{" "}
        {locationFilter !== "All" && (
          <>
            in <span className="font-medium">{locationFilter}</span>
          </>
        )}
        {functionFilter !== "All" && (
          <>
            {" "}
            · function: <span className="font-medium">{functionFilter}</span>
          </>
        )}
        {seniorityFilter !== "All" && (
          <>
            {" "}
            · level: <span className="font-medium">{seniorityFilter}</span>
          </>
        )}
        {tagFilter && (
          <>
            {" "}
            · tag: <span className="font-medium">{tagFilter}</span>
          </>
        )}
      </div>

      {/* Jobs grid */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          No roles match your filters yet. Try clearing some filters or{" "}
          <Link
            href="/talent-network"
            className="font-medium text-sky-700 underline-offset-2 hover:underline"
          >
            join the Talent Network
          </Link>{" "}
          so we can flag relevant roles as they go live.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job) => {
            const {
              linkedin,
              twitter,
              whatsapp,
              jobUrl,
            } = buildShareUrls(job);

            return (
              <article
                key={job.slug}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-700">
                        {job.jobFunction ?? "General"}
                      </span>
                      {job.seniority && (
                        <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-600">
                          {job.seniority}
                        </span>
                      )}
                      {job.workType && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] text-emerald-700">
                          {job.workType}
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                      <Link href={`/jobs/${job.slug}`} className="hover:underline">
                        {job.title}
                      </Link>
                    </h2>

                    <p className="mt-1 text-xs font-medium text-slate-600">
                      {job.employerName ?? "Confidential employer"}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      {job.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-red-500" />
                          {job.location}
                        </span>
                      )}
                      {job.workType && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {job.workType}
                        </span>
                      )}
                      {job.seniority && (
                        <span className="inline-flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-amber-700" />
                          {job.seniority}
                        </span>
                      )}
                      {job.salaryCurrency && (job.salaryMin || job.salaryMax) && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-400">•</span>
                          {job.salaryCurrency}{" "}
                          {job.salaryMin?.toLocaleString() ?? ""}{" "}
                          {job.salaryMax ? `– ${job.salaryMax.toLocaleString()}` : ""}
                          {" / month"}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                      {job.summary}
                    </p>

                    {job.tags && job.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {job.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-600"
                          >
                            <Tag className="mr-1 h-3 w-3 text-slate-400" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Share2 className="h-3.5 w-3.5 text-slate-400" />
                        Share:
                      </span>
                      <a
                        href={linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] hover:border-sky-500 hover:text-sky-700"
                      >
                        LinkedIn
                      </a>
                      <a
                        href={twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] hover:border-slate-800 hover:text-slate-800"
                      >
                        X
                      </a>
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] hover:border-emerald-500 hover:text-emerald-700"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        WhatsApp
                      </a>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/jobs/${job.slug}`}
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
                      >
                        View role details
                      </Link>
                      <Link
                        href={`/jobs/${job.slug}#apply`}
                        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:border-slate-400"
                      >
                        I&apos;m interested
                      </Link>
                      <a
                        href={jobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 underline-offset-2 hover:underline"
                      >
                        Open sharable link
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* SaaS board note (conceptual; no UI impact) */}
      {/* In multi-tenant mode, this same component would receive jobs already filtered by tenantId
          and styled via a tenant config (colors, logo, copy). */}
    </section>
  );
}
