// app/jobs/JobsPageClient.tsx
"use client";

import { useMemo, useState } from "react";
import JobCard, { JobCardData } from "@/components/jobs/JobCard";

type JobsPageClientProps = {
  jobs: JobCardData[];
};

type FilterOption = {
  label: string;
  value: string;
};

function createOptions(values: (string | null)[]): FilterOption[] {
  const set = new Set<string>();
  for (const v of values) {
    const value = (v ?? "").trim();
    if (value) set.add(value);
  }
  return Array.from(set)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

function toggleFilter(current: string[], value: string): string[] {
  if (current.includes(value)) {
    return current.filter((v) => v !== value);
  }
  return [...current, value];
}

export default function JobsPageClient({ jobs }: JobsPageClientProps) {
  const [search, setSearch] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedLocationTypes, setSelectedLocationTypes] = useState<string[]>(
    []
  );
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<
    string[]
  >([]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const locationOptions = useMemo(
    () => createOptions(jobs.map((j) => j.location)),
    [jobs]
  );
  const departmentOptions = useMemo(
    () => createOptions(jobs.map((j) => j.department)),
    [jobs]
  );
  const locationTypeOptions = useMemo(
    () => createOptions(jobs.map((j) => j.locationType)),
    [jobs]
  );
  const employmentTypeOptions = useMemo(
    () => createOptions(jobs.map((j) => j.employmentType)),
    [jobs]
  );

  const totalJobs = jobs.length;
  const distinctLocations = locationOptions.length;
  const distinctCompanies = useMemo(() => {
    const set = new Set(
      jobs
        .map((j) => (j.clientName ?? "").trim())
        .filter((v) => v.length > 0)
    );
    return set.size;
  }, [jobs]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedLocations.length > 0 ||
    selectedDepartments.length > 0 ||
    selectedLocationTypes.length > 0 ||
    selectedEmploymentTypes.length > 0;

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();

    const getTime = (job: JobCardData) => {
      if (!job.createdAt) return 0;
      const t = new Date(job.createdAt).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    let result = [...jobs];

    if (term) {
      result = result.filter((job) => {
        const fields = [
          job.title,
          job.clientName ?? "",
          job.location ?? "",
          job.department ?? "",
          job.shortDescription ?? "",
        ];
        return fields.some((field) =>
          field.toLowerCase().includes(term.toLowerCase())
        );
      });
    }

    if (selectedLocations.length > 0) {
      result = result.filter((job) =>
        selectedLocations.includes(job.location ?? "")
      );
    }

    if (selectedDepartments.length > 0) {
      result = result.filter((job) =>
        selectedDepartments.includes(job.department ?? "")
      );
    }

    if (selectedLocationTypes.length > 0) {
      result = result.filter((job) =>
        selectedLocationTypes.includes(job.locationType ?? "")
      );
    }

    if (selectedEmploymentTypes.length > 0) {
      result = result.filter((job) =>
        selectedEmploymentTypes.includes(job.employmentType ?? "")
      );
    }

    result.sort((a, b) => {
      const ta = getTime(a);
      const tb = getTime(b);
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });

    return result;
  }, [
    jobs,
    search,
    selectedLocations,
    selectedDepartments,
    selectedLocationTypes,
    selectedEmploymentTypes,
    sortOrder,
  ]);

  const clearAllFilters = () => {
    setSearch("");
    setSelectedLocations([]);
    setSelectedDepartments([]);
    setSelectedLocationTypes([]);
    setSelectedEmploymentTypes([]);
    setSortOrder("newest");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Hero + search */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
                Roles managed by Resourcin
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Open roles
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                A curated pipeline of leadership, specialist and critical roles.
                Apply directly, or share with someone who should be in the
                conversation.
              </p>
            </div>
            <div className="flex gap-4 text-xs text-slate-300">
              <StatChip label="Open roles" value={totalJobs} />
              <StatChip label="Locations" value={distinctLocations} />
              <StatChip label="Hiring companies" value={distinctCompanies} />
            </div>
          </div>

          <div className="mt-8 max-w-3xl">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/60 px-3 py-2.5 shadow-sm shadow-slate-950/60">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 text-xs text-slate-400">
                🔍
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, company, location or keyword…"
                className="flex-1 bg-transparent text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none"
              />
              {search.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Tip: try &quot;Product Manager&quot;, &quot;Kenya&quot; or a
              company name.
            </p>
          </div>
        </div>
      </section>

      {/* Filters + results */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[260px,1fr]">
          {/* Filters */}
          <aside className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Filters
              </h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="text-[11px] text-emerald-300 hover:text-emerald-200"
                  onClick={clearAllFilters}
                >
                  Clear all
                </button>
              )}
            </div>

            <FilterGroup
              label="Location"
              options={locationOptions}
              selected={selectedLocations}
              onToggle={(value) =>
                setSelectedLocations((prev) => toggleFilter(prev, value))
              }
            />

            <FilterGroup
              label="Team / Function"
              options={departmentOptions}
              selected={selectedDepartments}
              onToggle={(value) =>
                setSelectedDepartments((prev) => toggleFilter(prev, value))
              }
            />

            <FilterGroup
              label="Work style"
              options={locationTypeOptions}
              selected={selectedLocationTypes}
              onToggle={(value) =>
                setSelectedLocationTypes((prev) => toggleFilter(prev, value))
              }
            />

            <FilterGroup
              label="Employment type"
              options={employmentTypeOptions}
              selected={selectedEmploymentTypes}
              onToggle={(value) =>
                setSelectedEmploymentTypes((prev) => toggleFilter(prev, value))
              }
            />
          </aside>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-300">
                {filteredJobs.length === 0 ? (
                  <>No roles match the current filters.</>
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-medium text-emerald-300">
                      {filteredJobs.length}
                    </span>{" "}
                    role{filteredJobs.length === 1 ? "" : "s"}
                    {hasActiveFilters && (
                      <span className="text-slate-500">
                        {" "}
                        · filters applied
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Sort by</span>
                <select
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value as "newest" | "oldest")
                  }
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-300">
                <p>No roles match these filters yet.</p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-3 text-xs font-medium text-emerald-300 hover:text-emerald-200"
                >
                  Reset filters and show all roles
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[90px] rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-left">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-50">{value}</div>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={[
                "rounded-full border px-3 py-1 text-[11px] transition",
                isActive
                  ? "border-emerald-400/80 bg-emerald-400/10 text-emerald-200"
                  : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
