// app/ats/jobs/new/JobCreateWizard.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ClientCompany = {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
};

type ApiResponse = {
  id?: string;
  slug?: string | null;
  error?: string;
};

// --- Reference data: industries, locations, functions, skills, seniority ---

// Broad, global-ish industry set + "Other"
const INDUSTRY_OPTIONS: string[] = [
  "Technology, Media & Telecommunications",
  "Software & SaaS",
  "Financial Services & Banking",
  "Fintech & Payments",
  "Insurance & Insurtech",
  "Healthcare & Hospitals",
  "Pharmaceuticals & Biotech",
  "Life Sciences & MedTech",
  "Energy, Oil & Gas",
  "Power, Utilities & Renewables",
  "Manufacturing & Industrial",
  "Automotive & Mobility",
  "FMCG & Consumer Goods",
  "Retail & E-commerce",
  "Food, Beverage & Hospitality",
  "Travel, Aviation & Tourism",
  "Logistics, Transport & Supply Chain",
  "Real Estate & Property",
  "Construction & Engineering",
  "Agriculture & Agribusiness",
  "Education & EdTech",
  "Professional Services & Consulting",
  "Accounting & Audit",
  "Legal Services",
  "Media, Advertising & Communications",
  "Telecommunications & Infrastructure",
  "Public Sector & Government",
  "Non-profit, NGO & Development",
  "Mining, Metals & Natural Resources",
  "Other / Not listed",
];

const LOCATION_OPTIONS: string[] = [
  "Lagos, Nigeria",
  "Abuja, Nigeria",
  "Port Harcourt, Nigeria",
  "Nairobi, Kenya",
  "Accra, Ghana",
  "Johannesburg, South Africa",
  "Cape Town, South Africa",
  "Remote – Africa",
  "Remote – EMEA",
  "Remote – Global",
];

// Standard job families + "Other"
const FUNCTION_OPTIONS: string[] = [
  "Executive Leadership (C-suite, Country Management)",
  "General Management & Operations",
  "Finance & Accounting",
  "Engineering & Software Development",
  "Product Management",
  "Data, Analytics & Business Intelligence",
  "Sales, Business Development & Account Management",
  "Marketing, Brand & Growth",
  "Customer Success, Service & Support",
  "People, HR & Talent",
  "Legal, Risk & Compliance",
  "Supply Chain, Procurement & Manufacturing",
  "Project, Programme & PMO",
  "Design, UX & Creative",
  "IT, Infrastructure & Cybersecurity",
  "Medical, Clinical & Healthcare",
  "Research, Strategy & Innovation",
  "Other / Not listed",
];

// Standard seniority ladder
const SENIORITY_OPTIONS: string[] = [
  "Internship / Student",
  "Entry level / Graduate",
  "Associate / Junior",
  "Mid-level",
  "Senior Individual Contributor",
  "Lead / Principal",
  "Manager",
  "Senior Manager",
  "Head of Function",
  "Director",
  "Senior Director",
  "Vice President (VP)",
  "Senior Vice President (SVP)",
  "C-level / Executive",
  "Founder / Co-founder",
];

