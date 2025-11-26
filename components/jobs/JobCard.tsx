// components/jobs/JobCard.tsx
import React from "react";

export interface JobCardData {
  id: string;
  title: string;
  company?: string;
  location?: string;
  department?: string;
  employmentType?: string;
  experienceLevel?: string;
  workMode?: string;
  salary?: string | null;
  shortDescription?: string;
  tags?: string[];
  postedAt?: string;
  shareUrl?: string;
  isConfidential?: boolean;

  // keep these optional in case other parts of the app use them now or later
  type?: string;
  applicants?: number;
  statusLabel?: string;
}

interface JobCardProps {
  job: JobCardData;
}

/** Utility: format "Posted" date nicely */
function formatPosted(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/** Generic pill wrapper */
function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700">
      {children}
    </span>
  );
}

/** Icon: red location pin */
function LocationIcon() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50 text-red-500">
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
      >
        <path
          d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5c0 3.038 3.287 6.87 4.063 7.69a.6.6 0 0 0 .874 0C11.213 13.87 14.5 10.038 14.5 7A4.5 4.5 0 0 0 10 2.5Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <circle
          cx="10"
          cy="7"
          r="1.6"
          stroke="currentColor"
          strokeWidth="1.3"
        />
      </svg>
    </span>
  );
}

/** Icon: globe for work mode (remote / hybrid / onsite) */
function WorkModeIcon() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-50 text-sky-600">
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
      >
        <circle
          cx="10"
          cy="10"
          r="6.2"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path
          d="M10 3.8c-1.5 1.7-2.3 3.9-2.3 6.2 0 2.3.8 4.5 2.3 6.2m0-12.4c1.5 1.7 2.3 3.9 2.3 6.2 0 2.3-.8 4.5-2.3 6.2M4.2 10h11.6"
          stroke="currentColor"
          strokeWidth="1.1"
        />
      </svg>
    </span>
  );
}

/** Icon: briefcase for employment type (full-time, contract, etc.) */
function BriefcaseIcon() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-700">
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
      >
        <rect
          x="3"
          y="6"
          width="14"
          height="9"
          rx="1.8"
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
    </span>
  );
}

/** Optional: small dot + text status, kept subtle */
function StatusDot({ label }: { label?: string }) {
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {label}
    </span>
  );
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const {
    title,
    company,
    location,
    department,
    employmentType,
    experienceLevel,
    workMode,
    salary,
    shortDescription,
    tags = [],
    postedAt,
    isConfidential,
    statusLabel,
  } = job;

  const posted = formatPosted(postedAt);

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-md">
      {/* Title + company row */}
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-900">
            {title || "Untitled role"}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            {company && (
              <span className="font-medium text-slate-800">
                {isConfidential
                  ? "Confidential search – via Resourcin"
                  : company}
              </span>
            )}
            {department && (
              <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                {department}
              </span>
            )}
            {statusLabel && <StatusDot label={statusLabel} />}
          </div>
        </div>

        {salary && (
          <div className="ml-auto text-right">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Range
            </p>
            <p className="text-xs font-semibold text-slate-900">{salary}</p>
          </div>
        )}
      </header>

      {/* Meta icons row – THIS is the part we’re “giving life” */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {location && (
          <MetaPill>
            <LocationIcon />
            <span className="truncate">{location}</span>
          </MetaPill>
        )}

        {workMode && (
          <MetaPill>
            <WorkModeIcon />
            <span className="truncate">{workMode}</span>
          </MetaPill>
        )}

        {employmentType && (
          <MetaPill>
            <BriefcaseIcon />
            <span className="truncate">{employmentType}</span>
          </MetaPill>
        )}

        {experienceLevel && (
          <MetaPill>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-50 text-violet-600">
              <span className="text-[9px] font-semibold leading-none">
                Exp
              </span>
            </span>
            <span className="truncate">{experienceLevel}</span>
          </MetaPill>
        )}
      </div>

      {/* Short description */}
      {shortDescription && (
        <p className="text-xs text-slate-700">{shortDescription}</p>
      )}

      {/* Footer: tags + posted */}
      <footer className="mt-1 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500">
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              +{tags.length - 4} more
            </span>
          )}
        </div>

        {posted && (
          <span className="ml-auto text-[10px] text-slate-500">
            Posted {posted}
          </span>
        )}
      </footer>
    </article>
  );
};

export default JobCard;
