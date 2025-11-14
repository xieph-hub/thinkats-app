// components/JobsListing.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/jobs";

type JobsListingProps = {
  initialJobs: Job[];
};

export default function JobsListing({ initialJobs }: JobsListingProps) {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // Build dropdown options from the data
  const locations = useMemo(() => {
    const set = new Set<string>();
    initialJobs.forEach((job) => set.add(job.location));
    return ["All", ...Array.from(set)];
  }, [initialJobs]);

  const types = useMemo(() => {
    const set = new Set<string>();
    initialJobs.forEach((job) => set.add(job.type));
    return ["All", ...Array.from(set)];
  }, [initialJobs]);

  // Apply filters
  const filteredJobs = useMemo(() => {
    return initialJobs.filter((job) => {
      const matchesSearch =
        search.trim().length === 0 ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.summary.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase());

      const matchesLocation =
        locationFilter === "All" || job.location === locationFilter;

      const matchesType = typeFilter === "All" || job.type === typeFilter;

      return matchesSearch && matchesLocation && matchesType;
    });
  }, [initialJobs, search, locationFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm mb-2">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Search */}
          <div className="flex-1">
            <label
              htmlFor="search"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              Search by role, company, or keywords
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Product Manager, HR, Lagos..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965]"
            />
          </div>

          {/* Location filter */}
          <div className="min-w-[180px]">
            <label
              htmlFor="location"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              Location
            </label>
            <select
              id="location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965] bg-white"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="min-w-[180px]">
            <label
              htmlFor="type"
              className="block text-xs font-medium text-slate-600 mb-1"
            >
              Employment type
            </label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#172965] focus:border-[#172965] bg-white"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Jobs list */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-600 mb-1">
            No roles match your filters yet.
          </p>
          <p className="text-xs text-slate-500">
            Try clearing search or selecting &quot;All&quot; for location and
            employment type.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <article
              key={job.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {job.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {job.company} · {job.department}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {job.location} · {job.type}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/jobs/${job.slug}`}
                    className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    View details
                  </Link>
                  <a
                    href={`mailto:hello@resourcin.com?subject=${encodeURIComponent(
                      `Application: ${job.title}`
                    )}`}
                    className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-xs font-medium text-white hover:bg-[#101c44] transition-colors"
                  >
                    Apply via Email
                  </a>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {job.summary}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
