"use client";

import React, { useState } from "react";

export type CandidateCard = {
  id: string;
  fullName: string;
  currentTitle?: string;
  company?: string;
  location?: string;
  keySkills: string[];      // top 3–5 skills for collapsed view
  allSkills?: string[];     // full list for expanded view
  yearsExperience?: number;
  email?: string;
  phone?: string;
  summary?: string;         // short bio / profile summary
};

type Props = {
  candidates: CandidateCard[];
  onViewProfile?: (id: string) => void;
};

export function CandidateAccordionGrid({ candidates, onViewProfile }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!candidates.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-xs text-slate-500">
        No candidates saved yet. Once you add people to your talent database,
        they will appear here.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {candidates.map((candidate) => {
        const isOpen = candidate.id === openId;
        const topSkills = candidate.keySkills.slice(0, 3);

        return (
          <article
            key={candidate.id}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm ring-1 ring-transparent transition hover:border-[#172965]/70 hover:bg-white hover:shadow-md hover:ring-[#172965]/5"
          >
            {/* Header row (always visible) */}
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : candidate.id)}
              className="flex w-full items-start justify-between gap-3 text-left"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900">
                  {candidate.fullName}
                </h3>
                <p className="text-[11px] text-slate-600">
                  {candidate.currentTitle || "Role not specified"}
                  {candidate.company ? ` • ${candidate.company}` : ""}
                </p>
                {candidate.location && (
                  <p className="text-[11px] text-slate-500">
                    {candidate.location}
                  </p>
                )}
                {topSkills.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {topSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                <span>{isOpen ? "Hide" : "Details"}</span>
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[9px] transition ${
                    isOpen ? "rotate-90" : ""
                  }`}
                >
                  ▸
                </span>
              </div>
            </button>

            {/* Expanded area */}
            {isOpen && (
              <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-700">
                {candidate.summary && (
                  <p className="text-slate-700">{candidate.summary}</p>
                )}

                {(candidate.allSkills && candidate.allSkills.length > 0) && (
                  <section className="mt-3 space-y-1">
                    <h4 className="font-semibold text-slate-900">Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.allSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center rounded-full bg-[#172965]/5 px-2 py-0.5 text-[10px] font-medium text-slate-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {(candidate.email || candidate.phone) && (
                  <section className="mt-3 space-y-1">
                    <h4 className="font-semibold text-slate-900">
                      Contact details
                    </h4>
                    <dl className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      {candidate.email && (
                        <div>
                          <dt className="font-medium text-slate-700">Email</dt>
                          <dd className="mt-0.5 break-all">
                            <a
                              href={`mailto:${candidate.email}`}
                              className="hover:text-[#172965]"
                            >
                              {candidate.email}
                            </a>
                          </dd>
                        </div>
                      )}
                      {candidate.phone && (
                        <div>
                          <dt className="font-medium text-slate-700">Phone</dt>
                          <dd className="mt-0.5">{candidate.phone}</dd>
                        </div>
                      )}
                    </dl>
                  </section>
                )}

                <div className="mt-4 flex items-center justify-between">
                  {candidate.yearsExperience != null && (
                    <p className="text-[10px] text-slate-500">
                      Approx.{" "}
                      <span className="font-semibold text-slate-700">
                        {candidate.yearsExperience} year
                        {candidate.yearsExperience === 1 ? "" : "s"}
                      </span>{" "}
                      of experience
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onViewProfile?.(candidate.id)}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-800 hover:border-[#172965] hover:bg-slate-50"
                  >
                    View full profile
                    <span className="ml-1 text-[11px]" aria-hidden="true">
                      →
                    </span>
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
