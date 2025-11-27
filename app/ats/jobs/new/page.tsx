// app/ats/jobs/new/page.tsx
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

// --- Static taxonomies --- //

const EXPERIENCE_LEVELS: { value: string; label: string }[] = [
  { value: "entry", label: "Entry / Graduate" },
  { value: "early-career", label: "Early career (1–3 yrs)" },
  { value: "mid-level", label: "Mid-level (3–6 yrs)" },
  { value: "senior", label: "Senior (6–10 yrs)" },
  { value: "lead", label: "Lead / Principal" },
  { value: "manager", label: "Manager / People Manager" },
  { value: "head-of", label: "Head of Function" },
  { value: "director", label: "Director" },
  { value: "vp", label: "VP" },
  { value: "c-suite", label: "C-suite" },
];

const LOCATION_TYPES: { value: string; label: string }[] = [
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

const EMPLOYMENT_TYPES: { value: string; label: string }[] = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
  { value: "consultant", label: "Consultant" },
];

const CURRENCY_OPTIONS: { code: string; label: string }[] = [
  { code: "NGN", label: "NGN – Nigerian Naira" },
  { code: "USD", label: "USD – US Dollar" },
  { code: "GBP", label: "GBP – British Pound" },
  { code: "EUR", label: "EUR – Euro" },
  { code: "KES", label: "KES – Kenyan Shilling" },
  { code: "GHS", label: "GHS – Ghanaian Cedi" },
  { code: "ZAR", label: "ZAR – South African Rand" },
];

type FunctionGroup = {
  label: string;
  options: { value: string; label: string }[];
};

const JOB_FUNCTION_GROUPS: FunctionGroup[] = [
  {
    label: "Leadership & Strategy",
    options: [
      { value: "general-management", label: "General Management / GM" },
      { value: "strategy-corporate-dev", label: "Strategy & Corporate Development" },
      { value: "founder-entrepreneur", label: "Founder / Entrepreneur in Residence" },
      { value: "operations-leadership", label: "Operations Leadership" },
    ],
  },
  {
    label: "Finance, Legal & Risk",
    options: [
      { value: "finance-accounting", label: "Finance & Accounting" },
      { value: "financial-planning-analysis", label: "Financial Planning & Analysis (FP&A)" },
      { value: "treasury-corporate-finance", label: "Treasury & Corporate Finance" },
      { value: "audit-tax", label: "Audit & Tax" },
      { value: "risk-compliance", label: "Risk & Compliance" },
      { value: "legal-corporate-secretariat", label: "Legal & Corporate Secretariat" },
      { value: "investment-asset-management", label: "Investment & Asset Management" },
      { value: "banking-financial-services", label: "Banking & Financial Services" },
      { value: "insurance-actuarial", label: "Insurance & Actuarial" },
    ],
  },
  {
    label: "Sales, Marketing & Growth",
    options: [
      { value: "sales-business-development", label: "Sales & Business Development" },
      { value: "account-management", label: "Account Management / Customer Success" },
      { value: "growth-marketing", label: "Growth & Performance Marketing" },
      { value: "brand-marketing-communications", label: "Brand, Marketing & Communications" },
      { value: "partnerships-alliance", label: "Partnerships & Alliances" },
    ],
  },
  {
    label: "Product, Tech & Data",
    options: [
      { value: "product-management", label: "Product Management" },
      { value: "project-program-management", label: "Project & Program Management" },
      { value: "software-engineering", label: "Software Engineering" },
      { value: "data-science-analytics", label: "Data Science & Analytics" },
      { value: "machine-learning-ai", label: "Machine Learning & AI" },
      { value: "devops-infrastructure", label: "DevOps & Infrastructure" },
      { value: "cybersecurity", label: "Cybersecurity & Information Security" },
      { value: "it-systems-support", label: "IT, Systems & Support" },
      { value: "design-ux-ui", label: "Design, UX & UI" },
    ],
  },
  {
    label: "People, Ops & Support",
    options: [
      { value: "people-hr", label: "People & HR" },
      { value: "talent-acquisition", label: "Talent Acquisition / Recruitment" },
      { value: "operations-supply-chain", label: "Operations, Supply Chain & Fulfilment" },
      { value: "customer-support-service", label: "Customer Support & Service" },
      { value: "administration-office-ops", label: "Administration & Office Operations" },
      { value: "procurement", label: "Procurement & Vendor Management" },
      { value: "facilities-office-management", label: "Facilities & Office Management" },
    ],
  },
  {
    label: "Real Estate, Construction & Built Environment",
    options: [
      { value: "real-estate-development", label: "Real Estate Development & Investments" },
      { value: "real-estate-sales-leasing", label: "Real Estate Sales & Leasing" },
      { value: "property-estate-management", label: "Property / Estate Management" },
      { value: "facilities-buildings-management", label: "Facilities & Buildings Management" },
      { value: "construction-projects", label: "Construction & Project Delivery" },
      { value: "architecture-urban-planning", label: "Architecture & Urban Planning" },
    ],
  },
  {
    label: "Sector-specific",
    options: [
      { value: "healthcare-clinical", label: "Healthcare & Clinical" },
      { value: "pharma-biotech", label: "Pharma & Biotech" },
      { value: "education-training", label: "Education & Training" },
      { value: "logistics-transport", label: "Logistics, Transport & Fleet" },
      { value: "hospitality-travel", label: "Hospitality & Travel" },
      { value: "manufacturing-production", label: "Manufacturing & Production" },
      { value: "agriculture-agribusiness", label: "Agriculture & Agribusiness" },
      { value: "energy-utilities", label: "Energy, Power & Utilities" },
      { value: "media-content", label: "Media, Content & Communications" },
      { value: "public-sector-ngo", label: "Public Sector, Non-profit & NGO" },
    ],
  },
];

