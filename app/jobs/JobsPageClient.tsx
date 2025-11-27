// app/jobs/JobsPageClient.tsx
"use client";

import { useMemo, useState } from "react";
import JobCard, { JobCardData } from "@/components/jobs/JobCard";

type JobsPageClientProps = {
  jobs: JobCardData[];
};

type FacetOption = {
  value: string;
  label: string;
  count: number;
};

function buildFacetOptions(
  jobs: JobCardData[],
  key: "location" | "department" | "workMode" | "type" | "experienceLevel"
): FacetOption[] {
  const counts = new Map<string, number>();

  for (const job of jobs) {
    const raw = job[key];
    if (!raw || typeof raw !== "string") continue;
    const value = raw.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });
}

function toggleFilter(current: string[], value: string): string[] {
  if (current.includes(value)) {
    return current.filter((v) => v !== value);
  }
  return [...current, value];
}

function isRemoteOrHybrid(job: JobCardData): boolean {
  const mode = (job.workMode ?? "").toLowerCase();
  return mode.includes("remote") || mode.includes("hybrid");
}

function isLeadershipRole(job: JobCardData): boolean {
  const level = (job.experienceLevel ?? "").toLowerCase();
  const title = (job.title ?? "").toLowerCase();

  if (
    level.includes("director") ||
    level.includes("vp") ||
    level.includes("c_level") ||
    level.includes("c-level") ||
    level.includes("lead") ||
    level.includes("manager_head") ||
    level.includes("manager-head")
  ) {
    return true;
  }

  return (
    title.includes("director") ||
    title.includes("vp") ||
    title.includes("chief") ||
    title.includes("head of") ||
    title.includes("country manager") ||
    title.includes("general manager")
  );
}

