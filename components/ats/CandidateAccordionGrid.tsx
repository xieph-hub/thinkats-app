// components/ats/CandidateGridAccordion.tsx
"use client";

import React, { useState } from "react";

export type Candidate = {
  id: string;
  fullName: string;
  currentRole?: string;
  company?: string;
  location?: string;
  keySkills?: string[]; // used for the top 3 tags
  headline?: string;
  yearsExperience?: number;
  email?: string;
  phone?: string;
  tags?: string[];
  lastContactedAt?: string;
  source?: string;
  cvUrl?: string;
  notes?: string;
};

type Props = {
  candidates: Candidate[];
  onViewProfile?: (id: string) => void;
};

export function CandidateGridAccordion({ candidates, onViewProfile }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!candidates.length) {
    return (
      <p className="text-xs text-slate-500">
        No candidates in this view yet.
      </p>
    );
  }

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {candidates.map((c) => {
        const isOpen = openId === c.id;
        const skillSlice = (c.keySkills ?? []).slice(0, 3);

        return (
          <article
            key={c.id}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm ring-1 ring-transparent transition hover:border-[#172965]/60 hover:bg-white hover:shadow-md hover:ring-[#172965]/5"
          >
            {/* Collapsed header */}
            <button
              type="button"
              onClick={() => toggle(c.id)}
              className="flex w-full items-start justify-between gap-2 text-left"
            >
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-slate-900">
                  {c.fullName}
                </h2>
                {(c.currentRole || c.company) && (
                  <p className="text-[11px] text-slate-500">
                    {c.currentRole}
                    {c.currentRole && c.company && (
                      <span className="mx-1 text-slate-300">•</span>
                    )}
                    {c.company}
                  </p>
                )}
                {c.location && (
                  <p className="text-[11px] text-slate-500">{c.location}</p>
                )}
              </div>
              <span className="mt-1 text-[11px] text-slate-400">
                {isOpen ? "Hide" : "View"}
              </span>
            </button>

            {/* Key skills */}
            {skillSlice.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {skillSlice.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Accordion content */}
            {isOpen && (
              <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
                {c.headline && (
                  <section>
                    <h3 className="text-[11px] font-semibold text-slate-900">
                      Summary
                    </h3>
                    <p className="mt-0.5 leading-relaxed">{c.headline}</p>
                  </section>
                )}

                <section>
                  <h3 className="text-[11px] font-semibold text-slate-900">
                    Contact
                  </h3>
                  <dl className="mt-1 grid grid-cols-2 gap-2">
                    {c.email && (
                      <div>
                        <dt className="text-[10px] font-medium text-slate-700">
                          Email
                        </dt>
                        <dd className="mt-0.5 break-all text-[11px]">
                          {c.email}
                        </dd>
                      </div>
                    )}
                    {c.phone && (
                      <div>
                        <dt className="text-[10px] font-medium text-slate-700">
                          Phone
                        </dt>
                        <dd className="mt-0.5 text-[11px]">{c.phone}</dd>
                      </div>
                    )}
                    {typeof c.yearsExperience === "number" && (
                      <div>
                        <dt className="text-[10px] font-medium text-slate-700">
                          Experience
                        </dt>
                        <dd className="mt-0.5 text-[11px]">
                          {c.yearsExperience} years
                        </dd>
                      </div>
                    )}
                    {c.source && (
                      <div>
                        <dt className="text-[10px] font-medium text-slate-700">
                          Source
                        </dt>
                        <dd className="mt-0.5 text-[11px]">{c.source}</dd>
                      </div>
                    )}
                    {c.lastContactedAt && (
                      <div>
                        <dt className="text-[10px] font-medium text-slate-700">
                          Last contacted
                        </dt>
                        <dd className="mt-0.5 text-[11px]">
                          {new Date(c.lastContactedAt).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>

                {c.tags && c.tags.length > 0 && (
                  <section>
                    <h3 className="text-[11px] font-semibold text-slate-900">
                      Tags
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {c.notes && (
                  <section>
                    <h3 className="text-[11px] font-semibold text-slate-900">
                      Internal notes
                    </h3>
                    <p className="mt-0.5 whitespace-pre-line leading-relaxed">
                      {c.notes}
                    </p>
                  </section>
                )}

                <div className="flex items-center justify-between pt-1">
                  {c.cvUrl ? (
                    <a
                      href={c.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#111c4c]"
                    >
                      View CV
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      CV not attached
                    </span>
                  )}

                  {onViewProfile && (
                    <button
                      type="button"
                      onClick={() => onViewProfile(c.id)}
                      className="text-[11px] font-semibold text-[#172965] hover:underline"
                    >
                      View full profile →
                    </button>
                  )}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
