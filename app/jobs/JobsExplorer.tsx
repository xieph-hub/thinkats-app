"use client";

import React, { useMemo, useState } from "react";
import JobCard, { JobCardData } from "@/components/jobs/JobCard";

export interface JobsExplorerProps {
  jobs: JobCardData[];
}

function uniqueSorted(values: (string | undefined)[]) {
  return Array.from(
    new Set(values.filter((v): v is string => !!v && v.trim().length > 0))
  ).sort((a, b) => a.localeCompare(b));
}

export default function JobsExplorer({ jobs }: JobsExplorerProps) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [type, setType] = useState("");
  const [level, setLevel] = useState("");

  const locations = useMemo(
    () => uniqueSorted(jobs.map((j) => j.location)),
    [jobs]
  );
  const workModes = useMemo(
    () => uniqueSorted(jobs.map((j) => j.workMode)),
    [jobs]
  );
  const types = useMemo(() => uniqueSorted(jobs.map((j) => j.type)), [jobs]);
  const levels = useMemo(
    () => uniqueSorted(jobs.map((j) => j.experienceLevel)),
    [jobs]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return jobs.filter((job) => {
      if (term) {
        const haystack = (
          `${job.title} ${job.company ?? ""} ${job.location ?? ""} ${
            job.department ?? ""
          } ${job.shortDescription ?? ""} ${(job.tags ?? []).join(" ")}`
        ).toLowerCase();

        if (!haystack.includes(term)) return false;
      }

      if (location && job.location !== location) return false;
      if (workMode && job.workMode !== workMode) return false;
      if (type && job.type !== type) return false;
      if (level && job.experienceLevel !== level) return false;

      return true;
    });
  }, [jobs, search, location, workMode, type, level]);

  const countLabel =
    filtered.length === 0
      ? "No roles match your filters yet."
      : filtered.length === 1
      ? "1 role matches your filters."
      : `${filtered.length} roles match your filters.`;

  return (
    <section className="grid gap-8 md:grid-cols-[260px,1fr]">
      {/* Filters sidebar */}
      <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Refine roles
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Narrow down by location, work mode, type, or level.
          </p>
        </div>

        {/* Search */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-600">
            Keyword search
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company, keyword…"
            className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965]"
          />
        </div>

        {/* Location */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-600">
            Location
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
          >
            <option value="">All locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Work mode */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-600">
            Work mode
          </label>
          <select
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value)}
            className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
          >
            <option value="">Any</option>
            {workModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-600">
            Role type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
          >
            <option value="">Any</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Level */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-600">
            Seniority
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#172965]"
          >
            <option value="">Any</option>
            {levels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setLocation("");
            setWorkMode("");
            setType("");
            setLevel("");
          }}
          className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        >
          Clear all filters
        </button>
      </aside>

      {/* Jobs column */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] text-slate-600">{countLabel}</p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
            No open roles currently match those filters. Try clearing a few
            options or checking back soon.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
