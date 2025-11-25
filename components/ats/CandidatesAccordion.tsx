// components/ats/CandidatesAccordion.tsx
"use client";

import * as React from "react";
import Link from "next/link";

export type Candidate = {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  stage: string;
  status: string;
  created_at: string;
  cv_url: string | null;
  job: {
    id: string;
    title: string;
    slug: string | null;
  } | null;
};

type Props = {
  candidates: Candidate[];
};

export function CandidatesAccordion({ candidates }: Props) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  if (candidates.length === 0) {
    return (
      <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        No candidates yet. Once applications come in from your public job
        pages, they&apos;ll appear here.
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
      {candidates.map((candidate) => {
        const isOpen = openId === candidate.id;
        const jobLabel =
          candidate.job?.title ?? "Unknown role (check jobs table)";
        const jobSlugOrId = candidate.job?.slug ?? candidate.job_id;

        return (
          <div key={candidate.id} className="px-4 py-3">
            {/* Row header */}
            <button
              type="button"
              onClick={() =>
                setOpenId(isOpen ? null : candidate.id)
              }
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                  {initials(candidate.full_name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {candidate.full_name}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {jobLabel}
                  </p>
                </div>
              </div>
              <div className="hidden flex-col items-end text-[11px] text-slate-500 sm:flex">
                <p className="capitalize">
                  Stage:{" "}
                  <span className="font-medium text-slate-700">
                    {candidate.stage.toLowerCase()}
                  </span>
                </p>
                <p>
                  Applied {formatDate(candidate.created_at)}
                </p>
              </div>
              <div className="ml-2 text-slate-400">
                {isOpen ? (
                  <span aria-hidden="true">▴</span>
                ) : (
                  <span aria-hidden="true">▾</span>
                )}
              </div>
            </button>

            {/* Expanded panel */}
            {isOpen && (
              <div className="mt-3 space-y-3 text-[11px] text-slate-700">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="font-semibold text-slate-600">
                      Contact
                    </p>
                    <p className="mt-1">
                      <span className="block">{candidate.email}</span>
                      {candidate.phone && (
                        <span className="block text-slate-500">
                          {candidate.phone}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600">
                      Location
                    </p>
                    <p className="mt-1 text-slate-500">
                      {candidate.location ?? "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-600">
                      Status
                    </p>
                    <p className="mt-1 text-slate-500">
                      {candidate.stage} · {candidate.status}
                    </p>
                    <p className="text-slate-400">
                      Applied {formatDate(candidate.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* View CV */}
                  {candidate.cv_url ? (
                    <a
                      href={candidate.cv_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <span>View CV</span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-dashed border-slate-200 px-3 py-1 text-[11px] text-slate-400">
                      No CV on file
                    </span>
                  )}

                  {/* ATS job detail */}
                  <Link
                    href={`/ats/jobs/${candidate.job_id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <span>Open in ATS</span>
                  </Link>

                  {/* Public job page */}
                  <Link
                    href={`/jobs/${encodeURIComponent(jobSlugOrId)}`}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <span>View public role</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function initials(name: string) {
  const parts = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[1].charAt(0).toUpperCase()
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
