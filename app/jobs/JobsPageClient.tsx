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

// ---------------------------------------------------------------------------
// Global job family mapping for department enums
// ---------------------------------------------------------------------------

const leadershipDept = new Set([
  "executive_leadership",
  "general_management",
  "strategy_corporate_dev",
  "project_program_management",
  "operations_management",
]);

const productTechDept = new Set([
  "product_management",
  "product_ownership",
  "ux_ui_design",
  "service_design",
  "research_insights",
  "software_engineering",
  "data_science_ml",
  "data_analytics",
  "devops_platform",
  "cloud_infrastructure",
  "it_support",
  "cybersecurity",
  "qa_testing",
  "edtech_product_ops",
]);

const salesMktGrowthDept = new Set([
  "sales_business_development",
  "account_management_cs",
  "partnerships_alliances",
  "revenue_operations",
  "pre_sales_solutions",
  "growth_marketing",
  "brand_marketing",
  "product_marketing",
  "content_social_media",
  "pr_corporate_comms",
]);

const peopleTalentDept = new Set([
  "people_hr",
  "talent_acquisition",
  "people_operations",
  "learning_development",
  "compensation_benefits",
]);

const financeRiskLegalDept = new Set([
  "finance_accounting",
  "financial_planning_analysis",
  "audit_control",
  "risk_compliance",
  "legal_corporate_secretariat",
  "treasury_investments",
]);

const opsSupplyChainDept = new Set([
  "business_operations",
  "supply_chain_procurement",
  "logistics_fulfilment",
  "manufacturing_production",
  "quality_assurance_ops",
]);

const realEstateDept = new Set([
  "real_estate_investments",
  "real_estate_development",
  "estate_agency_leasing",
  "property_facilities_management",
  "valuation_asset_management",
]);

const customerSupportDept = new Set([
  "customer_support",
  "contact_centre_bpo",
  "service_delivery",
]);

const creativeMediaDept = new Set([
  "creative_direction",
  "graphic_motion_design",
  "video_photo_content",
  "copywriting_editing",
]);

const healthcareDept = new Set([
  "clinical_medical",
  "nursing_allied_health",
  "public_health",
  "pharmaceutical_biotech",
]);

const educationDept = new Set([
  "teaching_education",
  "corporate_training",
  "academic_research",
  "edtech_product_ops",
]);

const adminOfficeDept = new Set([
  "executive_assistant",
  "office_admin",
  "general_support_staff",
]);

const multiOtherDept = new Set([
  "multi_disciplinary",
  "other_specify_in_summary",
]);

type JobFamilyKey =
  | "leadership_strategy"
  | "product_technology"
  | "sales_marketing_growth"
  | "people_talent"
  | "finance_risk_legal"
  | "operations_supply_chain"
  | "real_estate_facilities"
  | "customer_support_service"
  | "creative_media_comms"
  | "healthcare_life_sciences"
  | "education_research"
  | "admin_office_support"
  | "other";

function mapDepartmentToFamily(
  department?: string | null
): { key: JobFamilyKey; label: string } {
  if (!department) {
    return { key: "other", label: "Other / Multi-disciplinary" };
  }

  const v = department.toLowerCase().trim();

  if (leadershipDept.has(v)) {
    return { key: "leadership_strategy", label: "Leadership & Strategy" };
  }
  if (productTechDept.has(v)) {
    return { key: "product_technology", label: "Product & Technology" };
  }
  if (salesMktGrowthDept.has(v)) {
    return {
      key: "sales_marketing_growth",
      label: "Sales, Marketing & Growth",
    };
  }
  if (peopleTalentDept.has(v)) {
    return { key: "people_talent", label: "People & Talent" };
  }
  if (financeRiskLegalDept.has(v)) {
    return { key: "finance_risk_legal", label: "Finance, Risk & Legal" };
  }
  if (opsSupplyChainDept.has(v)) {
    return {
      key: "operations_supply_chain",
      label: "Operations, Supply Chain & Logistics",
    };
  }
  if (realEstateDept.has(v)) {
    return {
      key: "real_estate_facilities",
      label: "Real Estate & Facilities",
    };
  }
  if (customerSupportDept.has(v)) {
    return {
      key: "customer_support_service",
      label: "Customer Support & Service Delivery",
    };
  }
  if (creativeMediaDept.has(v)) {
    return {
      key: "creative_media_comms",
      label: "Creative, Media & Communications",
    };
  }
  if (healthcareDept.has(v)) {
    return {
      key: "healthcare_life_sciences",
      label: "Healthcare & Life Sciences",
    };
  }
  if (educationDept.has(v)) {
    return { key: "education_research", label: "Education & Research" };
  }
  if (adminOfficeDept.has(v)) {
    return {
      key: "admin_office_support",
      label: "Admin & Office Support",
    };
  }
  if (multiOtherDept.has(v)) {
    return { key: "other", label: "Other / Multi-disciplinary" };
  }

  // Fallback for anything not yet classified
  return { key: "other", label: "Other / Multi-disciplinary" };
}

