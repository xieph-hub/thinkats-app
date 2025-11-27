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

function humanizeToken(value: string): string {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(
      (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(" ");
}

function formatLevelLabel(value: string): string {
  const map: Record<string, string> = {
    entry: "Entry level / Graduate",
    junior: "Junior (1–3 years)",
    mid: "Mid-level (3–7 years)",
    senior: "Senior (7–12 years)",
    lead_principal: "Lead / Principal",
    "lead-principal": "Lead / Principal",
    manager_head: "Manager / Head of",
    "manager-head": "Manager / Head of",
    director_vp: "Director / VP",
    "director-vp": "Director / VP",
    c_level_partner: "C-level / Partner",
    "c-level-partner": "C-level / Partner",
  };

  return map[value] ?? humanizeToken(value);
}

function buildFacetOptions(
  jobs: JobCardData[],
  key: "location" | "department" | "workMode" | "type" | "experienceLevel",
  labelFormatter?: (value: string) => string
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
    .map(([value, count]) => ({
      value,
      label: labelFormatter ? labelFormatter(value) : value,
      count,
    }))
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

// --- Quick filter helpers ---------------------------------------------------

function isLeadershipExecutive(job: JobCardData): boolean {
  const level = (job.experienceLevel ?? "").toLowerCase();
  const title = (job.title ?? "").toLowerCase();

  if (
    level.includes("senior") ||
    level.includes("lead") ||
    level.includes("principal") ||
    level.includes("manager_head") ||
    level.includes("manager-head") ||
    level.includes("director") ||
    level.includes("vp") ||
    level.includes("c_level") ||
    level.includes("c-level")
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

function isProductTechnology(job: JobCardData): boolean {
  const dept = (job.department ?? "").toLowerCase();
  const title = (job.title ?? "").toLowerCase();

  if (
    dept.includes("software") ||
    dept.includes("engineering") ||
    dept.includes("product") ||
    dept.includes("data") ||
    dept.includes("devops") ||
    dept.includes("cloud") ||
    dept.includes("qa") ||
    dept.includes("it_support") ||
    dept.includes("cybersecurity")
  ) {
    return true;
  }

  return (
    title.includes("engineer") ||
    title.includes("developer") ||
    title.includes("product manager") ||
    title.includes("data scientist") ||
    title.includes("data analyst") ||
    title.includes("devops") ||
    title.includes("site reliability") ||
    title.includes("sre")
  );
}

function isSalesMarketingGrowth(job: JobCardData): boolean {
  const dept = (job.department ?? "").toLowerCase();
  const title = (job.title ?? "").toLowerCase();

  if (
    dept.includes("sales_business_development") ||
    dept.includes("account_management") ||
    dept.includes("growth_marketing") ||
    dept.includes("brand_marketing") ||
    dept.includes("product_marketing") ||
    dept.includes("partnerships")
  ) {
    return true;
  }

  return (
    title.includes("sales") ||
    title.includes("business development") ||
    title.includes("bd manager") ||
    title.includes("growth") ||
    title.includes("marketing") ||
    title.includes("partnerships") ||
    title.includes("account manager") ||
    title.includes("relationship manager")
  );
}

type WorkModeQuick = "onsite" | "remote" | "hybrid" | null;

export default function JobsPageClient({ jobs }: JobsPageClientProps) {
  const [search, setSearch] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedWorkModes, setSelectedWorkModes] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Quick filters
  const [onlyLeadershipExecutive, setOnlyLeadershipExecutive] = useState(false);
  const [onlyProductTechnology, setOnlyProductTechnology] = useState(false);
  const [onlySalesMarketingGrowth, setOnlySalesMarketingGrowth] =
    useState(false);
  const [workModeQuick, setWorkModeQuick] = useState<WorkModeQuick>(null);

  // Facets with humanised labels
  const locationOptions = useMemo(
    () => buildFacetOptions(jobs, "location"),
    [jobs]
  );
  const departmentOptions = useMemo(
    () => buildFacetOptions(jobs, "department", humanizeToken),
    [jobs]
  );
  const workModeOptions = useMemo(
    () => buildFacetOptions(jobs, "workMode", humanizeToken),
    [jobs]
  );
  const levelOptions = useMemo(
    () => buildFacetOptions(jobs, "experienceLevel", formatLevelLabel),
    [jobs]
  );
  const typeOptions = useMemo(
    () => buildFacetOptions(jobs, "type", humanizeToken),
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
    onlyLeadershipExecutive ||
    onlyProductTechnology ||
    onlySalesMarketingGrowth ||
    workModeQuick !== null;

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

    // Quick filters – broad global families
    if (onlyLeadershipExecutive) {
      result = result.filter((job) => isLeadershipExecutive(job));
    }

    if (onlyProductTechnology) {
      result = result.filter((job) => isProductTechnology(job));
    }

    if (onlySalesMarketingGrowth) {
      result = result.filter((job) => isSalesMarketingGrowth(job));
    }

    if (workModeQuick) {
      result = result.filter((job) => {
        const mode = (job.workMode ?? "").toLowerCase();
        if (!mode) return false;
        return mode.includes(workModeQuick);
      });
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
    onlyLeadershipExecutive,
    onlyProductTechnology,
    onlySalesMarketingGrowth,
    workModeQuick,
  ]);

  const clearAllFilters = () => {
    setSearch("");
    setSelectedLocations([]);
    setSelectedDepartments([]);
    setSelectedWorkModes([]);
    setSelectedLevels([]);
    setSelectedTypes([]);
    setOnlyLeadershipExecutive(false);
    setOnlyProductTechnology(false);
    setOnlySalesMarketingGrowth(false);
    setWorkModeQuick(null);
    setSortOrder("newest");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero + search */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-[#172965]/3">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#64C247]/10 px-3 py-1 text-[11px] font-medium text-[#306B34]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                Roles managed by Resourcin
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#172965] sm:text-4xl">
                Open roles
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-600">
                A global mix of leadership, specialist and critical roles across
                sectors. Apply directly, or share with someone who should be in
                the conversation.
              </p>
            </div>
            <div className="flex gap-4 text-xs text-slate-600">
              <StatChip label="Open roles" value={totalJobs} />
              <StatChip label="Locations" value={distinctLocations} />
              <StatChip label="Hiring companies" value={distinctCompanies} />
            </div>
          </div>

          <div className="mt-8 max-w-3xl">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172965]/5 text-xs text-[#172965]">
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
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Try &quot;Country Manager&quot;, &quot;Nairobi&quot; or
              &quot;Finance&quot;.
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
            <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                    label="Leadership & Executive"
                    active={onlyLeadershipExecutive}
                    onClick={() =>
                      setOnlyLeadershipExecutive((prev) => !prev)
                    }
                  />
                  <QuickFilterChip
                    label="Product & Technology"
                    active={onlyProductTechnology}
                    onClick={() =>
                      setOnlyProductTechnology((prev) => !prev)
                    }
                  />
                  <QuickFilterChip
                    label="Sales, Marketing & Growth"
                    active={onlySalesMarketingGrowth}
                    onClick={() =>
                      setOnlySalesMarketingGrowth((prev) => !prev)
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <QuickFilterChip
                    label="Onsite"
                    active={workModeQuick === "onsite"}
                    onClick={() =>
                      setWorkModeQuick((prev) =>
                        prev === "onsite" ? null : "onsite"
                      )
                    }
                  />
                  <QuickFilterChip
                    label="Remote"
                    active={workModeQuick === "remote"}
                    onClick={() =>
                      setWorkModeQuick((prev) =>
                        prev === "remote" ? null : "remote"
                      )
                    }
                  />
                  <QuickFilterChip
                    label="Hybrid"
                    active={workModeQuick === "hybrid"}
                    onClick={() =>
                      setWorkModeQuick((prev) =>
                        prev === "hybrid" ? null : "hybrid"
                      )
                    }
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
                  label="Work pattern"
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
                      <span className="font-semibold text-[#172965]">
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
                </di
