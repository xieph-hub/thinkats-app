// components/jobs/JobCardGrid.tsx
"use client";

import React from "react";
import JobCard, { JobCardData } from "./JobCard";

export interface JobCardGridProps {
  jobs: JobCardData[];
  onOpenJob?: (job: JobCardData) => void;
  onApply?: (job: JobCardData) => void;
  onSave?: (job: JobCardData) => void; // kept for compatibility, not rendered
}

const JobCardGrid: React.FC<JobCardGridProps> = ({
  jobs,
  onOpenJob,
  onApply,
}) => {
  if (!jobs || jobs.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No roles found for your current filters.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {jobs.map((job) => {
        const shareUrl = job.shareUrl ?? "#";
        const title = job.title || "Role at Resourcin";

        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedTitle = encodeURIComponent(title);

        const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        const xHref = `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        const whatsappHref = `https://wa.me/?text=${encodedTitle}%20-%20${encodedUrl}`;

        return (
          <article
            key={job.id}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {/* Clickable body opens role */}
            <button
              type="button"
              className="flex-1 text-left"
              onClick={() => onOpenJob?.(job)}
            >
              <JobCard job={job} />
            </button>

            {/* Footer: social sharing + Apply button */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                {/* LinkedIn */}
                <a
                  href={linkedInHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-sm transition hover:opacity-90"
                  aria-label="Share on LinkedIn"
                >
                  <span className="text-[15px] font-bold leading-none">in</span>
                </a>

                {/* X / Twitter */}
                <a
                  href={xHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-white shadow-sm transition hover:opacity-90"
                  aria-label="Share on X"
                >
                  <span className="text-[14px] font-semibold leading-none">
                    X
                  </span>
                </a>

                {/* WhatsApp – proper green bubble logo */}
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition hover:opacity-90"
                  aria-label="Share on WhatsApp"
                >
                  <svg
                    viewBox="0 0 32 32"
                    aria-hidden="true"
                    className="h-4 w-4"
                  >
                    <path
                      fill="currentColor"
                      d="M16 6a10 10 0 0 0-8.66 15.06L6 26l5.11-1.34A10 10 0 1 0 16 6zm0 2a8 8 0 0 1 6.86 12.24l-.2.32A8 8 0 0 1 9.1 12.1 8 8 0 0 1 16 8zm-3.17 4.4c-.24-.05-.47-.1-.68-.03-.2.06-.62.3-.62.73 0 .43.36 1.26.83 1.98.42.65 1.33 1.8 2.86 2.52 1.41.65 1.9.59 2.23.52.34-.06 1.1-.45 1.25-.9.16-.45.16-.84.11-.92-.05-.08-.18-.13-.38-.23s-1.1-.54-1.27-.6c-.17-.06-.3-.1-.43.1-.13.2-.5.6-.61.72-.11.13-.22.14-.41.05-.2-.1-.83-.34-1.58-1.04-.58-.54-.96-1.2-1.07-1.4-.11-.19-.01-.29.08-.39.08-.08.2-.22.29-.33.1-.11.13-.19.2-.32.07-.13.03-.27-.01-.37-.03-.1-.9-2.15-1.23-2.95-.32-.8-.33-.76-.45-.79z"
                    />
                  </svg>
                </a>
              </div>

              <button
                type="button"
                onClick={() => onApply?.(job)}
                className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#111b4a]"
              >
                Apply for this role
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export { JobCardGrid };
export default JobCardGrid;