const SKILLS_BY_FUNCTION: Record<string, string[]> = {
  "Executive Leadership (C-suite, Country Management)": [
    "P&L ownership",
    "Strategy & execution",
    "Board & investor communication",
    "Market entry & expansion",
    "Organisational design",
    "Change management",
    "Executive stakeholder management",
    "Leadership & talent stewardship",
    "Risk management & governance",
  ],
  "General Management & Operations": [
    "Operational excellence (Lean, Kaizen, Six Sigma)",
    "Process design & optimisation",
    "Capacity & workforce planning",
    "Service delivery & SLAs",
    "Vendor & partner management",
    "Budgeting & cost control",
    "Cross-functional coordination",
    "Business continuity & resilience",
  ],
  "Finance & Accounting": [
    "Financial reporting (IFRS / GAAP)",
    "Budgeting & forecasting",
    "Management accounting",
    "Treasury & liquidity management",
    "Financial modelling",
    "Audit & controls",
    "Tax planning & compliance",
    "Investor & stakeholder reporting",
  ],
  "Engineering & Software Development": [
    "Software architecture & design",
    "Backend engineering",
    "Frontend engineering",
    "API design & integration",
    "Cloud platforms (AWS, GCP, Azure)",
    "CI/CD & DevOps practices",
    "Testing & quality engineering",
    "Performance & scalability",
    "Security-by-design",
  ],
  "Product Management": [
    "Product discovery & validation",
    "Roadmapping & prioritisation",
    "User research & insight generation",
    "Stakeholder management",
    "Experimentation & A/B testing",
    "Go-to-market collaboration",
    "Metrics & product analytics",
    "Product strategy & vision",
  ],
  "Data, Analytics & Business Intelligence": [
    "SQL & data modelling",
    "Dashboarding & BI tools",
    "Experiment & A/B test design",
    "Forecasting & time-series analysis",
    "Customer & growth analytics",
    "Data storytelling & insight communication",
    "Data governance & quality",
    "Python / R for analytics",
  ],
  "Sales, Business Development & Account Management": [
    "Enterprise sales",
    "Solution & consultative selling",
    "Prospecting & pipeline generation",
    "Account management & expansion",
    "Partnerships & alliances",
    "Negotiation & closing",
    "Territory & channel management",
    "CRM hygiene & reporting",
  ],
  "Marketing, Brand & Growth": [
    "Brand strategy & positioning",
    "Demand generation",
    "Performance & digital marketing",
    "Content & storytelling",
    "Product marketing",
    "Campaign planning & execution",
    "Marketing analytics & attribution",
    "Community & ecosystem building",
  ],
  "Customer Success, Service & Support": [
    "Customer onboarding",
    "Account health monitoring",
    "NPS & CSAT management",
    "Renewals & churn prevention",
    "Upsell & expansion",
    "Support operations & tooling",
    "Incident management & escalation",
    "Customer journey mapping",
  ],
  "People, HR & Talent": [
    "Talent acquisition & sourcing",
    "People operations & HRIS",
    "Performance & feedback systems",
    "Compensation & benefits",
    "Organisational development",
    "Employee relations & case management",
    "Learning & leadership development",
    "Culture, engagement & communications",
  ],
  "Legal, Risk & Compliance": [
    "Commercial contracting",
    "Regulatory compliance",
    "Corporate governance",
    "Data protection & privacy",
    "Risk assessment & mitigation",
    "Policy design & implementation",
    "Dispute resolution & litigation management",
    "Stakeholder & regulator engagement",
  ],
  "Supply Chain, Procurement & Manufacturing": [
    "Demand & supply planning",
    "Procurement & sourcing strategy",
    "Inventory management",
    "Manufacturing operations",
    "Logistics & distribution",
    "Supplier relationship management",
    "Cost optimisation",
    "Quality & safety standards",
  ],
  "Project, Programme & PMO": [
    "Project scoping & planning",
    "Programme governance",
    "Stakeholder communications",
    "Risk & issue management",
    "Budget & resource management",
    "Agile / Scrum / Kanban",
    "Waterfall project management",
    "Benefits realisation tracking",
  ],
  "Design, UX & Creative": [
    "User research & discovery",
    "UX design & prototyping",
    "UI design & design systems",
    "Information architecture",
    "Interaction design",
    "Brand & visual identity",
    "Usability testing",
    "Design ops & collaboration",
  ],
  "IT, Infrastructure & Cybersecurity": [
    "IT operations & service management",
    "Network & infrastructure design",
    "Cloud infrastructure (AWS / Azure / GCP)",
    "Information security",
    "Identity & access management",
    "Security monitoring & incident response",
    "Business continuity & DR",
    "Compliance (ISO 27001, SOC2, etc.)",
  ],
  "Medical, Clinical & Healthcare": [
    "Clinical operations",
    "Patient care & safety",
    "Healthcare quality & standards",
    "Clinical governance",
    "Medical documentation & compliance",
    "Care pathway optimisation",
    "Multidisciplinary team leadership",
    "Clinical research & trials",
  ],
  "Research, Strategy & Innovation": [
    "Market & competitor research",
    "Corporate & business strategy",
    "Innovation & new ventures",
    "Scenario & sensitivity analysis",
    "Quantitative & qualitative research",
    "Insight synthesis & storytelling",
    "Strategic planning & OKRs",
    "Experimentation & pilots",
  ],
  "Other / Not listed": [
    "Stakeholder management",
    "Problem solving & analysis",
    "Communication & storytelling",
    "Planning & prioritisation",
    "Project delivery",
    "Team collaboration",
    "Adaptability & learning",
    "Ownership & accountability",
  ],
};