function buildFacetOptions(
  jobs: JobCardData[],
  key: "location" | "workMode" | "type" | "experienceLevel",
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

// Build facets from job families instead of raw department enums
function buildDepartmentFamilyOptions(jobs: JobCardData[]): FacetOption[] {
  const map = new Map<JobFamilyKey, { label: string; count: number }>();

  for (const job of jobs) {
    const { key, label } = mapDepartmentToFamily(job.department);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { label, count: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([key, value]) => ({
      value: key,
      label: value.label,
      count: value.count,
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

// ---------------------------------------------------------------------------
// Quick filter helpers (reuse job families where possible)
// ---------------------------------------------------------------------------

function isLeadershipExecutive(job: JobCardData): boolean {
  const level = (job.experienceLevel ?? "").toLowerCase();
  const title = (job.title ?? "").toLowerCase();
  const family = mapDepartmentToFamily(job.department).key;

  if (family === "leadership_strategy") {
    return true;
  }

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
  const family = mapDepartmentToFamily(job.department).key;
  if (family === "product_technology") return true;

  const title = (job.title ?? "").toLowerCase();

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
  const family = mapDepartmentToFamily(job.department).key;
  if (family === "sales_marketing_growth") return true;

  const title = (job.title ?? "").toLowerCase();

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
  const [selectedJobFamilies, setSelectedJobFamilies] = useState<string[]>([]);
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
  const departmentFamilyOptions = useMemo(
    () => buildDepartmentFamilyOptions(jobs),
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
    selectedJobFamilies.length > 0 ||
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

    // Free-text search
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

    // Location facet
    if (selectedLocations.length > 0) {
      result = result.filter((job) =>
        selectedLocations.includes((job.location ?? "").trim())
      );
    }

    // Job family facet
    if (selectedJobFamilies.length > 0) {
      result = result.filter((job) => {
        const familyKey = mapDepartmentToFamily(job.department).key;
        return selectedJobFamilies.includes(familyKey);
      });
    }

    // Work mode facet
    if (selectedWorkModes.length > 0) {
      result = result.filter((job) =>
        selectedWorkModes.includes((job.workMode ?? "").trim())
      );
    }

    // Role level facet
    if (selectedLevels.length > 0) {
      result = result.filter((job) =>
        selectedLevels.includes((job.experienceLevel ?? "").trim())
      );
    }

    // Employment type facet
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

    // Quick work pattern filters
    if (workModeQuick) {
      result = result.filter((job) => {
        const mode = (job.workMode ?? "").toLowerCase();
        if (!mode) return false;
        return mode.includes(workModeQuick);
      });
    }

    // Sort by postedAt
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
    selectedJobFamilies,
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
    setSelectedJobFamilies([]);
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
            <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg:white/90 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur">
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

              {departmentFamilyOptions.length > 1 && (
                <FilterGroup
                  label="Job family"
                  options={departmentFamilyOptions}
                  selected={selectedJobFamilies}
                  onToggle={(value) =>
                    setSelectedJobFamilies((prev) => toggleFilter(prev, value))
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
    <div className="min-w-[90px] rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-[#FFC000]/10 px-3 py-2 text-left shadow-sm">
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-sm font-semibold text-[#172965]">
          {value}
        </span>
        <span className="h-0.5 flex-1 rounded-full bg-[#FFC000]/70" />
      </div>
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
          ? "border-[#306B34] bg-[#64C247]/15 text-[#306B34]"
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

  const visibleOptions = expanded ? options : options.slice(0, maxVisible);

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
                  ? "border-[#172965] bg-[#172965]/6 text-[#172965]"
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
