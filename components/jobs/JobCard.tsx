"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";

export interface JobCardData {
  id: string;
  title: string;
  location: string;
  company?: string;
  department?: string;
  type?: string; // employment type (full_time, full-time, etc.)
  experienceLevel?: string; // e.g. "senior", "director_vp"
  workMode?: string; // e.g. "onsite", "remote"
  salary?: string;
  shortDescription?: string;
  tags?: string[];
  postedAt?: string; // ISO string
  shareUrl?: string; // relative or absolute URL
  applicants?: number;
  isConfidential?: boolean;

  // NEW: brand metadata for SaaS-style cards
  tenantName?: string;
  tenantLogoUrl?: string | null;
  clientName?: string;
  clientLogoUrl?: string | null;
}

export interface JobCardProps {
  job: JobCardData;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.resourcin.com";

// -----------------------------------------------------
// Helpers for human-friendly labels
// -----------------------------------------------------

function humanizeEnum(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join(" ");
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full Time",
  "full-time": "Full Time",
  part_time: "Part Time",
  "part-time": "Part Time",
  contract: "Contract",
  temporary: "Temporary",
  internship: "Internship",
  consulting: "Consulting / Advisory",
  consultant: "Consulting / Advisory",
};

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
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

const WORK_MODE_LABELS: Record<string, string> = {
  onsite: "Onsite",
  "on-site": "Onsite",
  hybrid: "Hybrid",
  remote: "Remote",
  "remote-first": "Remote-first",
  field_based: "Field-based",
  "field-based": "Field-based",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  // Leadership & General Management
  executive_leadership: "Executive Leadership (CEO, MD, Country Manager)",
  general_management: "General Management / Business Unit Head",
  strategy_corporate_dev: "Strategy & Corporate Development",
  project_program_management: "Project / Program Management",
  operations_management: "Operations Management",

  // Sales, Commercial & Growth
  sales_business_development: "Sales & Business Development",
  account_management_cs: "Account Management & Customer Success",
  partnerships_alliances: "Partnerships & Alliances",
  revenue_operations: "Revenue Operations (RevOps)",
  pre_sales_solutions: "Pre-sales & Solutions Consulting",

  // Marketing, Brand & Communications
  growth_marketing: "Growth / Performance Marketing",
  brand_marketing: "Brand Marketing & Communications",
  product_marketing: "Product Marketing",
  content_social_media: "Content & Social Media",
  pr_corporate_comms: "PR & Corporate Communications",

  // Product, Design & User Experience
  product_management: "Product Management",
  product_ownership: "Product Owner / Business Analyst",
  ux_ui_design: "UX / UI Design",
  service_design: "Service Design",
  research_insights: "User Research & Insights",

  // Engineering, Data & Technology
  software_engineering: "Software Engineering / Development",
  data_science_ml: "Data Science & Machine Learning",
  data_analytics: "Data Analytics / BI",
  devops_platform: "DevOps / SRE / Platform Engineering",
  cloud_infrastructure: "Cloud & Infrastructure Engineering",
  it_support: "IT Support & Helpdesk",
  cybersecurity: "Cybersecurity",
  qa_testing: "QA & Test Engineering",

  // People, HR & Talent
  people_hr: "People / HR Generalist",
  talent_acquisition: "Talent Acquisition / Recruitment",
  people_operations: "People Operations",
  learning_development: "Learning & Development / Talent Management",
  compensation_benefits: "Compensation & Benefits",

  // Finance, Risk & Legal
  finance_accounting: "Finance & Accounting",
  financial_planning_analysis: "Financial Planning & Analysis (FP&A)",
  audit_control: "Audit, Controls & Reporting",
  risk_compliance: "Risk & Compliance",
  legal_corporate_secretariat: "Legal & Corporate Secretariat",
  treasury_investments: "Treasury & Investments",

  // Real Estate, Property & Facilities
  real_estate_investments: "Real Estate Investments & Advisory",
  real_estate_development: "Real Estate Development / Projects",
  estate_agency_leasing: "Estate Agency, Sales & Leasing",
  property_facilities_management: "Property & Facilities Management",
  valuation_asset_management: "Valuation & Asset Management",

  // Operations, Supply Chain & Logistics
  business_operations: "Business / Process Operations",
  supply_chain_procurement: "Supply Chain & Procurement",
  logistics_fulfilment: "Logistics, Fulfilment & Fleet",
  manufacturing_production: "Manufacturing & Production",
  quality_assurance_ops: "Quality Assurance & Control (Operations)",

  // Customer Support, Service & Experience
  customer_support: "Customer Support / Service",
  contact_centre_bpo: "Contact Centre / BPO Operations",
  service_delivery: "Service Delivery & Implementation",

  // Creative, Media & Content
  creative_direction: "Creative Direction & Brand Studio",
  graphic_motion_design: "Graphic & Motion Design",
  video_photo_content: "Video, Photography & Multimedia",
  copywriting_editing: "Copywriting & Editorial",

  // Healthcare, Life Sciences & Social Impact
  clinical_medical: "Clinical & Medical Practice",
  nursing_allied_health: "Nursing & Allied Health",
  public_health: "Public Health & Health Programs",
  pharmaceutical_biotech: "Pharmaceutical & Biotech",
  social_impact_nonprofit: "Social Impact & Non-profit Programs",

  // Education, Training & Research
  teaching_education: "Teaching & Education",
  corporate_training: "Corporate Training & Facilitation",
  academic_research: "Academic & Applied Research",
  edtech_product_ops: "EdTech Product & Operations",

  // Admin, Office & Support
  executive_assistant: "Executive Assistant & EA Support",
  office_admin: "Office Administration & Front Desk",
  general_support_staff: "General Support Staff",

  // Other / Multi-disciplinary
  multi_disciplinary: "Multi-disciplinary / Hybrid Role",
  other_specify_in_summary: "Other – described in role summary",
};

function formatEmploymentType(value?: string) {
  if (!value) return "";
  return EMPLOYMENT_TYPE_LABELS[value] ?? humanizeEnum(value);
}

function formatExperienceLevel(value?: string) {
  if (!value) return "";
  return EXPERIENCE_LEVEL_LABELS[value] ?? humanizeEnum(value);
}

function formatWorkMode(value?: string) {
  if (!value) return "";
  return WORK_MODE_LABELS[value] ?? humanizeEnum(value);
}

function formatDepartment(value?: string) {
  if (!value) return "";
  return DEPARTMENT_LABELS[value] ?? humanizeEnum(value);
}

function formatPostedAt(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function MetaItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-700">
      <span className="text-slate-500" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}

// Icons

function IconLocation() {
  return (
    <svg
      className="h-3.5 w-3.5 text-red-500"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5c0 3.038 3.287 6.87 4.063 7.69a.6.6 0 0 0 .874 0C11.213 13.87 14.5 10.038 14.5 7A4.5 4.5 0 0 0 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="10" cy="7" r="1.6" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg
      className="h-3.5 w-3.5 text-slate-600"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <circle cx="10" cy="10" r="6.2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M10 3.8c-1.5 1.7-2.3 3.9-2.3 6.2 0 2.3.8 4.5 2.3 6.2m0-12.4c1.5 1.7 2.3 3.9 2.3 6.2 0 2.3-.8 4.5-2.3 6.2M4.2 10h11.6"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg
      className="h-3.5 w-3.5 text-amber-700"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="3"
        y="6"
        width="14"
        height="9"
        rx="1.7"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M7.5 6V5.4A1.9 1.9 0 0 1 9.4 3.5h1.2a1.9 1.9 0 0 1 1.9 1.9V6"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M3.5 9.5h4m5 0h4"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconClock() {
  return (
    <svg
      className="h-3.5 w-3.5 text-orange-500"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
    >
      <circle cx="10" cy="10" r="6.2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M10 6.4v3.5l2 1.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Social icons

function LinkedInIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-[#0A66C2]"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8.25h4.56V24H.22zM8.34 8.25h4.37v2.13h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.47 3.04 5.47 6.99V24h-4.56v-7.22c0-1.72-.03-3.93-2.4-3.93-2.4 0-2.77 1.87-2.77 3.8V24H8.34z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-black"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M18.5 2h-3.1L12 7.2 8.8 2H2l6.7 10.1L2.4 22h3.1L12 14.7 16 22h6.8l-7-10.6L21.6 2h-3.1L14 8.4z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-[#25D366]"
      viewBox="0 0 32 32"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M16.04 4C9.96 4 5 8.96 5 15.02c0 2.38.72 4.6 2.09 6.5L5 28l6.63-2.07c1.84 1 3.9 1.53 6.01 1.53h.01C22.1 27.46 27 22.5 27 16.44 27 10.38 22.12 4 16.04 4zm-.01 20.9c-1.8 0-3.56-.48-5.1-1.38l-.37-.22-3.93 1.23 1.28-3.84-.24-.39A8.7 8.7 0 0 1 7.3 15c0-4.84 3.93-8.78 8.77-8.78 4.77 0 8.66 3.94 8.66 8.78 0 4.83-3.9 8.9-8.66 8.9zm4.78-6.63c-.26-.13-1.53-.76-1.77-.84-.24-.09-.41-.13-.58.12-.17.26-.67.84-.82 1-.15.17-.3.19-.56.06-.26-.13-1.09-.4-2.08-1.28-.77-.69-1.29-1.54-1.44-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.39-.8-1.9-.21-.5-.42-.44-.58-.45l-.5-.01c-.17 0-.45.06-.69.32-.24.26-.9.88-.9 2.14 0 1.26.92 2.48 1.05 2.65.13.17 1.81 2.86 4.4 4.02.62.27 1.11.43 1.49.55.63.2 1.2.17 1.65.1.5-.08 1.53-.62 1.75-1.22.22-.6.22-1.11.15-1.22-.06-.11-.24-.17-.5-.3z" />
    </svg>
  );
}

export default function JobCard({ job }: JobCardProps) {
  const {
    id,
    title,
    company,
    location,
    department,
    type,
    experienceLevel,
    workMode,
    salary,
    shortDescription,
    tags = [],
    postedAt,
    shareUrl,
    isConfidential,
    tenantName,
    tenantLogoUrl,
    clientName,
    clientLogoUrl,
  } = job;

  const url =
    shareUrl && shareUrl.startsWith("http")
      ? shareUrl
      : `${BASE_URL}${shareUrl || `/jobs/${encodeURIComponent(id)}`}`;

  const postedLabel = formatPostedAt(postedAt);

  const displayEmploymentType = type ? formatEmploymentType(type) : undefined;
  const displayExperienceLevel = experienceLevel
    ? formatExperienceLevel(experienceLevel)
    : undefined;
  const displayWorkMode = workMode ? formatWorkMode(workMode) : undefined;
  const displayDepartment = department
    ? formatDepartment(department)
    : undefined;

  const displayCompany =
    company ||
    clientName ||
    tenantName ||
    (isConfidential
      ? "Confidential search · via Resourcin"
      : "Resourcin");

  const shareText = encodeURIComponent(
    `${title}${location ? ` – ${location}` : ""} (via Resourcin)`,
  );
  const encodedUrl = encodeURIComponent(url);

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`;

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="space-y-2">
        {/* Brand (logos + names) + title */}
        <div className="space-y-1">
          <BrandCluster
            tenantName={tenantName || null}
            tenantLogoUrl={tenantLogoUrl || null}
            clientName={clientName || null}
            clientLogoUrl={clientLogoUrl || null}
          />

          <h2 className="text-sm font-semibold text-slate-900">
            <Link
              href={url}
              className="hover:text-[#172965] hover:underline"
            >
              {title}
            </Link>
          </h2>
          <p className="mt-0.5 text-[11px] font-medium text-slate-600">
            {displayCompany}
          </p>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
          {location && <MetaItem icon={<IconLocation />} label={location} />}
          {displayWorkMode && (
            <MetaItem icon={<IconGlobe />} label={displayWorkMode} />
          )}
          {displayEmploymentType && (
            <MetaItem icon={<IconBriefcase />} label={displayEmploymentType} />
          )}
          {displayExperienceLevel && (
            <MetaItem icon={<IconClock />} label={displayExperienceLevel} />
          )}
        </div>

        {/* Department + salary + posted */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
          {displayDepartment && (
            <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
              {displayDepartment}
            </span>
          )}
          {salary && (
            <span className="text-[11px] text-emerald-700">
              <span className="font-medium">Comp:</span> {salary}
            </span>
          )}
          {postedLabel && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <IconClock />
              <span>Posted {postedLabel}</span>
            </span>
          )}
        </div>

        {/* Description */}
        {shortDescription && (
          <p className="mt-1 line-clamp-3 text-xs text-slate-700">
            {shortDescription}
          </p>
        )}
      </div>

      {/* Tags + actions */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-slate-500">
              +{tags.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100"
            aria-label="Share on LinkedIn"
          >
            <LinkedInIcon />
          </a>
          <a
            href={xUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100"
            aria-label="Share on X"
          >
            <XIcon />
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100"
            aria-label="Share on WhatsApp"
          >
            <WhatsAppIcon />
          </a>
          <Link
            href={url}
            className="text-[11px] font-semibold text-[#172965] hover:underline"
          >
            View →
          </Link>
        </div>
      </div>
    </article>
  );
}

function BrandCluster({
  tenantName,
  tenantLogoUrl,
  clientName,
  clientLogoUrl,
}: {
  tenantName: string | null;
  tenantLogoUrl: string | null;
  clientName: string | null;
  clientLogoUrl: string | null;
}) {
  const primary = clientName || tenantName || "Confidential client";
  const secondary =
    clientName && tenantName ? `via ${tenantName}` : null;

  const tenantInitial =
    (tenantName?.charAt(0)?.toUpperCase?.() as string) || "T";
  const clientInitial =
    (clientName?.charAt(0)?.toUpperCase?.() as string) || "C";

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        <BrandAvatar
          logoUrl={tenantLogoUrl}
          fallback={tenantInitial}
          tint="blue"
          size="md"
        />
        {clientName && (
          <BrandAvatar
            logoUrl={clientLogoUrl}
            fallback={clientInitial}
            tint="green"
            size="sm"
          />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold text-slate-900">
          {primary}
        </span>
        {secondary && (
          <span className="text-[10px] text-slate-500">{secondary}</span>
        )}
      </div>
    </div>
  );
}

function BrandAvatar({
  logoUrl,
  fallback,
  tint = "blue",
  size = "md",
}: {
  logoUrl: string | null;
  fallback: string;
  tint?: "blue" | "green";
  size?: "md" | "sm";
}) {
  const sizeClasses =
    size === "md" ? "h-8 w-8 text-[11px]" : "h-6 w-6 text-[10px]";
  const bgClass =
    tint === "blue"
      ? "bg-[#172965]/5 text-[#172965]"
      : "bg-[#64C247]/10 text-[#306B34]";

  if (logoUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-md border border-slate-200 bg-white ${sizeClasses}`}
      >
        <Image
          src={logoUrl}
          alt="Logo"
          fill
          sizes={size === "md" ? "32px" : "24px"}
          className="object-contain p-0.5"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-md border border-slate-200 ${bgClass} ${sizeClasses}`}
    >
      {fallback}
    </div>
  );
}
