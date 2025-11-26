// app/jobs/JobsExplorer.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { JobCardData } from "@/components/jobs/JobCard";
import { JobCardGrid } from "@/components/jobs/JobCardGrid";

type Props = {
  jobs: JobCardData[];
};

type WorkModeFilter = "all" | "remote" | "hybrid" | "onsite" | "flexible";
type ExperienceFilter = "all" | "junior" | "mid" | "senior" | "lead" | "director";

export default function JobsExplorer({ jobs }: Props) {
  const router = useRouter();

  // --------- UI state ----------
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState<WorkModeFilter>("all");
  const [experience, setExperience] = useState<ExperienceFilter>("all");
  const [onlyConfidential, setOnlyConfidential] = useState(false);

  // --------- Filtering ----------
  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const locQ = location.trim().toLowerCase();

    return jobs.filter((job) => {
      // global search: title, company, tags, department
      if (q) {
        const haystack = [
          job.title,
          job.company ?? "",
          job.location ?? "",
          job.department ?? "",
          (job.tags ?? []).join(" "),
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      // location filter
      if (locQ) {
        const jobLoc = (job.location ?? "").toLowerCase();
        if (!jobLoc.includes(locQ)) return false;
      }

      // work mode filter
      if (workMode !== "all") {
        const wm = (job.workMode ?? "").toLowerCase();
        if (wm !== workMode) return false;
      }

      // experience filter (loosely matched on text)
      if (experience !== "all") {
        const exp = (job.experienceLevel ?? "").toLowerCase();
        if (!exp.includes(experience)) return false;
      }

      // confidential-only toggle
      if (onlyConfidential && !job.isConfidential) {
        return false;
      }

      return true;
    });
  }, [jobs, search, location, workMode, experience, onlyConfidential]);

  const totalCount = jobs.length;
  const filteredCount = filteredJobs.length;
  const remoteCount = jobs.filter(
    (j) => (j.workMode ?? "").toLowerCase() === "remote"
  ).length;

  // ---------- UI helpers ----------
  const filterPillBase =
    "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium border transition-colors";

  const activePill =
    "border-[#172965] bg-[#172965] text-white shadow-sm"; // Resourcin blue
  const inactivePill =
    "border-slate-200 bg-white text-slate-600 hover:border-slate-300";

  return (
    <div className="grid gap-8 md:grid-cols-[260px,1fr]">
      {/* Sidebar filters */}
      <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Filter
          </p>
          <h2 className="mt-1 text-sm font-semibold text-slate-900">
            Narrow your search
          </h2>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">
            Keyword
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, company, tags…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/50"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">
            Location
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Lagos, Nairobi, Remote"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/50"
          />
        </div>

        {/* Work mode */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">
            Work mode
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "all", label: "Any" },
                { value: "remote", label: "Remote" },
                { value: "hybrid", label: "Hybrid" },
                { value: "onsite", label: "On-site" },
                { value: "flexible", label: "Flexible" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setWorkMode(opt.value)}
                className={`${filterPillBase} ${
                  workMode === opt.value ? activePill : inactivePill
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">
            Seniority
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "all", label: "Any" },
                { value: "junior", label: "Junior" },
                { value: "mid", label: "Mid-level" },
                { value: "senior", label: "Senior" },
                { value: "lead", label: "Lead" },
                { value: "director", label: "Director+" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setExperience(opt.value)}
                className={`${filterPillBase} ${
                  experience === opt.value ? activePill : inactivePill
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Confidential toggle */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
              checked={onlyConfidential}
              onChange={(e) => setOnlyConfidential(e.target.checked)}
            />
            Show only{" "}
            <span className="font-semibold text-slate-900">
              confidential searches
            </span>
          </label>
          <p className="text-[11px] text-slate-500">
            Useful when you&apos;re looking at executive or sensitive mandates.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
              Total roles
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {totalCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
              Remote
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {remoteCount}
            </p>
          </div>
        </div>
      </aside>

      {/* Main results */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "#172965" }}
            >
              Live mandates
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {filteredCount}{" "}
              <span className="font-normal text-slate-600">
                role{filteredCount === 1 ? "" : "s"} matching your filters
              </span>
            </h2>
            {search && (
              <p className="mt-1 text-xs text-slate-500">
                Showing results for <span className="font-semibold">{search}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setLocation("");
              setWorkMode("all");
              setExperience("all");
              setOnlyConfidential(false);
            }}
            clas
