// app/ats/jobs/new/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type SelectOption = {
  value: string;
  label: string;
};

type OptionGroup = {
  label: string;
  options: SelectOption[];
};

// -----------------------------
// Global-style job function taxonomy
// (inspired by O*NET / ISCO-style clusters)
// -----------------------------
const JOB_FUNCTION_GROUPS: OptionGroup[] = [
  {
    label: "Leadership & General Management",
    options: [
      { value: "executive_leadership", label: "Executive Leadership (CEO, MD, Country Manager)" },
      { value: "general_management", label: "General Management / Business Unit Head" },
      { value: "strategy_corporate_dev", label: "Strategy & Corporate Development" },
      { value: "project_program_management", label: "Project / Program Management" },
      { value: "operations_management", label: "Operations Management" },
    ],
  },
  {
    label: "Sales, Commercial & Growth",
    options: [
      { value: "sales_business_development", label: "Sales & Business Development" },
      { value: "account_management_cs", label: "Account Management & Customer Success" },
      { value: "partnerships_alliances", label: "Partnerships & Alliances" },
      { value: "revenue_operations", label: "Revenue Operations (RevOps)" },
      { value: "pre_sales_solutions", label: "Pre-sales & Solutions Consulting" },
    ],
  },
  {
    label: "Marketing, Brand & Communications",
    options: [
      { value: "growth_marketing", label: "Growth / Performance Marketing" },
      { value: "brand_marketing", label: "Brand Marketing & Communications" },
      { value: "product_marketing", label: "Product Marketing" },
      { value: "content_social_media", label: "Content & Social Media" },
      { value: "pr_corporate_comms", label: "PR & Corporate Communications" },
    ],
  },
  {
    label: "Product, Design & User Experience",
    options: [
      { value: "product_management", label: "Product Management" },
      { value: "product_ownership", label: "Product Owner / Business Analyst" },
      { value: "ux_ui_design", label: "UX / UI Design" },
      { value: "service_design", label: "Service Design" },
      { value: "research_insights", label: "User Research & Insights" },
    ],
  },
  {
    label: "Engineering, Data & Technology",
    options: [
      { value: "software_engineering", label: "Software Engineering / Development" },
      { value: "data_science_ml", label: "Data Science & Machine Learning" },
      { value: "data_analytics", label: "Data Analytics / BI" },
      { value: "devops_platform", label: "DevOps / SRE / Platform Engineering" },
      { value: "cloud_infrastructure", label: "Cloud & Infrastructure Engineering" },
      { value: "it_support", label: "IT Support & Helpdesk" },
      { value: "cybersecurity", label: "Cybersecurity" },
      { value: "qa_testing", label: "QA & Test Engineering" },
    ],
  },
  {
    label: "People, HR & Talent",
    options: [
      { value: "people_hr", label: "People / HR Generalist" },
      { value: "talent_acquisition", label: "Talent Acquisition / Recruitment" },
      { value: "people_operations", label: "People Operations" },
      { value: "learning_development", label: "Learning & Development / Talent Management" },
      { value: "compensation_benefits", label: "Compensation & Benefits" },
    ],
  },
  {
    label: "Finance, Risk & Legal",
    options: [
      { value: "finance_accounting", label: "Finance & Accounting" },
      { value: "financial_planning_analysis", label: "Financial Planning & Analysis (FP&A)" },
      { value: "audit_control", label: "Audit, Controls & Reporting" },
      { value: "risk_compliance", label: "Risk & Compliance" },
      { value: "legal_corporate_secretariat", label: "Legal & Corporate Secretariat" },
      { value: "treasury_investments", label: "Treasury & Investments" },
    ],
  },
  {
    label: "Real Estate, Property & Facilities",
    options: [
      { value: "real_estate_investments", label: "Real Estate Investments & Advisory" },
      { value: "real_estate_development", label: "Real Estate Development / Projects" },
      { value: "estate_agency_leasing", label: "Estate Agency, Sales & Leasing" },
      { value: "property_facilities_management", label: "Property & Facilities Management" },
      { value: "valuation_asset_management", label: "Valuation & Asset Management" },
    ],
  },
  {
    label: "Operations, Supply Chain & Logistics",
    options: [
      { value: "business_operations", label: "Business / Process Operations" },
      { value: "supply_chain_procurement", label: "Supply Chain & Procurement" },
      { value: "logistics_fulfilment", label: "Logistics, Fulfilment & Fleet" },
      { value: "manufacturing_production", label: "Manufacturing & Production" },
      { value: "quality_assurance_ops", label: "Quality Assurance & Control (Operations)" },
    ],
  },
  {
    label: "Customer Support, Service & Experience",
    options: [
      { value: "customer_support", label: "Customer Support / Service" },
      { value: "contact_centre_bpo", label: "Contact Centre / BPO Operations" },
      { value: "service_delivery", label: "Service Delivery & Implementation" },
    ],
  },
  {
    label: "Creative, Media & Content",
    options: [
      { value: "creative_direction", label: "Creative Direction & Brand Studio" },
      { value: "graphic_motion_design", label: "Graphic & Motion Design" },
      { value: "video_photo_content", label: "Video, Photography & Multimedia" },
      { value: "copywriting_editing", label: "Copywriting & Editorial" },
    ],
  },
  {
    label: "Healthcare, Life Sciences & Social Impact",
    options: [
      { value: "clinical_medical", label: "Clinical & Medical Practice" },
      { value: "nursing_allied_health", label: "Nursing & Allied Health" },
      { value: "public_health", label: "Public Health & Health Programs" },
      { value: "pharmaceutical_biotech", label: "Pharmaceutical & Biotech" },
      { value: "social_impact_nonprofit", label: "Social Impact & Non-profit Programs" },
    ],
  },
  {
    label: "Education, Training & Research",
    options: [
      { value: "teaching_education", label: "Teaching & Education" },
      { value: "corporate_training", label: "Corporate Training & Facilitation" },
      { value: "academic_research", label: "Academic & Applied Research" },
      { value: "edtech_product_ops", label: "EdTech Product & Operations" },
    ],
  },
  {
    label: "Admin, Office & Support",
    options: [
      { value: "executive_assistant", label: "Executive Assistant & EA Support" },
      { value: "office_admin", label: "Office Administration & Front Desk" },
      { value: "general_support_staff", label: "General Support Staff" },
    ],
  },
  {
    label: "Other / Multi-disciplinary",
    options: [
      { value: "multi_disciplinary", label: "Multi-disciplinary / Hybrid Role" },
      { value: "other_specify_in_summary", label: "Other – described in role summary" },
    ],
  },
];

