// components/ats/CandidatesAccordion.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

type Candidate = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  status: string; // applied | screening | interview | offer | rejected | ...
  appliedAt: string;
  jobTitle?: string;
  jobSlug?: string;
  jobId?: string;
  headline?: string;
  keySkills: string[];
  experienceSummary?: string;
  source?: string;
};

type Props = {
  candidates: Candidate[];
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

export function CandidatesAccordion({ candidates }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return candidates.filter((c) => {
      if (statusFilter !== "all") {
        if (c.status?.toLowerCase() !== statusFilter) return false;
      }

      if (!q) return true;

      const haystack = [
        c.fullName,
        c.email,
        c.location,
        c.jobTitle,
        c.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [candidates, statusFilter, query]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((opt) => {
            const active = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                  active
                    ? "border-[#172965] bg-[#172965]/5 text-[#172965]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="w-full max-w-xs">
          <input
            type="search"
            placeholder="Search by name, email, role..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/60"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-xs text-slate-500">
          No candidates found for the current filters.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((candidate) => {
            const expanded = expandedId === candidate.id;
            return (
              <div
                key={candidate.id}
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[#172965]/50 hover:shadow-md"
              >
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 text-left"
                  onClick={() =>
                    setExpandedId(expanded ? null : candidate.id)
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {candidate.fullName}
                      </p>
                      {candidate.jobTitle && (
                        <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                          {candidate.jobTitle}
                        </span>
                      )}
                    </div>
                    {candidate.headline && (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {candidate.headline}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span>{candidate.email}</span>
                      {candidate.location && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{candidate.location}</span>
                        </>
                      )}
                      {candidate.source && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>Source: {candidate.source}</span>
                        </>
                      )}
                    </div>

                    {candidate.keySkills && candidate.keySkills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {candidate.keySkills.slice(0, 4).map((skill) => (
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

                  <div className="flex flex-col items-end gap-1 text-right">
                    <StatusPill status={candidate.status} />
                    <p className="text-[10px] text-slate-500">
                      Applied{" "}
                      {new Date(candidate.appliedAt).toLocaleDateString()}
                    </p>
                    <span
                      className="mt-1 text-[10px] text-slate-500"
                      aria-hidden="true"
                    >
                      {expanded ? "Collapse ▲" : "Expand ▼"}
                    </span>
                  </div>
                </button>

                {expanded && (
                  <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <h3 className="text-[11px] font-semibold text-slate-900">
                          Contact
                        </h3>
                        <dl className="mt-1 space-y-1">
                          <div>
                            <dt className="text-[10px] text-slate-500">
                              Email
                            </dt>
                            <dd className="text-[11px] text-slate-700">
                              {candidate.email}
                            </dd>
                          </div>
                          {candidate.phone && (
                            <div>
                              <dt className="text-[10px] text-slate-500">
                                Phone
                              </dt>
                              <dd className="text-[11px] text-slate-700">
                                {candidate.phone}
                              </dd>
                            </div>
                          )}
                          {candidate.location && (
                            <div>
                              <dt className="text-[10px] text-slate-500">
                                Location
                              </dt>
                              <dd className="text-[11px] text-slate-700">
                                {candidate.location}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      <div>
                        <h3 className="text-[11px] font-semibold text-slate-900">
                          Meta
                        </h3>
                        <dl className="mt-1 space-y-1">
                          {candidate.jobTitle && (
                            <div>
                              <dt className="text-[10px] text-slate-500">
                                Role
                              </dt>
                              <dd className="text-[11px] text-slate-700">
                                {candidate.jobTitle}
                              </dd>
                            </div>
                          )}
                          <div>
                            <dt className="text-[10px] text-slate-500">
                              Status
                            </dt>
                            <dd className="text-[11px] text-slate-700">
                              {nicifyStatus(candidate.status)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {candidate.experienceSummary && (
                      <div className="mt-3">
                        <h3 className="text-[11px] font-semibold text-slate-900">
                          Experience
                        </h3>
                        <p className="mt-1 text-[11px] text-slate-600">
                          {candidate.experienceSummary}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {candidate.jobId && (
                        <Link
                          href={`/ats/jobs/${candidate.jobId}`}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#172965] hover:text-[#172965]"
                        >
                          View pipeline
                        </Link>
                      )}
                      <Link
                        href={`/ats/jobs`}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-300"
                      >
                        Back to jobs
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const map: Record<
    string,
    { label: string; bg: string; dot: string }
  > = {
    applied: {
      label: "Applied",
      bg: "bg-slate-50 text-slate-700",
      dot: "#172965",
    },
    screening: {
      label: "Screening",
      bg: "bg-amber-50 text-amber-800",
      dot: "#FFC000",
    },
    interview: {
      label: "Interview",
      bg: "bg-emerald-50 text-emerald-800",
      dot: "#306B34",
    },
    offer: {
      label: "Offer",
      bg: "bg-lime-50 text-lime-800",
      dot: "#64C247",
    },
    rejected: {
      label: "Rejected",
      bg: "bg-rose-50 text-rose-800",
      dot: "#EF4444",
    },
  };

  const cfg =
    map[normalized] ||
    ({
      label: status,
      bg: "bg-slate-50 text-slate-700",
      dot: "#9CA3AF",
    } as const);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${cfg.bg}`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}

function nicifyStatus(status: string) {
  const s = status.toLowerCase();
  if (s === "applied") return "Applied";
  if (s === "screening") return "Screening";
  if (s === "interview") return "Interview";
  if (s === "offer") return "Offer";
  if (s === "rejected") return "Rejected";
  return status;
}
