// components/ats/candidates/CandidatesTable.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Tier = "A" | "B" | "C" | "D";

type CandidateRow = {
  application: {
    id: string;
    fullName: string;
    email: string;
    stage: string | null;
    status: string | null;
    createdAt: string; // ISO string
  };
  candidate: {
    id: string;
    currentTitle: string | null;
    currentCompany: string | null;
  } | null;
  job: {
    id: string;
    title: string;
    location: string | null;
    workMode: string | null;
    clientName: string | null;
  };
  scored: {
    score: number;
    tier: Tier | string;
    reason: string;
    risks: string[];
    redFlags: string[];
    interviewFocus: string[];
  };
  cvUrl: string | null;
};

const PAGE_SIZE = 30;

export default function CandidatesTable({ rows }: { rows: CandidateRow[] }) {
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [query, setQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const tier = String(row.scored.tier || "D").toUpperCase();
      const stage = String(row.application.stage || "APPLIED").toUpperCase();
      const status = String(row.application.status || "PENDING").toUpperCase();

      if (tierFilter !== "ALL" && tier !== tierFilter) return false;
      if (stageFilter !== "ALL" && stage !== stageFilter) return false;
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      if (query.trim()) {
        const q = query.toLowerCase();
        const haystack = [
          row.application.fullName,
          row.application.email,
          row.candidate?.currentTitle ?? "",
          row.candidate?.currentCompany ?? "",
          row.job.title,
          row.job.clientName ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [rows, tierFilter, stageFilter, statusFilter, query]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header + filters */}
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Latest applications
            </h2>
            <p className="text-[11px] text-slate-500">
              Showing {total === 0 ? 0 : startIndex + 1}–{startIndex + pageRows.length} of{" "}
              {total} applications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
            >
              <option value="ALL">All tiers</option>
              <option value="A">Tier A</option>
              <option value="B">Tier B</option>
              <option value="C">Tier C</option>
              <option value="D">Tier D</option>
            </select>

            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
            >
              <option value="ALL">All stages</option>
              <option value="APPLIED">Applied</option>
              <option value="SCREEN">Screen</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="HIRED">Hired</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On hold</option>
              <option value="REJECTED">Rejected</option>
              <option value="HIRED">Hired</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>

            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, role, client"
                className="w-48 bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            {(tierFilter !== "ALL" ||
              stageFilter !== "ALL" ||
              statusFilter !== "ALL" ||
              query.trim()) && (
              <button
                type="button"
                onClick={() => {
                  setTierFilter("ALL");
                  setStageFilter("ALL");
                  setStatusFilter("ALL");
                  setQuery("");
                  setPage(1);
                }}
                className="text-[11px] text-slate-500 underline underline-offset-4"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Pagination controls */}
        <div className="mt-3 flex items-center justify-end gap-3 text-[11px] text-slate-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {pageRows.length === 0 ? (
        <div className="px-4 py-10 text-center text-xs text-slate-500">
          No candidates match your current filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-t border-slate-100 text-xs">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Candidate</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Client</th>
                <th className="px-4 py-2 text-left">Tier</th>
                <th className="px-4 py-2 text-left">Score</th>
                <th className="px-4 py-2 text-left">CV</th>
                <th className="px-4 py-2 text-left">Risks / red flags</th>
                <th className="px-4 py-2 text-left">Interview focus</th>
                <th className="px-4 py-2 text-left">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map(({ application, candidate, job, scored, cvUrl }) => {
                const createdDate = new Date(application.createdAt);
                const createdLabel = isNaN(createdDate.getTime())
                  ? application.createdAt
                  : createdDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });

                return (
                  <tr key={application.id} className="align-top">
                    {/* Candidate */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {candidate?.id ? (
                          <Link
                            href={`/ats/candidates/${candidate.id}`}
                            className="text-xs font-medium text-[#172965] hover:underline"
                          >
                            {application.fullName}
                          </Link>
                        ) : (
                          <span className="text-xs font-medium text-slate-900">
                            {application.fullName}
                          </span>
                        )}
                        <p className="text-[11px] text-slate-500">
                          {candidate?.currentTitle || "—"}
                          {candidate?.currentCompany
                            ? ` · ${candidate.currentCompany}`
                            : ""}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {application.email}
                        </p>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-900">
                        {job.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {job.location || job.workMode || "—"}
                      </p>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-800">
                        {job.clientName || "—"}
                      </p>
                    </td>

                    {/* Tier */}
                    <td className="px-4 py-3">
                      <TierBadge tier={scored.tier} />
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {scored.score}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          / 100
                        </span>
                      </div>
                    </td>

                    {/* CV */}
                    <td className="px-4 py-3">
                      {cvUrl ? (
                        <a
                          href={cvUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          View CV
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          No CV on file
                        </span>
                      )}
                    </td>

                    {/* Risks / red flags */}
                    <td className="px-4 py-3">
                      <RiskBadges
                        risks={scored.risks}
                        redFlags={scored.redFlags}
                      />
                    </td>

                    {/* Interview focus */}
                    <td className="px-4 py-3">
                      {scored.interviewFocus.length === 0 ? (
                        <span className="text-[11px] text-slate-400">—</span>
                      ) : (
                        <ul className="space-y-1 text-[11px] text-slate-600">
                          {scored.interviewFocus
                            .slice(0, 2)
                            .map((item: string, idx: number) => (
                              <li
                                key={idx}
                                className="line-clamp-2"
                                title={item}
                              >
                                • {item}
                              </li>
                            ))}
                          {scored.interviewFocus.length > 2 && (
                            <li className="text-[10px] text-slate-400">
                              +
                              {scored.interviewFocus.length - 2} more focus
                              points
                            </li>
                          )}
                        </ul>
                      )}
                    </td>

                    {/* Applied */}
                    <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-500">
                      {createdLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TierBadge({ tier }: { tier: Tier | string }) {
  const map: Record<Tier, { label: string; classes: string }> = {
    A: {
      label: "Tier A · Priority",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    B: {
      label: "Tier B · Strong",
      classes: "border-sky-200 bg-sky-50 text-sky-800",
    },
    C: {
      label: "Tier C · Consider",
      classes: "border-amber-200 bg-amber-50 text-amber-800",
    },
    D: {
      label: "Tier D · Below threshold",
      classes: "border-rose-200 bg-rose-50 text-rose-800",
    },
  };

  const safeTier: Tier =
    tier === "A" || tier === "B" || tier === "C" || tier === "D"
      ? tier
      : "D";

  const { label, classes } = map[safeTier];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

function RiskBadges({
  risks,
  redFlags,
}: {
  risks: string[];
  redFlags: string[];
}) {
  if (!risks.length && !redFlags.length) {
    return <span className="text-[11px] text-slate-400">No obvious risks</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {redFlags.map((flag, idx) => (
        <span
          key={`rf-${idx}`}
          className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700"
          title={flag}
        >
          ● Red flag
        </span>
      ))}
      {risks.map((risk, idx) => (
        <span
          key={`rk-${idx}`}
          className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800"
          title={risk}
        >
          ● Risk
        </span>
      ))}
    </div>
  );
}