// -----------------------------
// Work mode, employment type, experience, currency
// -----------------------------
const WORK_MODE_OPTIONS: SelectOption[] = [
  { value: "", label: "Select work mode" },
  { value: "onsite", label: "Onsite" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
  { value: "field_based", label: "Field-based" },
];

const EMPLOYMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: "", label: "Select employment type" },
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
  { value: "consulting", label: "Consulting / Advisory" },
];

const EXPERIENCE_LEVEL_OPTIONS: SelectOption[] = [
  { value: "", label: "Select experience level" },
  { value: "entry", label: "Entry level / Graduate" },
  { value: "junior", label: "Junior (1–3 years)" },
  { value: "mid", label: "Mid-level (3–7 years)" },
  { value: "senior", label: "Senior (7–12 years)" },
  { value: "lead_principal", label: "Lead / Principal" },
  { value: "manager_head", label: "Manager / Head of" },
  { value: "director_vp", label: "Director / VP" },
  { value: "c_level_partner", label: "C-level / Partner" },
];

const CURRENCY_OPTIONS: SelectOption[] = [
  { value: "NGN", label: "NGN – Nigerian Naira" },
  { value: "USD", label: "USD – US Dollar" },
  { value: "EUR", label: "EUR – Euro" },
  { value: "GBP", label: "GBP – British Pound" },
  { value: "KES", label: "KES – Kenyan Shilling" },
  { value: "ZAR", label: "ZAR – South African Rand" },
  { value: "GHS", label: "GHS – Ghanaian Cedi" },
];

