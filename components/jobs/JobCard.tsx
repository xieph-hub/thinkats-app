// components/jobs/JobCard.tsx

import React from "react";

export type JobCardData = {
  id: string;
  title: string;
  company?: string | null;
  location?: string | null;
  department?: string | null;
  type?: string | null; // e.g. "Full time"
  employmentType?: string | null; // alt key, often from DB
  experienceLevel?: string | null; // e.g. "Senior"
  workMode?: string | null; // e.g. "Remote", "Hybrid"
  salary?: string | null; // formatted label, e.g. "₦12m – ₦18m"
  applicants?: number | null; // kept in type, not rendered
  shortDescription?: string | null;
  tags?: string[] | null;
  postedAt?: string | null; // ISO string or already formatted
  shareUrl?: string | null;
  isConfidential?: boolean | null;
};

type JobCardProps = {
  job: JobCardData;
};

// Small inline icons – no dependency on external icon libraries
const IconLocation = () => (
  <svg
    className="h-3.5 w-3.5 text-slate-400"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M12 2a7 7 0 0 0-7 7c0 4.08 4.1 8.58 6.15 10.57a1.2 1.2 0 0 0 1.7 0C14.9 17.58 19 13.08 19 9a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z"
    />
  </svg>
);

const IconWorkMode = () => (
  <svg
    className="h-3.5 w-3.5 text-slate-400"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M4 5a2 2 0 0 1 2-2h12a1 1 0 0 1 .8 1.6L18 7h1a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2 0v2h7l2-2z"
    />
  </svg>
);

const IconContract = () => (
  <svg
    className="h-3.5 w-3.5 text-slate-400"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M7 3a2 2 0 0 0-2 2v14l3-2 3 2 3-2 3 2V5a2 2 0 0 0-2-2zm0 2h10v10.59l-1-.67-2 1.33-3-2-3 2-1 .67z"
    />
  </svg>
);

const MetaPill: React.FC<{ icon: React.ReactNode; label: string }> = ({
  icon,
  label,
}) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
    {icon}
    <span>{label}</span>
  </span>
);

const JobCard: React.FC<JobCardProps> = ({ job }) => {
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
    shortDescription,
    tags,
    postedAt,
    isConfidential,
  } = job;

  const safeTitle = title || "Untitled role";

  const safeCompany = isConfidential
    ? "Confidential search – via Resourcin"
    : company || "Resourcin mandate";

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
      postedLabel = postedAt;
    }
  }

  const metaPills: { key: string; icon: React.ReactNode; label: string }[] = [];

  if (location) {
    metaPills.push({
      key: "location",
      icon: <IconLocation />,
      label: location,
    });
  }

  if (workMode) {
    metaPills.push({
      key: "workMode",
      icon: <IconWorkMode />,
      label: workMode,
    });
  }

  if (employmentType || type) {
    metaPills.push({
      key: "type",
      icon: <IconContract />,
      label: employmentType || type || "",
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Title + company + dept + posted tag */}
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

      {/* Meta row with icons */}
      {metaPills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {metaPills.map((pill) => (
            <MetaPill key={pill.key} icon={pill.icon} label={pill.label} />
          ))}
        </div>
      )}

      {/* Short description */}
      {shortDescription && (
        <p className="text-xs text-slate-600 md:text-[13px]">
          {shortDescription}
        </p>
      )}

      {/* Salary only – no applicant counts */}
      {salary && (
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#306B34]" />
            <span className="font-medium text-slate-700">{salary}</span>
          </span>
        </div>
      )}

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

export { JobCard };
export default JobCard;
