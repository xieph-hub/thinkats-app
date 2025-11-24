"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Tag,
} from "lucide-react";

export type Candidate = {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string | null;
  location?: string | null;
  current_role?: string | null;
  current_company?: string | null;
  years_experience?: number | null;
  key_skills?: string[] | null;
  tags?: string[] | null;
  last_contact_at?: string | null;
  source?: string | null;

  // For flexibility if your query already maps differently:
  name?: string;
  title?: string;
  skills?: string[];
};

type Props = {
  candidates: Candidate[];
};

export function CandidatesAccordion({ candidates }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!candidates || candidates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        No candidates in your database yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {candidates.map((candidate) => {
        const isOpen = openId === candidate.id;

        const name = candidate.full_name || candidate.name || "Unnamed candidate";
        const title =
          candidate.current_role ||
          candidate.title ||
          (candidate.current_company
            ? `Role @ ${candidate.current_company}`
            : "Role not specified");

        const skills =
          candidate.key_skills ||
          candidate.skills ||
          [];

        const primarySkills = skills.slice(0, 3);
        const extraSkillsCount = Math.max(skills.length - 3, 0);

        const location = candidate.location;
        const lastContact = candidate.last_contact_at
          ? new Date(candidate.last_contact_at).toLocaleDateString()
          : null;

        return (
          <div
            key={candidate.id}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-[#172965]/70 hover:shadow-md"
          >
            {/* Collapsed row (always visible) */}
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : candidate.id)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#172965]/10 text-[11px] font-semibold text-[#172965]">
                    {name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {name}
                    </p>
                    <p className="text-[11px] text-slate-500">{title}</p>
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  {location && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
                      <MapPin className="h-3 w-3 text-red-500" />
                      <span>{location}</span>
                    </span>
                  )}
                  {typeof candidate.years_experience === "number" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
                      <Briefcase className="h-3 w-3 text-amber-700" />
                      <span>{candidate.years_experience} yrs experience</span>
                    </span>
                  )}
                  {primarySkills.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
                      <Tag className="h-3 w-3 text-teal-600" />
                      <span>
                        {primarySkills.join(" · ")}
                        {extraSkillsCount > 0
                          ? ` +${extraSkillsCount} more`
                          : ""}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {lastContact && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    Last contact {lastContact}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#172965]">
                  {isOpen ? "Hide details" : "View details"}
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </span>
              </div>
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="border-t border-slate-100 px-4 py-3 text-[11px] text-slate-700">
                <div className="grid gap-3 md:grid-cols-2">
                  {/* Contact + meta */}
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Contact
                    </h3>
                    <dl className="space-y-1.5">
                      {candidate.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-slate-500" />
                          <span className="truncate">{candidate.email}</span>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span>{candidate.phone}</span>
                        </div>
                      )}
                      {candidate.source && (
                        <div className="flex items-center gap-2">
                          <Tag className="h-3 w-3 text-teal-600" />
                          <span>Source: {candidate.source}</span>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Skills + tags */}
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Skills & tags
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.length > 0 ? (
                        skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center rounded-full bg-[#172965]/5 px-2 py-0.5 text-[10px] font-medium text-[#172965]"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          No skills recorded yet.
                        </p>
                      )}
                      {candidate.tags &&
                        candidate.tags.map((tag) => (
                          <span
                            key={`tag-${tag}`}
                            className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Add note
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#111c4c]"
                  >
                    View full profile
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Also export default so either import style works.
export default CandidatesAccordion;