// -----------------------------
// Location – detailed, but still a single text field in DB
// -----------------------------
const LOCATION_GROUPS: OptionGroup[] = [
  {
    label: "Nigeria",
    options: [
      { value: "Lagos, Nigeria", label: "Lagos, Nigeria" },
      { value: "Abuja, Nigeria", label: "Abuja, Nigeria" },
      { value: "Port Harcourt, Nigeria", label: "Port Harcourt, Nigeria" },
      { value: "Nigeria – Remote", label: "Nigeria – Remote" },
      { value: "Nigeria – Multiple locations", label: "Nigeria – Multiple locations" },
    ],
  },
  {
    label: "Africa (key hubs)",
    options: [
      { value: "Nairobi, Kenya", label: "Nairobi, Kenya" },
      { value: "Accra, Ghana", label: "Accra, Ghana" },
      { value: "Johannesburg, South Africa", label: "Johannesburg, South Africa" },
      { value: "Cape Town, South Africa", label: "Cape Town, South Africa" },
      { value: "Cairo, Egypt", label: "Cairo, Egypt" },
      { value: "Africa – Remote", label: "Africa – Remote" },
    ],
  },
  {
    label: "Europe & Middle East",
    options: [
      { value: "London, United Kingdom", label: "London, United Kingdom" },
      { value: "Berlin, Germany", label: "Berlin, Germany" },
      { value: "Amsterdam, Netherlands", label: "Amsterdam, Netherlands" },
      { value: "Dubai, UAE", label: "Dubai, United Arab Emirates" },
      { value: "Europe – Remote", label: "Europe – Remote" },
    ],
  },
  {
    label: "Americas & Global",
    options: [
      { value: "New York, United States", label: "New York, United States" },
      { value: "Toronto, Canada", label: "Toronto, Canada" },
      { value: "São Paulo, Brazil", label: "São Paulo, Brazil" },
      { value: "Americas – Remote", label: "Americas – Remote" },
      { value: "Global – Remote / Distributed", label: "Global – Remote / Distributed" },
    ],
  },
];