const GENERIC_SKILLS: string[] = [
  "Stakeholder management",
  "Project management",
  "Structured problem solving",
  "Analytical thinking",
  "Written communication",
  "Verbal communication & presentations",
  "Collaboration & cross-functional work",
  "Planning & prioritisation",
  "Coaching & people development",
];

const CURRENCY_OPTIONS = ["NGN", "USD", "KES", "GHS", "ZAR", "EUR", "GBP"];

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Simple step indicator with your brand colours
function Stepper({ step }: { step: number }) {
  const steps = ["Basics", "Role profile", "Criteria", "Process & publish"];

  return (
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
      <ol className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs">
        {steps.map((label, idx) => {
          const number = idx + 1;
          const isActive = number === step;
          const isCompleted = number < step;

          const bgClass = isActive
            ? "bg-[#172965]" // deep blue
            : isCompleted
            ? "bg-[#64C247]" // light green for completed
            : "bg-slate-200";

          const textClass =
            isActive || isCompleted ? "text-white" : "text-slate-600";

          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${bgClass} ${textClass}`}
              >
                {number}
              </span>
              <span
                className={`font-medium ${
                  isActive ? "text-[#172965]" : "text-slate-500"
                }`}
              >
                {label}
              </span>
              {number !== steps.length && (
                <span className="mx-1 hidden h-px w-6 bg-slate-200 sm:inline-block" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function JobCreateWizard(props: any) {
  const { clientCompanies } = (props || {}) as { clientCompanies: ClientCompany[] };
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Step 1: Basics ---

  const [title, setTitle] = useState("");
  const [internalCode, setInternalCode] = useState("");
  const [clientCompanyId, setClientCompanyId] = useState("");
  const [confidentiality, setConfidentiality] = useState<
    "public" | "public_confidential" | "internal"
  >("public");
  const [location, setLocation] = useState("");
  const [locationCustom, setLocationCustom] = useState("");
  const [workMode, setWorkMode] = useState<"" | "onsite" | "hybrid" | "remote">("");
  const [employmentType, setEmploymentType] = useState("");
  const [seniority, setSeniority] = useState("");
  const [industry, setIndustry] = useState("");
  const [jobFunction, setJobFunction] = useState("");

  // --- Step 2: Role profile ---

  const [shortPitch, setShortPitch] = useState("");
  const [aboutClient, setAboutClient] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("");

  // --- Step 3: Criteria & compensation ---

  const [experienceMin, setExperienceMin] = useState("");
  const [experienceMax, setExperienceMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("NGN");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryVisible, setSalaryVisible] = useState(false);
  const [keySkills, setKeySkills] = useState<string[]>([]);

  // --- Step 4: Process & publish ---

  const [pipelineTemplate, setPipelineTemplate] = useState("executive");
  const [status, setStatus] = useState<"draft" | "open">("open");
  const [visibility, setVisibility] = useState<"public" | "internal" | "confidential">(
    "public"
  );
  const [internalNotes, setInternalNotes] = useState("");
  const [screeningNotes, setScreeningNotes] = useState("");

  const selectedClient = useMemo(
    () => clientCompanies?.find((c) => c.id === clientCompanyId) || null,
    [clientCompanies, clientCompanyId]
  );

  const effectiveLocation = location === "CUSTOM" ? locationCustom : location;

  const skillOptions = useMemo(() => {
    if (jobFunction && SKILLS_BY_FUNCTION[jobFunction]) {
      return SKILLS_BY_FUNCTION[jobFunction];
    }
    return GENERIC_SKILLS;
  }, [jobFunction]);

  function toggleSkill(skill: string) {
    setKeySkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function canGoNext(currentStep: number) {
    if (currentStep === 1) {
      return title.trim().length > 0;
    }
    if (currentStep === 2) {
      return shortPitch.trim().length > 0 && responsibilities.trim().length > 0;
    }
    return true;
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setError(null);

      const slugBase = `${title}${
        selectedClient?.slug ? "-" + selectedClient.slug : ""
      }`;
      const slug = slugify(slugBase);

      const isConfidential =
        confidentiality === "public_confidential" || confidentiality === "internal";

      const payload: any = {
        title,
        slug,
        internalCode: internalCode || null,
        clientCompanyId: clientCompanyId || null,
        location: effectiveLocation || null,
        employmentType: employmentType || null,
        seniority: seniority || null,
        workMode: workMode || null,
        industry: industry || null,
        function: jobFunction || null,

        // Candidate-facing copy
        shortDescription: shortPitch || null,
        overview: aboutClient || null,
        responsibilities: responsibilities || null,
        requirements: requirements || null,
        benefits: benefits || null,

        // Criteria
        yearsExperienceMin: experienceMin ? Number(experienceMin) : null,
        yearsExperienceMax: experienceMax ? Number(experienceMax) : null,
        salaryCurrency: salaryCurrency || null,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        salaryVisible,

        // Taxonomy
        requiredSkills: keySkills,
        tags: [industry, jobFunction].filter(Boolean),

        // Visibility / status
        internalOnly: visibility === "internal",
        confidential: isConfidential,
        visibility,
        status,

        // Process hints (for later use in backend)
        pipelineTemplate,
        internalNotes: internalNotes || null,
        screeningSchema: screeningNotes
          ? { notes: screeningNotes, version: 1 }
          : null,
      };

      const res = await fetch("/api/ats/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as ApiResponse;

      if (!res.ok) {
        throw new Error(data.error || "Failed to create job.");
      }

      if (data.id) {
        router.push(`/ats/jobs/${data.id}`);
      } else {
        router.push("/ats/jobs");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create job. Please try again.");
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  }

  function nextStep() {
    if (!canGoNext(step)) return;
    setStep((prev) => Math.min(prev + 1, 4));
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 1));
  }

  // --- Render individual steps ---

  function renderStep1() {
    return (
      <div className="grid gap-6 px-4 py-4 sm:grid-cols-[2fr,1.5fr] sm:px-6 sm:py-6">
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Job title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          {/* Internal code */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Internal reference (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. RES-QLIFE-DMD-2025-01"
              value={internalCode}
              onChange={(e) => setInternalCode(e.target.value)}
              className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          {/* Client + confidentiality */}
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Client (optional)
              </label>
              <select
                value={clientCompanyId}
                onChange={(e) => setClientCompanyId(e.target.value)}
                className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              >
                <option value="">Resourcin / internal mandate</option>
                {clientCompanies?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedClient && selectedClient.logoUrl && (
              <div className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
                <img
                  src={selectedClient.logoUrl}
                  alt={selectedClient.name}
                  className="h-8 w-8 rounded border border-slate-200 bg-white object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-800">
                    {selectedClient.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Logo shown on non-confidential searches.
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <span className="block text-[11px] font-medium text-slate-700">
                Confidentiality
              </span>
              <div className="grid gap-2 text-[11px] sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setConfidentiality("public")}
                  className={`rounded-md border px-2.5 py-1.5 text-left ${
                    confidentiality === "public"
                      ? "border-[#172965] bg-[#172965] text-white"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <div className="font-semibold">Public with branding</div>
                  <div className="mt-0.5 text-[10px] opacity-80">
                    Show client name & logo on careers page.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfidentiality("public_confidential")}
                  className={`rounded-md border px-2.5 py-1.5 text-left ${
                    confidentiality === "public_confidential"
                      ? "border-[#FFC000] bg-[#FFC000] text-[#172965]"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <div className="font-semibold">Public – confidential</div>
                  <div className="mt-0.5 text-[10px] opacity-80">
                    Hide client branding; use generic description.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfidentiality("internal")}
                  className={`rounded-md border px-2.5 py-1.5 text-left ${
                    confidentiality === "internal"
                      ? "border-[#306B34] bg-[#306B34] text-white"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <div className="font-semibold">Internal only</div>
                  <div className="mt-0.5 text-[10px] opacity-80">
                    Visible only in ATS / client portal.
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Location / work mode */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">
                Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              >
                <option value="">Select a location…</option>
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
                <option value="CUSTOM">Other (type manually)</option>
              </select>
              {location === "CUSTOM" && (
                <input
                  type="text"
                  placeholder="e.g. Victoria Island, Lagos or Remote – GMT+1 to GMT+3"
                  value={locationCustom}
                  onChange={(e) => setLocationCustom(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Work mode
              </label>
              <select
                value={workMode}
                onChange={(e) =>
                  setWorkMode(e.target.value as "" | "onsite" | "hybrid" | "remote")
                }
                className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              >
                <option value="">Select…</option>
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>

          {/* Employment type / seniority / industry / function */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Employment type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              >
                <option value="">Select…</option>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="interim">Interim / Fractional</option>
                <option value="consulting">Consulting / Project-based</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Seniority
              </label>
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              >
                <option value="">Select…</option>
                {SENIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              >
                <option value="">Select…</option>
                {INDUSTRY_OPTIONS.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Function
              </label>
              <select
                value={jobFunction}
                onChange={(e) => setJobFunction(e.target.value)}
                className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              >
                <option value="">Select…</option>
                {FUNCTION_OPTIONS.map((fn) => (
                  <option key={fn} value={fn}>
                    {fn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live preview card */}
        <div className="hidden rounded-l-lg border-l border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-700 sm:block">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Public preview
          </div>
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start gap-2">
              {selectedClient &&
                selectedClient.logoUrl &&
                confidentiality === "public" && (
                  <img
                    src={selectedClient.logoUrl}
                    alt={selectedClient.name}
                    className="mt-0.5 h-8 w-8 rounded border border-slate-200 bg-white object-contain"
                  />
                )}
              <div>
                <div className="text-xs font-semibold text-[#172965]">
                  {title || "Job title"}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {confidentiality === "public"
                    ? selectedClient?.name || "Resourcin"
                    : "Confidential client"}
                  {effectiveLocation && ` • ${effectiveLocation}`}
                  {employmentType && ` • ${employmentType.replace("_", " ")}`}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 line-clamp-3">
              {shortPitch ||
                "Short role pitch will appear here. Aim for 2–3 sentences that sell the opportunity."}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {industry && (
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                  {industry}
                </span>
              )}
              {jobFunction && (
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                  {jobFunction}
                </span>
              )}
              {workMode && (
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                  {workMode.charAt(0).toUpperCase() + workMode.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="grid gap-6 px-4 py-4 sm:grid-cols-[2fr,1.5fr] sm:px-6 sm:py-6">
        <div className="space-y-4">
          {/* Short pitch */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Short pitch (2–3 sentences) *
            </label>
            <textarea
              rows={3}
              value={shortPitch}
              onChange={(e) => setShortPitch(e.target.value)}
              placeholder="Summarise why this role matters, the impact, and why it’s interesting."
              className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          {/* About client */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              About the client / organisation
            </label>
            <textarea
              rows={3}
              value={aboutClient}
              onChange={(e) => setAboutClient(e.target.value)}
              placeholder="A short introduction to the client, sector, scale and mission."
              className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          {/* Responsibilities */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              What you&apos;ll do (key responsibilities) *
            </label>
            <textarea
              rows={6}
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              placeholder="Use bullet points – 6–10 bullets describing the most important outcomes and responsibilities."
              className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          {/* Requirements */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              What you&apos;ll bring (requirements)
            </label>
            <textarea
              rows={5}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Core experience, skills, and attributes needed to succeed."
              className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          {/* Benefits */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Compensation & benefits (high level)
            </label>
            <textarea
              rows={3}
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="Base + bonus, benefits, work environment, learning, etc."
              className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="hidden rounded-l-lg border-l border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-700 sm:block">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Candidate view – description
          </div>
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="text-xs font-semibold text-[#172965]">
              {title || "Job title"}
            </div>
            <p className="text-[11px] text-slate-700">
              {shortPitch ||
                "Your short pitch will appear here. Make it clear, concrete and compelling."}
            </p>

            {aboutClient && (
              <div>
                <div className="text-[11px] font-semibold text-slate-800">
                  About the organisation
                </div>
                <p className="mt-1 text-[11px] text-slate-600 whitespace-pre-line">
                  {aboutClient}
                </p>
              </div>
            )}

            {responsibilities && (
              <div>
                <div className="text-[11px] font-semibold text-slate-800">
                  What you&apos;ll do
                </div>
                <p className="mt-1 text-[11px] text-slate-600 whitespace-pre-line">
                  {responsibilities}
                </p>
              </div>
            )}

            {requirements && (
              <div>
                <div className="text-[11px] font-semibold text-slate-800">
                  What you&apos;ll bring
                </div>
                <p className="mt-1 text-[11px] text-slate-600 whitespace-pre-line">
                  {requirements}
                </p>
              </div>
            )}

            {benefits && (
              <div>
                <div className="text-[11px] font-semibold text-slate-800">
                  Compensation & benefits
                </div>
                <p className="mt-1 text-[11px] text-slate-600 whitespace-pre-line">
                  {benefits}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="grid gap-6 px-4 py-4 sm:grid-cols-[2fr,1.5fr] sm:px-6 sm:py-6">
        <div className="space-y-4">
          {/* Experience */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Min. years of experience
              </label>
              <input
                type="number"
                min={0}
                value={experienceMin}
                onChange={(e) => setExperienceMin(e.target.value)}
                className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Max. years of experience
              </label>
              <input
                type="number"
                min={0}
                value={experienceMax}
                onChange={(e) => setExperienceMax(e.target.value)}
                className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              />
            </div>
          </div>

          {/* Salary */}
          <div className="space-y-2">
            <div className="grid gap-3 sm:grid-cols-[0.7fr,1.3fr,1.3fr]">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Currency
                </label>
                <select
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                >
                  {CURRENCY_OPTIONS.map((cur) => (
                    <option key={cur} value={cur}>
                      {cur}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Min. annual gross
                </label>
                <input
                  type="number"
                  min={0}
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Max. annual gross
                </label>
                <input
                  type="number"
                  min={0}
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="salary_visible"
                type="checkbox"
                checked={salaryVisible}
                onChange={(e) => setSalaryVisible(e.target.checked)}
                className="h-3 w-3 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
              />
              <label
                htmlFor="salary_visible"
                className="text-[11px] text-slate-700"
              >
                Show this range on the public job page
              </label>
            </div>
          </div>

          {/* Skills taxonomy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-medium text-slate-700">
                Key skills for this role
              </label>
              {jobFunction && (
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">
                  Function: {jobFunction}
                </span>
              )}
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {skillOptions.map((skill) => {
                const selected = keySkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-[11px] ${
                      selected
                        ? "border-[#64C247] bg-[#64C247] text-[#172965]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span>{skill}</span>
                    {selected && (
                      <span className="ml-2 text-[13px]" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {keySkills.length > 0 && (
              <p className="mt-1 text-[11px] text-slate-500">
                {keySkills.length} skill
                {keySkills.length > 1 ? "s" : ""} selected – used for search,
                filtering and matching.
              </p>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="hidden rounded-l-lg border-l border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-700 sm:block">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Criteria preview
          </div>
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="text-xs font-semibold text-[#172965]">
              Search & filters
            </div>
            <ul className="space-y-1 text-[11px] text-slate-600">
              {experienceMin && (
                <li>
                  Experience: {experienceMin}
                  {experienceMax && ` – ${experienceMax}`} years
                </li>
              )}
              {(salaryMin || salaryMax) && (
                <li>
                  Salary:{" "}
                  {salaryMin && `from ${salaryCurrency} ${salaryMin}`}
                  {salaryMax && ` up to ${salaryCurrency} ${salaryMax}`}
                  {salaryVisible
                    ? " (shown on public page)"
                    : " (internal only)"}
                </li>
              )}
              {keySkills.length > 0 && (
                <li>Key skills: {keySkills.join(", ")}</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="grid gap-6 px-4 py-4 sm:grid-cols-[2fr,1.5fr] sm:px-6 sm:py-6">
        <div className="space-y-4">
          {/* Pipeline template */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Pipeline template
            </label>
            <select
              value={pipelineTemplate}
              onChange={(e) => setPipelineTemplate(e.target.value)}
              className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            >
              <option value="executive">Executive search</option>
              <option value="mid_level">Mid-level / specialist</option>
              <option value="volume">Volume / graduate</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              This controls the default stages created for this mandate in the
              ATS pipeline. You can refine it later.
            </p>
          </div>

          {/* Status & visibility */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Status
              </label>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setStatus("draft")}
                  className={`rounded-md border px-2.5 py-1.5 ${
                    status === "draft"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("open")}
                  className={`rounded-md border px-2.5 py-1.5 ${
                    status === "open"
                      ? "border-[#64C247] bg-[#64C247] text-[#172965]"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  Open
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Draft jobs are visible only to your internal team until you are
                ready to publish.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) =>
                  setVisibility(
                    e.target.value as "public" | "internal" | "confidential"
                  )
                }
                className="block w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
              >
                <option value="public">Public careers page</option>
                <option value="internal">Internal / client portal only</option>
                <option value="confidential">
                  Public, but marked as confidential
                </option>
              </select>
            </div>
          </div>

          {/* Screening notes */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Screening notes / application schema (optional)
            </label>
            <textarea
              rows={3}
              value={screeningNotes}
              onChange={(e) => setScreeningNotes(e.target.value)}
              placeholder="Notes about how to screen, or a rough outline of screening questions you want to configure later."
              className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>

          {/* Internal notes */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Internal notes (for Resourcin only)
            </label>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Context from client calls, non-negotiables, politics, etc. Not visible to candidates."
              className="block w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-[#172965] focus:outline-none focus:ring-1 focus:ring-[#172965]"
            />
          </div>
        </div>

        {/* Summary preview */}
        <div className="hidden rounded-l-lg border-l border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-700 sm:block">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Summary
          </div>
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="text-xs font-semibold text-[#172965]">
              {title || "Job title"}
            </div>
            <ul className="mt-1 space-y-1 text-[11px] text-slate-600">
              {selectedClient && (
                <li>
                  Client:{" "}
                  {confidentiality === "public"
                    ? selectedClient.name
                    : "Confidential client"}
                </li>
              )}
              {effectiveLocation && <li>Location: {effectiveLocation}</li>}
              {employmentType && (
                <li>Employment: {employmentType.replace("_", " ")}</li>
              )}
              {industry && <li>Industry: {industry}</li>}
              {jobFunction && <li>Function: {jobFunction}</li>}
              {seniority && <li>Seniority: {seniority}</li>}
              <li>Status: {status === "open" ? "Open" : "Draft"}</li>
              <li>
                Visibility:{" "}
                {visibility === "public"
                  ? "Public careers page"
                  : visibility === "internal"
                  ? "Internal only"
                  : "Public, but confidential"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // --- Main render ---

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <Stepper step={step} />

      {error && (
        <div className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 sm:mx-6">
          {error}
        </div>
      )}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-[#64C247]" />
          <span>Fields autosave once the job is created. You can edit later.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1 || submitting}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Back
          </button>

          {step < 4 && (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canGoNext(step) || submitting}
              className="rounded-md bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#111b4a] disabled:opacity-60"
            >
              Next
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center rounded-md bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#111b4a] disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create job"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
