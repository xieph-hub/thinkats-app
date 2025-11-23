// components/ats/CandidateAccordionGrid.tsx
"use client";

import React, { useState } from "react";

type Candidate = {
  id: string;
  name: string;
  currentRole: string;
  company?: string;
  keySkills: string[];
  allSkills?: string[];
  bio?: string;
  experienceSummary?: string;
  email?: string;
  phone?: string;
  location?: string;
};

type Props = {
  candidates: Candidate[];
};

export function CandidateAccordionGrid({ candidates }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-3">
      <header>
        <h2 className="text-sm font-semibold text-slate-900">
          Candidate database
        </h2>
        <p className="text-xs text-slate-500">
          Browse profiles in your talent pool. Expand a card to see more
          details.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {candidates.map((c) => {
          const isOpen = openId === c.id;
          const visibleSkills = c.keySkills.slice(0, 3);

          return (
            <article
              key={c.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm"
            >
              {/* Collapsed header */}
              <button
                type="button"
                onClick={() => toggle(c.id)}
                className="flex w-full items-start justify-between gap-2 text-left"
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {c.name}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {c.currentRole}
                    {c.company && ` • ${c.company}`}
                  </p>
                  {c.location && (
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      📍 {c.location}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-[11px] text-slate-600 transition ${
                    isOpen ? "bg-slate-100" : "bg-white"
                  }`}
                  aria-hidden="true"
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {/* Key skills (collapsed) */}
              <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                {visibleSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-[#172965]/6 px-2 py-0.5 font-medium text-[#172965]"
                  >
                    {skill}
                  </span>
                ))}
                {c.keySkills.length > 3 && (
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                    +{c.keySkills.length - 3} more
                  </span>
                )}
              </div>

              {/* Expanded content */}
              <div
                className={`mt-3 overflow-hidden text-[12px] text-slate-700 transition-[max-height,opacity] duration-200 ease-out ${
                  isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {c.bio && (
                    <section>
                      <h4 className="text-[11px] font-semibold text-slate-900">
                        Profile summary
                      </h4>
                      <p className="mt-0.5 text-[12px] leading-relaxed">
                        {c.bio}
                      </p>
                    </section>
                  )}

                  {c.experienceSummary && (
                    <section>
                      <h4 className="text-[11px] font-semibold text-slate-900">
                        Experience
                      </h4>
                      <p className="mt-0.5 text-[12px] leading-relaxed">
                        {c.experienceSummary}
                      </p>
                    </section>
                  )}

                  {c.allSkills && c.allSkills.length > 0 && (
                    <section>
                      <h4 className="text-[11px] font-semibold text-slate-900">
                        Skills
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                        {c.allSkills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {(c.email || c.phone) && (
                    <section>
                      <h4 className="text-[11px] font-semibold text-slate-900">
                        Contact
                      </h4>
                      <dl className="mt-0.5 space-y-1 text-[11px] text-slate-700">
                        {c.email && (
                          <div>
                            <dt className="inline font-medium">Email: </dt>
                            <dd className="inline break-all">{c.email}</dd>
                          </div>
                        )}
                        {c.phone && (
                          <div>
                            <dt className="inline font-medium">Phone: </dt>
                            <dd className="inline">{c.phone}</dd>
                          </div>
                        )}
                      </dl>
                    </section>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full bg-[#306B34] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#245025]"
                    >
                      View full profile
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