// -----------------------------
// Page
// -----------------------------
export default async function NewJobPage() {
  const tenant = await getResourcinTenant();

  if (!tenant) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-xl font-semibold text-slate-900">
          Create job
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default tenant configured. Please ensure{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_ID
          </code>{" "}
          or{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_SLUG
          </code>{" "}
          are set.
        </p>
      </div>
    );
  }

  const [clientCompanies, users] = await Promise.all([
    prisma.clientCompany.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.user.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-0">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/ats/jobs"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <span className="mr-1.5">←</span>
            Back to ATS jobs
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            Create a new role
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Capture the essentials once. ThinkATS will reuse this across the
            careers page, pipelines and client reporting.
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700">
          Tenant:{" "}
          <span className="font-medium">
            {tenant.slug || tenant.name || "resourcin"}
          </span>
        </div>
      </div>

      <form
        action="/api/ats/jobs"
        method="POST"
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        {/* Role shell */}
        <section className="grid gap-4 border-b border-slate-100 pb-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] sm:gap-6">
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Job title *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. General Manager, Real Estate Operations"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Short pitch / teaser
              </label>
              <textarea
                name="shortDescription"
                rows={2}
                placeholder="One or two sentences you’d use to pitch this role to a candidate."
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-xl bg-slate-50/70 p-3 text-[11px] text-slate-600">
            <p className="font-semibold text-slate-900">
              Publishing tips
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>Use clear, market-aligned job titles.</li>
              <li>Keep the short pitch under 250 characters.</li>
              <li>
                Add salary bands when possible – it improves quality and
                response rates.
              </li>
            </ul>
          </div>
        </section>

        {/* Client, ownership & structure */}
        <section className="grid gap-4 border-b border-slate-100 pb-4 sm:grid-cols-3 sm:gap-6">
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Client company
              </label>
              <select
                name="clientCompanyId"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                defaultValue=""
              >
                <option value="">Resourcin / internal role</option>
                {clientCompanies.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Owner / recruiter
              </label>
              <select
                name="hiringManagerId"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                defaultValue=""
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}{" "}
                    {user.name && user.email ? `(${user.email})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {/* Location (detailed dropdown) */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Location
              </label>
              <select
                name="location"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                defaultValue=""
              >
                <option value="">Select location</option>
                {LOCATION_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-slate-400">
                This is the primary hiring location shown on the public job
                page.
              </p>
            </div>

            {/* Work mode (was: Location type) */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Work mode
              </label>
              <select
                name="locationType"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                defaultValue=""
              >
                {WORK_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {/* Employment type */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Employment type
              </label>
              <select
                name="employmentType"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                defaultValue=""
              >
                {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience level */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Experience level
              </label>
              <select
                name="experienceLevel"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                defaultValue=""
              >
                {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Function & salary */}
        <section className="grid gap-4 border-b border-slate-100 pb-4 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)] sm:gap-6">
          {/* Function cluster */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Role function / discipline
              </label>
              <select
                name="function"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                defaultValue=""
              >
                <option value="">Select function</option>
                {JOB_FUNCTION_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-slate-400">
                Used mainly for internal reporting and search. We’ll wire this
                into analytics once the schema field is added.
              </p>
            </div>
          </div>

          {/* Compensation */}
          <div className="space-y-3 rounded-xl bg-slate-50/70 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Compensation band
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-[10px] text-slate-500">
                  Currency
                </label>
                <select
                  name="salaryCurrency"
                  defaultValue="NGN"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px] text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] text-slate-500">
                  Min (annual)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="salaryMin"
                  placeholder="e.g. 10000000"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px] text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-[10px] text-slate-500">
                  Max (annual)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="salaryMax"
                  placeholder="e.g. 18000000"
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px] text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                />
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                id="salaryVisible"
                name="salaryVisible"
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <label
                htmlFor="salaryVisible"
                className="text-[11px] text-slate-600"
              >
                Show this band on the public job page
              </label>
            </div>
          </div>
        </section>

        {/* Narrative blocks */}
        <section className="grid gap-4 border-b border-slate-100 pb-4 sm:grid-cols-2 sm:gap-6">
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Role overview
              </label>
              <textarea
                name="overview"
                rows={4}
                placeholder="2–3 short paragraphs summarising the mission, scope and key outcomes for this role."
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                About the client
              </label>
              <textarea
                name="aboutClient"
                rows={4}
                placeholder="Short description of the client, sector, funding stage and context."
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Responsibilities
              </label>
              <textarea
                name="responsibilities"
                rows={4}
                placeholder={`Use bullet-style lines, e.g.\n• Lead the X function across Y markets\n• Own revenue targets for Z business unit\n• Build and manage a team of ...`}
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Requirements
              </label>
              <textarea
                name="requirements"
                rows={4}
                placeholder={`Bullet-style lines for experience, skills and must-haves.`}
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Benefits
              </label>
              <textarea
                name="benefits"
                rows={3}
                placeholder="Optional: benefits, perks, bonus structures or equity."
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>
          </div>
        </section>

        {/* Status & publishing */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Status
              </label>
              <select
                name="status"
                defaultValue="draft"
                className="mt-1 block rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              >
                <option value="draft">Draft – don’t publish yet</option>
                <option value="open">Open – live on careers site</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Visibility
              </label>
              <select
                name="visibility"
                defaultValue="public"
                className="mt-1 block rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              >
                <option value="public">Public – visible on Resourcin.com</option>
                <option value="internal">Internal – ATS only</option>
              </select>
            </div>

            <div className="mt-3 flex flex-col gap-1 sm:mt-6">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="internalOnly"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
                />
                <span>Internal mandate only (not for public careers site)</span>
              </label>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name="confidential"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
                />
                <span>Confidential client name on public page</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              name="status"
              value="draft"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
            >
              Save as draft
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-[#172965] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1c45]"
            >
              Publish role
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
