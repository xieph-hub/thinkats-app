// app/jobs/JobsExplorer.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import JobCardGrid from "@/components/jobs/JobCardGrid";
import type { JobCardData } from "@/components/jobs/JobCard";

type Props = {
  jobs: JobCardData[];
};

const JobsExplorer: React.FC<Props> = ({ jobs }) => {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [seniorityFilter, setSeniorityFilter] = useState<string>("all");
  const [workModeFilter, setWorkModeFilter] = useState<string>("all");

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    for (const job of jobs) {
      if (job.location) set.add(job.location);
    }
    return Array.from(set).sort();
  }, [jobs]);

  const seniorityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const job of jobs) {
      if (job.experienceLevel) set.add(job.experienceLevel);
    }
    return Array.from(set).sort();
  }, [jobs]);

  const workModeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const job of jobs) {
      if (job.workMode) set.add(job.workMode);
    }
    return Array.from(set).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const q = search.trim().toLowerCase();

      if (q) {
        const haystack = [
          job.title,
          job.company,
          job.location,
          job.department,
          job.shortDescription,
          ...(job.tags ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) {
          return false;
        }
      }

      if (
        locationFilter !== "all" &&
        (job.location ?? "").toLowerCase() !== locationFilter.toLowerCase()
      ) {
        return false;
      }

      if (
        seniorityFilter !== "all" &&
        (job.experienceLevel ?? "").toLowerCase() !==
          seniorityFilter.toLowerCase()
      ) {
        return false;
      }

      if (
        workModeFilter !== "all" &&
        (job.workMode ?? "").toLowerCase() !== workModeFilter.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [jobs, search, locationFilter, seniorityFilter, workModeFilter]);

  return (
    <div className="grid gap-8 md:grid-cols-[260px,1fr]">
      {/* Sidebar filters */}
      <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Filters
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Narrow roles by keyword, location, seniority and work mode.
          </p>
        </div>

        {/* Search */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">
            Search roles
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Head of Sales, Lagos"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-[#172965] focus:ring-2 focus:ring-[#172965]/10"
          />
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">
            Location
          </label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-[#172965] focus:ring-2 focus:ring-[#172965]/10"
          >
            <option value="all">All locations</option>
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Seniority */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">
            Seniority
          </label>
          <select
            value={seniorityFilter}
            onChange={(e) => setSeniorityFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-[#172965] focus:ring-2 focus:ring-[#172965]/10"
          >
            <option value="all">All levels</option>
            {seniorityOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Work mode */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">
            Work mode
          </label>
          <select
            value={workModeFilter}
            onChange={(e) => setWorkModeFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-[#172965] focus:ring-2 focus:ring-[#172965]/10"
          >
            <option value="all">Any</option>
            {workModeOptions.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setLocationFilter("all");
            setSeniorityFilter("all");
            setWorkModeFilter("all");
          }}
          className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Clear all filters
        </button>
      </aside>

      {/* Jobs grid – no count text, filters just work */}
      <section className="space-y-3">
        <JobCardGrid
          jobs={filteredJobs}
          onOpenJob={(job) => {
            const url = job.shareUrl || `/jobs/${job.id}`;
            router.push(url);
          }}
          onApply={(job) => {
            const url = (job.shareUrl || `/jobs/${job.id}`) + "#apply";
            router.push(url);
          }}
        />
      </section>
    </div>
  );
};

export default JobsExplorer;
