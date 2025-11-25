// components/ats/CandidatesAccordion.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

type Candidate = {
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
  job?: {
    id: string;
    title: string;
    slug: string | null;
  } | null;
};

type Props = {
  candidates: Candidate[];
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function buildCvUrl(path: string | null): string | null {
  if (!path) return null;
  if (!SUPABASE_URL) return path;
  // cv_url stores the *path* in resourcin-uploads
  return `${SUPABASE_URL}/storage/v1/object/public/resourcin-uploads/${path}`;
}

function statusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "PENDING") return "bg-slate-50 text-slate-700 border-slate-200";
  if (s === "IN_REVIEW" || s === "REVIEW") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (s === "INTERVIEW") return "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "OFFER") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "REJECTED")
    return "bg-rose-50 text-rose-700 border-rose-200 line-through";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export function CandidatesAccordion({ candidates }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!candidates.length) {
    return (
      <p className="mt-4 text-sm text-slate-500">
        No candidates in the ATS yet. Once applications come in, they&apos;ll
        appear here.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {candidates.map((c) => {
        const isOpen = openId === c.id;
        const job = c.job ?? null;
        const jobSlugOrId = job?.slug ?? job?.id ?? null;
        const cvUrl = buildCvUrl(c.cv_url);

        return (
          <section
            key={c.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            {/* Header row (click to expand) */}
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : c.id)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex flex-col min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {c.full_name}
                    </span>
                    <span className="truncate text-[11px] text-slate-500">
                      {c.email}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {job && (
                      <span className="truncate">
                        <span className="font-medium text-slate-700">
                          {job.title}
                        </span>
                      </span>
                    )}
                    {c.location && (
                      <span className="truncate">{c.location}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 text-[11px]">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusClass(
                    c.status
                  )}`}
                >
                  {c.stage} · {c.status}
                </span>
                <span className="text-[10px] text-slate-500">
                  Applied {formatDate(c.created_at)}
                </span>
              </div>
            </button>

            {/* Expanded body */}
            {isOpen && (
              <div className="border-t border-slate-100 px-3 py-3 text-xs text-slate-700">
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Candidate
                    </p>
                    <p>{c.full_name}</p>
                    <p className="text-slate-500">{c.email}</p>
                    {c.phone && (
                      <p className="text-slate-500">
                        Phone: <span className="text-slate-700">{c.phone}</span>
                      </p>
                    )}
                    {c.location && (
                      <p className="text-slate-500">
                        Location:{" "}
                        <span className="text-slate-700">{c.location}</span>
                      </p>
                    )}
                  </div>

                  {job && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Job
                      </p>
                      <p className="text-slate-700">{job.title}</p>
                      {jobSlugOrId && (
                        <p className="text-slate-500">
                          Job ID:{" "}
                          <span className="font-mono text-[11px] text-slate-700">
                            {job.id}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action row */}
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  {cvUrl && (
                    <a
                      href={cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <span aria-hidden="true">📄</span>
                      <span>View CV</span>
                    </a>
                  )}

                  {job && (
                    <Link
                      href={`/ats/jobs/${job.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <span aria-hidden="true">📊</span>
                      <span>Open ATS job</span>
                    </Link>
                  )}

                  {jobSlugOrId && (
                    <Link
                      href={`/jobs/${encodeURIComponent(jobSlugOrId)}`}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <span aria-hidden="true">🌐</span>
                      <span>View public job</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
