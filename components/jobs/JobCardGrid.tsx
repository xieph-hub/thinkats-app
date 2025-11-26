// components/jobs/JobCardGrid.tsx
"use client";

import React from "react";
import JobCard, { JobCardData } from "./JobCard";

export interface JobCardGridProps {
  jobs: JobCardData[];
  onOpenJob?: (job: JobCardData) => void;
  onApply?: (job: JobCardData) => void;
  onSave?: (job: JobCardData) => void;
}

export function JobCardGrid({
  jobs,
  onOpenJob,
  onApply,
  onSave,
}: JobCardGridProps) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-800">
          No open roles right now.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          As new mandates go live, they’ll appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
      {jobs.map((job) => (
        <article
          key={job.id}
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#172965] hover:shadow-md md:p-5"
        >
          {/* Main card content – reusing the underlying JobCard layout */}
          <button
            type="button"
            onClick={() => onOpenJob?.(job)}
            className="w-full text-left"
          >
            <JobCard job={job} />
          </button>

          {/* Footer: actions + social sharing */}
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onApply?.(job)}
                className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#111b4a]"
              >
                Apply now
                <span className="ml-1.5 text-[10px] opacity-80">↗</span>
              </button>

              {onSave && (
                <button
                  type="button"
                  onClick={() => onSave(job)}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Save role
                </button>
              )}
            </div>

            {/* Social share – LinkedIn, X, WhatsApp with logos */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Share
              </span>

              {/* LinkedIn */}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  job.shareUrl
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0A66C2]/10 text-[#0A66C2] transition hover:bg-[#0A66C2] hover:text-white"
                aria-label="Share on LinkedIn"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="currentColor"
                    d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8.32H4.8V24H.22V8.32zM8.67 8.32h4.39v2.13h.06c.61-1.16 2.11-2.39 4.34-2.39 4.64 0 5.49 3.05 5.49 7.02V24h-4.58v-7.49c0-1.79-.03-4.09-2.49-4.09-2.49 0-2.87 1.94-2.87 3.95V24H8.67V8.32z"
                  />
                </svg>
              </a>

              {/* X (Twitter) */}
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  job.shareUrl
                )}&text=${encodeURIComponent(job.title ?? "Role")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/5 text-slate-900 transition hover:bg-slate-900 hover:text-white"
                aria-label="Share on X"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="currentColor"
                    d="M18.9 2H21l-4.6 5.26L21.7 22h-4.6l-3.3-8.57L9 22H6.9l4.8-5.54L4.3 2h4.7l3 7.93L18.9 2z"
                  />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `${job.title ?? "Role"} – ${job.shareUrl}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] transition hover:bg-[#25D366] hover:text-white"
                aria-label="Share on WhatsApp"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="currentColor"
                    d="M17 14.5c-.3-.2-1.7-.9-1.9-1-.3-.1-.5-.2-.7.2s-.8 1-1 1.2-.4.2-.7 0-1.3-.5-2.4-1.5c-.9-.8-1.5-1.7-1.7-2-.2-.3 0-.5.1-.6s.3-.3.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5s-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5 4.6.7.3 1.3.5 1.7.6.7.2 1.3.2 1.7.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.2-.1-.5-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.4 4.9L2 22l5.3-1.4C8.7 21.5 10.3 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default JobCardGrid;