export default async function NewJobPage() {
  const tenant = await getResourcinTenant();

  const [clientCompanies, owners] = await Promise.all([
    prisma.clientCompany.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      orderBy: { email: "asc" },
      select: { id: true, email: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-0">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Post a new role
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Create a role that flows into ThinkATS pipelines, public careers
            pages and analytics for{" "}
            <span className="font-medium text-slate-900">
              {tenant?.name || tenant?.slug || "Resourcin"}
            </span>
            .
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700">
          Status defaults to{" "}
          <span className="font-semibold text-slate-900">
            Draft
          </span>{" "}
          until you mark as open.
        </div>
      </div>

      <form
        className="space-y-6"
        method="POST"
        action="/api/ats/jobs"
      >
        {/* Card 1: Basics & context */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Role basics
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Title, client, owner and key meta that power search,
                analytics and the careers page.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Job title<span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                type="text"
                required
                placeholder="e.g. General Manager, Real Estate Operations"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            {/* Client company */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Client company
              </label>
              <select
                name="clientCompanyId"
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              >
                <option value="">Resourcin (no external client)</option>
                {clientCompanies.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-slate-400">
                If this is a mandate for a specific client, select them here.
              </p>
            </div>

            {/* Owner / recruiter */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Owner / recruiter
              </label>
              <select
                name="hiringManagerId"
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              >
                <option value="">Unassigned</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.email}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-slate-400">
                Used in ThinkATS analytics and recruiter performance
                dashboards.
              </p>
            </div>

            {/* Function / discipline */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Function / discipline
              </label>
              <select
                name="function"
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
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
                This feeds function filters and salary / benchmarking later.
              </p>
            </div>

            {/* Experience level */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Experience level
              </label>
              <select
                name="experienceLevel"
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              >
                <option value="">Not specified</option>
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Location
              </label>
              <input
                name="location"
                type="text"
                placeholder="e.g. Lagos, Nigeria"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            {/* Location type */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Location type
              </label>
              <select
                name="locationType"
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              >
                <option value="">Not specified</option>
                {LOCATION_TYPES.map((lt) => (
                  <option key={lt.value} value={lt.value}>
                    {lt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Employment type */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Employment type
              </label>
              <select
                name="employmentType"
                defaultValue=""
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              >
                <option value="">Not specified</option>
                {EMPLOYMENT_TYPES.map((et) => (
                  <option key={et.value} value={et.value}>
                    {et.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Skill tags */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Skill tags / keywords
              </label>
              <textarea
                name="tags"
                rows={2}
                placeholder="e.g. Real estate operations, Leasing, Facilities management, GM experience"
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Separate tags with commas or new lines. These feed search,
                matching and future analytics.
              </p>
            </div>
          </div>
        </section>

        {/* Card 2: Narrative / description */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Narrative & description
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              These fields show on the public role page and help candidates
              self-select in or out.
            </p>
          </div>

          <div className="space-y-4">
            {/* Short description */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Short pitch
              </label>
              <textarea
                name="shortDescription"
                rows={2}
                placeholder="1–3 sentence overview that sells the role and context."
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            {/* Overview */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Role overview
              </label>
              <textarea
                name="overview"
                rows={4}
                placeholder={`What this role owns, how success will be measured, reporting lines, and a quick 12–18 month view.`}
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            {/* About client */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                About the client
              </label>
              <textarea
                name="aboutClient"
                rows={3}
                placeholder="Sector, size, locations, culture and why this role matters in their strategy."
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Responsibilities
              </label>
              <textarea
                name="responsibilities"
                rows={5}
                placeholder={`Use bullet-style lines, e.g.:
- Own day-to-day operations across X locations
- Build and lead a team of Y direct reports
- Manage relationships with key landlords, agents and vendors`}
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Requirements
              </label>
              <textarea
                name="requirements"
                rows={5}
                placeholder={`Bullet-style lines, e.g.:
- 8+ years managing multi-site real estate / facilities operations
- Experience in residential, commercial or mixed-use portfolios
- Comfortable with KPIs, budgets and board-level reporting`}
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Benefits
              </label>
              <textarea
                name="benefits"
                rows={4}
                placeholder={`Comp, bonuses, benefits, flexible work, development, etc.`}
                className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              />
            </div>
          </div>
        </section>

        {/* Card 3: Compensation & publishing */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Compensation & publishing
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Control what candidates see, where the role is visible, and
                whether salary is revealed.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Salary band */}
            <div className="space-y-2">
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Salary range
              </label>
              <div className="flex gap-2">
                <input
                  name="salaryMin"
                  type="text"
                  inputMode="numeric"
                  placeholder="Minimum"
                  className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                />
                <input
                  name="salaryMax"
                  type="text"
                  inputMode="numeric"
                  placeholder="Maximum"
                  className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                You can paste plain numbers (e.g. 8000000). We’ll format
                for the public page.
              </p>
            </div>

            {/* Currency + show/hide */}
            <div className="space-y-2">
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Currency & visibility
              </label>
              <div className="flex flex-col gap-2">
                <select
                  name="salaryCurrency"
                  defaultValue="NGN"
                  className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <label className="inline-flex items-center gap-2 text-[11px] text-slate-700">
                  <input
                    type="checkbox"
                    name="salaryVisible"
                    className="h-3 w-3 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
                  />
                  <span>Show salary band on public role page</span>
                </label>
              </div>
            </div>

            {/* Visibility & status */}
            <div className="space-y-2">
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Visibility
              </label>
              <div className="space-y-2 text-[11px] text-slate-700">
                <select
                  name="visibility"
                  defaultValue="public"
                  className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                >
                  <option value="public">Public – show on careers site</option>
                  <option value="internal">
                    Internal – ATS only, hidden from public
                  </option>
                </select>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="internalOnly"
                    className="h-3 w-3 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
                  />
                  <span>Internal hire only (useful for backfills / reshuffles)</span>
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="confidential"
                    className="h-3 w-3 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
                  />
                  <span>Mark client as confidential on public page</span>
                </label>
              </div>
            </div>

            {/* Status + slug */}
            <div className="space-y-2">
              <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Status & URL
              </label>
              <div className="space-y-2">
                <select
                  name="status"
                  defaultValue="draft"
                  className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                >
                  <option value="draft">Draft (not live)</option>
                  <option value="open">Open (live & accepting applicants)</option>
                  <option value="closed">Closed (archived)</option>
                </select>

                <input
                  name="slug"
                  type="text"
                  placeholder="Optional: custom URL slug, e.g. gm-real-estate-operations"
                  className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                />
                <p className="text-[10px] text-slate-400">
                  Leave blank to auto-generate a slug from the title.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-[11px] text-slate-500">
              You can edit this role later from the ATS job pipeline.
            </p>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-[#172965] px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#0f1c45]"
              >
                Save & go to pipeline
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
