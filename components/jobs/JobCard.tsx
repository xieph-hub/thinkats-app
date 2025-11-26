// components/jobs/JobCard.tsx

import React from "react";

// Shared data shape for all job cards
export type JobCardData = {
  id: string;
  title: string;

  // Core info
  company?: string | null;
  location?: string | null;
  department?: string | null;

  // Employment details
  type?: string | null; // e.g. "Full time"
  employmentType?: string | null; // alt key, e.g. from DB
  experienceLevel?: string | null; // e.g. "Senior"
  workMode?: string | null; // e.g. "Remote", "Hybrid"

  // Compensation
  salary?: string | null; // e.g. "₦12m – ₦18m"

  // Meta
  applicants?: number | null;
  shortDescription?: string | null;
  tags?: string[] | null;
  postedAt?: string | null; // ISO string or already formatted
  shareUrl?: string | null;
  isConfidential?: boolean | null;
};

type JobCardProps = {
  job: JobCardData;
};

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const {
    title,
    company,
    location,
    department,
    type,
    employmentType,
    experienceLevel,
    workMode,
    salary,
    applicants,
    shortDescription,
    tags,
    postedAt,
    isConfidential,
  } = job;

  const safeTitle = title || "Untitled role";

  const safeCompany = isConfidential
    ? "Confidential search – via Resourcin"
    : company || "Resourcin mandate";

  // Build little chips like: "Lagos" • "Hybrid" • "Full time" • "Senior"
  const metaChips: string[] = [];
  if (location) metaChips.push(location);
  if (workMode) metaChips.push(workMode);
  if (employmentType || type) metaChips.push(employmentType || type);
  if (experienceLevel) metaChips.push(experienceLevel);

  let postedLabel = "";
  if (postedAt) {
    const d = new Date(postedAt);
    if (!isNaN(d.getTime())) {
      postedLabel = d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } else {
      postedLabel = postedAt; // if you already passed a human label
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header: title + company + department + posted tag */}
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 md:text-base">
            {safeTitle}
          </h2>

          <p className="mt-0.5 text-xs font-medium text-[#172965] md:text-[13px]">
            {safeCompany}
          </p>

          {department && (
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-slate-400">
              {department}
            </p>
          )}
        </div>

        {postedLabel && (
          <span className="rounded-full bg-[#FFC000]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#946200]">
            Posted {postedLabel}
          </span>
        )}
      </header>

      {/* Meta chips: location / work mode / type / seniority */}
      {metaChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {metaChips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Short description */}
      {shortDescription && (
        <p className="text-xs text-slate-600 md:text-[13px]">
          {shortDescription}
        </p>
      )}

      {/* Salary + applicants */}
      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
        {salary && (
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#306B34]" />
            <span className="font-medium text-slate-700">{salary}</span>
          </span>
        )}

        {typeof applicants === "number" && applicants >= 0 && (
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span>{applicants} applicants</span>
          </span>
        )}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-[#172965]/5 px-2 py-0.5 text-[10px] font-medium text-[#172965]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Keep both named *and* default exports so all imports are happy
export default JobCard;