export default function JobsPageClient({ jobs }: JobsPageClientProps) {
  const [search, setSearch] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedWorkModes, setSelectedWorkModes] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Quick filter toggles
  const [onlyRemoteHybrid, setOnlyRemoteHybrid] = useState(false);
  const [onlyLeadership, setOnlyLeadership] = useState(false);
  const [onlyConfidential, setOnlyConfidential] = useState(false);
  const [onlyWithSalary, setOnlyWithSalary] = useState(false);

  // Facets (with counts), sorted by usage
  const locationOptions = useMemo(
    () => buildFacetOptions(jobs, "location"),
    [jobs]
  );
  const departmentOptions = useMemo(
    () => buildFacetOptions(jobs, "department"),
    [jobs]
  );
  const workModeOptions = useMemo(
    () => buildFacetOptions(jobs, "workMode"),
    [jobs]
  );
  const levelOptions = useMemo(
    () => buildFacetOptions(jobs, "experienceLevel"),
    [jobs]
  );
  const typeOptions = useMemo(
    () => buildFacetOptions(jobs, "type"),
    [jobs]
  );

  const totalJobs = jobs.length;
  const distinctLocations = locationOptions.length;
  const distinctCompanies = useMemo(() => {
    const set = new Set(
      jobs
        .map((j) => (j.company ?? "").trim())
        .filter((v) => v.length > 0)
    );
    return set.size;
  }, [jobs]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedLocations.length > 0 ||
    selectedDepartments.length > 0 ||
    selectedWorkModes.length > 0 ||
    selectedLevels.length > 0 ||
    selectedTypes.length > 0 ||
    onlyRemoteHybrid ||
    onlyLeadership ||
    onlyConfidential ||
    onlyWithSalary;

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();

    const getTime = (job: JobCardData) => {
      if (!job.postedAt) return 0;
      const t = new Date(job.postedAt).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    let result = [...jobs];

    if (term) {
      result = result.filter((job) => {
        const fields = [
          job.title,
          job.company ?? "",
          job.location ?? "",
          job.department ?? "",
          job.shortDescription ?? "",
          ...(job.tags ?? []),
        ];
        return fields.some((field) =>
          field.toLowerCase().includes(term.toLowerCase())
        );
      });
    }

    if (selectedLocations.length > 0) {
      result = result.filter((job) =>
        selectedLocations.includes((job.location ?? "").trim())
      );
    }

    if (selectedDepartments.length > 0) {
      result = result.filter((job) =>
        selectedDepartments.includes((job.department ?? "").trim())
      );
    }

    if (selectedWorkModes.length > 0) {
      result = result.filter((job) =>
        selectedWorkModes.includes((job.workMode ?? "").trim())
      );
    }

    if (selectedLevels.length > 0) {
      result = result.filter((job) =>
        selectedLevels.includes((job.experienceLevel ?? "").trim())
      );
    }

    if (selectedTypes.length > 0) {
      result = result.filter((job) =>
        selectedTypes.includes((job.type ?? "").trim())
      );
    }

    // Quick filters
    if (onlyRemoteHybrid) {
      result = result.filter((job) => isRemoteOrHybrid(job));
    }

    if (onlyLeadership) {
      result = result.filter((job) => isLeadershipRole(job));
    }

    if (onlyConfidential) {
      result = result.filter((job) => job.isConfidential === true);
    }

    if (onlyWithSalary) {
      result = result.filter(
        (job) => (job.salary ?? "").toString().trim().length > 0
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
    selectedWorkModes,
    selectedLevels,
    selectedTypes,
    sortOrder,
    onlyRemoteHybrid,
    onlyLeadership,
    onlyConfidential,
    onlyWithSalary,
  ]);

  const clearAllFilters = () => {
    setSearch("");
    setSelectedLocations([]);
    setSelectedDepartments([]);
    setSelectedWorkModes([]);
    setSelectedLevels([]);
    setSelectedTypes([]);
    setOnlyRemoteHybrid(false);
    setOnlyLeadership(false);
    setOnlyConfidential(false);
    setOnlyWithSalary(false);
    setSortOrder("newest");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero + search */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Roles managed by Resourcin
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Open roles
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600">
                A curated pipeline of leadership, specialist and critical roles.
                Apply directly, or share with someone who should be in the
                conversation.
              </p>
            </div>
            <div className="flex gap-4 text-xs text-slate-600">
              <StatChip label="Open roles" value={totalJobs} />
              <StatChip label="Locations" value={distinctLocations} />
              <StatChip label="Hiring companies" value={distinctCompanies} />
            </div>
          </div>

          <div className="mt-8 max-w-3xl">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-3 py-2.5 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
                🔍
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, company, location or keyword…"
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {search.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-xs text-slate-500 hover:text-slate-800"
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
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-700">
            No open roles are visible yet. Once you publish roles in the ATS,
            they will appear here automatically.
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[260px,1fr]">
            {/* Filter sidebar */}
            <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="text-[11px] font-medium text-[#172965] hover:underline"
                    onClick={clearAllFilters}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Quick smart filters */}
              <div className="space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Quick filters
                </div>
                <div className="flex flex-wrap gap-2">
                  <QuickFilterChip
                    label="Remote / hybrid only"
                    active={onlyRemoteHybrid}
                    onClick={() =>
                      setOnlyRemoteHybrid((prev) => !prev)
                    }
                  />
                  <QuickFilterChip
                    label="Leadership roles"
                    active={onlyLeadership}
                    onClick={() => setOnlyLeadership((prev) => !prev)}
                  />
                  <QuickFilterChip
                    label="Confidential searches"
                    active={onlyConfidential}
                    onClick={() =>
                      setOnlyConfidential((prev) => !prev)
                    }
                  />
                  <QuickFilterChip
                    label="With salary range"
                    active={onlyWithSalary}
                    onClick={() => setOnlyWithSalary((prev) => !prev)}
                  />
                </div>
              </div>

              {/* Faceted filters – only show groups with >1 distinct value */}
              {locationOptions.length > 1 && (
                <FilterGroup
                  label="Location"
                  options={locationOptions}
                  selected={selectedLocations}
                  onToggle={(value) =>
                    setSelectedLocations((prev) => toggleFilter(prev, value))
                  }
                />
              )}

              {departmentOptions.length > 1 && (
                <FilterGroup
                  label="Team / Function"
                  options={departmentOptions}
                  selected={selectedDepartments}
                  onToggle={(value) =>
                    setSelectedDepartments((prev) => toggleFilter(prev, value))
                  }
                />
              )}

              {workModeOptions.length > 1 && (
                <FilterGroup
                  label="Work mode"
                  options={workModeOptions}
                  selected={selectedWorkModes}
                  onToggle={(value) =>
                    setSelectedWorkModes((prev) => toggleFilter(prev, value))
                  }
                />
              )}

              {levelOptions.length > 1 && (
                <FilterGroup
                  label="Role level"
                  options={levelOptions}
                  selected={selectedLevels}
                  onToggle={(value) =>
                    setSelectedLevels((prev) => toggleFilter(prev, value))
                  }
                />
              )}

              {typeOptions.length > 1 && (
                <FilterGroup
                  label="Employment type"
                  options={typeOptions}
                  selected={selectedTypes}
                  onToggle={(value) =>
                    setSelectedTypes((prev) => toggleFilter(prev, value))
                  }
                />
              )}
            </aside>

            {/* Results */}
            <div className="space-y-4">
              {/* Summary + sort + active filter hint */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">
                  {filteredJobs.length === 0 ? (
                    <>No roles match the current filters.</>
                  ) : (
                    <>
                      Showing{" "}
                      <span className="font-semibold text-slate-900">
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
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Sort by</span>
                  <select
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value as "newest" | "oldest")
                    }
                    className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#172965]"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>
              </div>

              {/* Job list or empty state */}
              {filteredJobs.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-700">
                  <p>No roles match these filters yet.</p>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-3 text-xs font-medium text-[#172965] hover:underline"
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
        )}
      </section>
    </main>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[90px] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function QuickFilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1.5 text-[11px] font-medium transition",
        active
          ? "border-[#172965] bg-[#172965]/5 text-[#172965]"
          : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const maxVisible = 6;

  if (options.length === 0) return null;

  const visibleOptions = expanded
    ? options
    : options.slice(0, maxVisible);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
          {label}
        </div>
        {options.length > maxVisible && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-[10px] font-medium text-slate-500 hover:text-slate-800"
          >
            {expanded ? "Show less" : "Show all"}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {visibleOptions.map((opt) => {
          const isActive = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={[
                "rounded-full border px-3 py-1 text-[11px] transition",
                isActive
                  ? "border-[#172965] bg-[#172965]/5 text-[#172965]"
                  : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400",
              ].join(" ")}
            >
              <span>{opt.label}</span>
              <span className="ml-1.5 text-[10px] text-slate-500">
                · {opt.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
