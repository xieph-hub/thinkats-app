// app/ats/jobs/new/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create role | ThinkATS | Resourcin",
  description:
    "Create a new mandate in ThinkATS, assign an owner and publish it to your careers page.",
};

export default async function NewJobPage() {
  const tenant = await getResourcinTenant();

  if (!tenant) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-xl font-semibold text-slate-900">
          Create role
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
    }),
    prisma.user.findMany({
      orderBy: { email: "asc" },
      select: {
        id: true,
        email: true,
      },
    }),
  ]);

  // -------------------------
  // Taxonomies
  // -------------------------

  const locationOptions = [
    { value: "", label: "Select location…" },
    { value: "Lagos, Nigeria", label: "Lagos, Nigeria" },
    { value: "Abuja, Nigeria", label: "Abuja, Nigeria" },
    { value: "Port Harcourt, Nigeria", label: "Port Harcourt, Nigeria" },
    { value: "Nigeria (other)", label: "Nigeria (other)" },
    { value: "Nairobi, Kenya", label: "Nairobi, Kenya" },
    { value: "Kenya (other)", label: "Kenya (other)" },
    { value: "Accra, Ghana", label: "Accra, Ghana" },
    { value: "Ghana (other)", label: "Ghana (other)" },
    {
      value: "Johannesburg, South Africa",
      label: "Johannesburg, South Africa",
    },
    { value: "Cape Town, South Africa", label: "Cape Town, South Africa" },
    { value: "South Africa (other)", label: "South Africa (other)" },
    { value: "Dubai, UAE", label: "Dubai, UAE" },
    { value: "United Kingdom (London)", label: "United Kingdom (London)" },
    { value: "United Kingdom (other)", label: "United Kingdom (other)" },
    { value: "Europe (other)", label: "Europe (other)" },
    { value: "United States (remote)", label: "United States (remote)" },
    { value: "Remote – Africa", label: "Remote – Africa" },
    { value: "Remote – Global", label: "Remote – Global" },
    { value: "Other / mixed", label: "Other / mixed" },
  ];

  // Much more exhaustive function taxonomy (enterprise-ish)
  const functionOptions = [
    { value: "", label: "Select function…" },
    // Leadership / General management
    { value: "Executive Leadership", label: "Executive Leadership" },
    { value: "General Management", label: "General Management" },
    { value: "Strategy & Corporate Development", label: "Strategy & Corporate Development" },
    { value: "Project & Program Management", label: "Project & Program Management" },

    // Commercial
    { value: "Sales & Business Development", label: "Sales & Business Development" },
    { value: "Account Management / Client Success", label: "Account Management / Client Success" },
    { value: "Customer Support / Contact Centre", label: "Customer Support / Contact Centre" },
    { value: "Marketing & Growth", label: "Marketing & Growth" },
    { value: "Brand / Communications / PR", label: "Brand / Communications / PR" },

    // Product / Tech / Data / Design
    { value: "Product Management", label: "Product Management" },
    { value: "Design & UX", label: "Design & UX" },
    { value: "Engineering – Software", label: "Engineering – Software" },
    { value: "Engineering – Infrastructure / DevOps", label: "Engineering – Infrastructure / DevOps" },
    { value: "Engineering – Hardware / Embedded", label: "Engineering – Hardware / Embedded" },
    { value: "Data Science & Analytics", label: "Data Science & Analytics" },
    { value: "IT & Systems Administration", label: "IT & Systems Administration" },

    // People / HR
    { value: "Human Resources / People", label: "Human Resources / People" },
    { value: "Talent Acquisition / Recruitment", label: "Talent Acquisition / Recruitment" },
    { value: "Learning & Development", label: "Learning & Development" },

    // Finance / Risk / Legal
    { value: "Finance & Accounting", label: "Finance & Accounting" },
    { value: "Investment / Corporate Finance", label: "Investment / Corporate Finance" },
    { value: "Risk & Audit", label: "Risk & Audit" },
    { value: "Legal & Compliance", label: "Legal & Compliance" },

    // Ops / Supply chain / Manufacturing
    { value: "Operations", label: "Operations" },
    { value: "Procurement", label: "Procurement" },
    { value: "Supply Chain & Logistics", label: "Supply Chain & Logistics" },
    { value: "Manufacturing & Production", label: "Manufacturing & Production" },
    { value: "Quality Assurance / Quality Control", label: "Quality Assurance / Quality Control" },

    // Real estate / Construction
    { value: "Real Estate – Development & Investments", label: "Real Estate – Development & Investments" },
    { value: "Real Estate – Sales & Brokerage", label: "Real Estate – Sales & Brokerage" },
    {
      value: "Real Estate – Property / Facilities Management",
      label: "Real Estate – Property / Facilities Management",
    },
    { value: "Construction & Civil Engineering", label: "Construction & Civil Engineering" },

    // Sector-specific
    { value: "Healthcare & Clinical", label: "Healthcare & Clinical" },
    { value: "Pharmaceutical & Life Sciences", label: "Pharmaceutical & Life Sciences" },
    { value: "Agriculture & Agribusiness", label: "Agriculture & Agribusiness" },
    { value: "Energy / Power / Utilities", label: "Energy / Power / Utilities" },
    { value: "Oil & Gas", label: "Oil & Gas" },
    { value: "Telecommunications", label: "Telecommunications" },
    { value: "Financial Services / Banking", label: "Financial Services / Banking" },
    { value: "Insurance", label: "Insurance" },
    { value: "Public Sector / Development", label: "Public Sector / Development" },
    { value: "Education & Training", label: "Education & Training" },
    { value: "NGO / Social Impact", label: "NGO / Social Impact" },

    // Enablers
    { value: "Administration & Office Management", label: "Administration & Office Management" },
    { value: "Facilities / Workplace", label: "Facilities / Workplace" },
    { value: "Security / HSE", label: "Security / HSE" },
    { value: "Research & Policy", label: "Research & Policy" },

    // Catch-all
    { value: "Other / Generalist", label: "Other / Generalist" },
  ];

  // Global-ish ladder for experience level
  const experienceOptions = [
    { value: "", label: "Not specified" },
    { value: "intern", label: "Intern / Student" },
    { value: "entry", label: "Entry level / Graduate" },
    { value: "associate", label: "Associate / Early career" },
    { value: "mid", label: "Mid-level Professional" },
    { value: "senior", label: "Senior Professional / IC" },
    { value: "lead", label: "Lead / Principal IC" },
    { value: "manager", label: "Manager / People Manager" },
    { value: "head", label: "Head of / Department Lead" },
    { value: "director", label: "Director / Senior Director" },
    { value: "vp", label: "VP / SVP" },
    { value: "executive", label: "C-level / Executive" },
  ];

  const employmentTypeOptions = [
    { value: "", label: "Not specified" },
    { value: "Full time", label: "Full time" },
    { value: "Part time", label: "Part time" },
    { value: "Contract", label: "Contract" },
    { value: "Consulting", label: "Consulting" },
    { value: "Temporary", label: "Temporary" },
    { value: "Internship", label: "Internship" },
  ];

  const statusOptions = [
    { value: "draft", label: "Draft (not live)" },
    { value: "open", label: "Open (actively hiring)" },
    { value: "closed", label: "Closed" },
    { value: "on_hold", label: "On hold" },
  ];

  const visibilityOptions = [
    {
      value: "public",
      label: "Public (show on /jobs careers page)",
    },
    {
      value: "internal",
      label: "Internal only (ATS, no careers page)",
    },
    {
      value: "confidential",
      label: "Confidential search (discreet listing)",
    },
  ];

  // Currency dropdown (ISO-ish codes, Africa + global)
  const currencyOptions = [
    { value: "NGN", label: "NGN – Nigerian Naira" },
    { value: "USD", label: "USD – US Dollar" },
    { value: "EUR", label: "EUR – Euro" },
    { value: "GBP", label: "GBP – British Pound" },
    { value: "KES", label: "KES – Kenyan Shilling" },
    { value: "GHS", label: "GHS – Ghanaian Cedi" },
    { value: "ZAR", label: "ZAR – South African Rand" },
    { value: "XOF", label: "XOF – West African CFA" },
    { value: "XAF", label: "XAF – Central African CFA" },
    { value: "UGX", label: "UGX – Ugandan Shilling" },
    { value: "TZS", label: "TZS – Tanzanian Shilling" },
    { value: "RWF", label: "RWF – Rwandan Franc" },
    { value: "AED", label: "AED – UAE Dirham" },
    { value: "CAD", label: "CAD – Canadian Dollar" },
    { value: "AUD", label: "AUD – Australian Dollar" },
    { value: "INR", label: "INR – Indian Rupee" },
    { value: "OTHER", label: "Other / mixed" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-0">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1">
            <Link
              href="/ats/jobs"
              className="inline-flex items-center text-[11px] font-medium text-slate-500 hover:text-slate-800"
            >
              <span className="mr-1.5">←</span>
              Back to roles
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Create new role
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Capture the basics, assign an owner and optionally publish to
            your careers page.
          </p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700">
          Tenant:{" "}
          <span className="font-medium">
            {tenant.name ?? tenant.slug ?? "Resourcin"}
          </span>
        </div>
      </div>

      {/* Form */}
      <form
        method="POST"
        action="/api/ats/jobs"
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        {/* Row: Title + Client + Owner */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Job title<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Deputy Medical Director"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Client company
            </label>
            <select
              name="clientCompanyId"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue=""
            >
              <option value="">
                Direct mandate (Resourcin / in-house)
              </option>
              {clientCompanies.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Owner / Recruiter
            </label>
            <select
              name="hiringManagerId"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue=""
            >
              <option value="">Unassigned</option>
              {users.map((user) => {
                const label = user.email || `User ${user.id}`;
                return (
                  <option key={user.id} value={user.id}>
                    {label}
                  </option>
                );
              })}
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Used for recruiter / owner analytics in ThinkATS.
            </p>
          </div>
        </div>

        {/* Row: Location + Location type + Employment type */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Location
            </label>
            <select
              name="location"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue=""
            >
              {locationOptions.map((opt) => (
                <option key={opt.value || "blank"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-slate-500">
              Global-ready, Africa-biased locations. For edge cases,
              choose &ldquo;Other / mixed&rdquo; and clarify in the
              description.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Location type
            </label>
            <select
              name="locationType"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue=""
            >
              <option value="">Not specified</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Employment type
            </label>
            <select
              name="employmentType"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue=""
            >
              {employmentTypeOptions.map((opt) => (
                <option key={opt.value || "blank"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row: Function + Experience level + Status + Visibility */}
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Function
            </label>
            <select
              name="function"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue=""
            >
              {functionOptions.map((opt) => (
                <option key={opt.value || "blank"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-slate-500">
              High-level job family / function. Mirrors common ATS and
              LinkedIn taxonomies (with Real Estate & sector-specific
              tracks).
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Experience level
            </label>
            <select
              name="experienceLevel"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue=""
            >
              {experienceOptions.map((opt) => (
                <option key={opt.value || "blank"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              name="status"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue="draft"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Visibility
            </label>
            <select
              name="visibility"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue="public"
            >
              {visibilityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Salary & flags */}
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Salary min
            </label>
            <input
              type="number"
              name="salaryMin"
              min={0}
              step={1000}
              placeholder="e.g. 15000000"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Salary max
            </label>
            <input
              type="number"
              name="salaryMax"
              min={0}
              step={1000}
              placeholder="e.g. 22000000"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Currency
            </label>
            <select
              name="salaryCurrency"
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
              defaultValue="NGN"
            >
              {currencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-slate-500">
              If you pick &ldquo;Other / mixed&rdquo;, you can clarify in
              the description or offer notes.
            </p>
          </div>
          <div className="flex flex-col justify-end gap-1">
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
              <input
                type="checkbox"
                name="salaryVisible"
                defaultChecked={false}
                className="h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <span>Show salary range on careers page</span>
            </label>
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
              <input
                type="checkbox"
                name="confidential"
                className="h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <span>Mark client as confidential</span>
            </label>
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
              <input
                type="checkbox"
                name="internalOnly"
                className="h-4 w-4 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <span>Internal mandate only</span>
            </label>
          </div>
        </div>

        {/* Short description */}
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Short description
          </label>
          <textarea
            name="shortDescription"
            rows={2}
            placeholder="2–3 lines that describe the role and why it matters."
            className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
          />
        </div>

        {/* Overview & About client */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Role overview
            </label>
            <textarea
              name="overview"
              rows={5}
              placeholder="Context, mandate and what success looks like in 12–18 months."
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              About the client
            </label>
            <textarea
              name="aboutClient"
              rows={5}
              placeholder="Short profile on the client, team structure and culture."
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        {/* Responsibilities / Requirements / Benefits */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Responsibilities
            </label>
            <textarea
              name="responsibilities"
              rows={8}
              placeholder="One bullet per line. These will render as a formatted list on the public job page."
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Requirements
            </label>
            <textarea
              name="requirements"
              rows={8}
              placeholder="One bullet per line for must-haves / nice-to-haves."
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Benefits
            </label>
            <textarea
              name="benefits"
              rows={8}
              placeholder="Comp, perks, extras – one item per line."
              className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <p className="text-[11px] text-slate-500">
            You can always edit this role later from the ATS jobs list.
          </p>
          <div className="flex gap-2">
            <Link
              href="/ats/jobs"
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-[#172965] px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#0f1c45]"
            >
              Create role
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
