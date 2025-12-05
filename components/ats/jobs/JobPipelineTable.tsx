// components/ats/jobs/JobPipelineTable.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type TierLetter = "A" | "B" | "C" | "D";

export type JobPipelineRow = {
  applicationId: string;
  candidateId: string | null;
  fullName: string;
  email: string;
  currentTitle: string | null;
  currentCompany: string | null;
  stage: string | null;
  status: string | null;
  tier: TierLetter;
  score: number;
  reason: string;
  risks: string[];
  redFlags: string[];
  interviewFocus: string[];
  cvUrl: string | null;
  appliedAt: string; // ISO string
};

type Props = {
  rows: JobPipelineRow[];
  tierCounts: Record<TierLetter, number>;
};

type FilterTier = "ALL" | TierLetter;

const STAGE_OPTIONS = [
  { value: "APPLIED", label: "Applied" },
  { value: "SCREENING", label: "Screening" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "HIRED", label: "Hired" },
];

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "REJECTED", label: "Rejected" },
];

export default function JobPipelineTable({ rows, tierCounts }: Props) {
  const [localRows, setLocalRows] = useState<JobPipelineRow[]>(rows);
  const [filterTier, setFilterTier] = useState<FilterTier>("ALL");
  const [filterStage, setFilterStage] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  // Derived list: filters + search
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return localRows.filter((row) => {
      if (filterTier !== "ALL" && row.tier !== filterTier) return false;

      if (filterStage !== "ALL") {
        const stage = (row.stage || "APPLIED").toUpperCase();
        if (stage !== filterStage) return false;
      }

      if (filterStatus !== "ALL") {
        const status = (row.status || "PENDING").toUpperCase();
        if (status !== filterStatus) return false;
      }

      if (q) {
        const haystack = [
          row.fullName,
          row.email,
          row.currentTitle || "",
          row.currentCompany || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [localRows, filterTier, filterStage, filterStatus, query]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filteredRows.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  function resetPage() {
    setPage(1);
  }

  function labelForStage(value: string | null) {
    const upper = (value || "").toUpperCase();
    const found = STAGE_OPTIONS.find((o) => o.value === upper);
    if (found) return found.label;
    if (!upper) return "Applied";
    return upper
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  function labelForStatus(value: string | null) {
    const upper = (value || "").toUpperCase();
    const found = STATUS_OPTIONS.find((o) => o.value === upper);
    if (found) return found.label;
    if (!upper) return "Pending";
    return upper
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  async function updateStageStatus(
    applicationId: string,
    nextStage?: string,
    nextStatus?: string,
  ) {
    const row = localRows.find((r) => r.applicationId === applicationId);
    if (!row) return;

    const stage =
      typeof nextStage === "string"
        ? nextStage
        : (row.stage || "APPLIED").toUpperCase();
    const status =
      typeof nextStatus === "string"
        ? nextStatus
        : (row.status || "PENDING").toUpperCase();

    setSavingId(applicationId);
    setErrorId(null);

    try {
      const res = await fetch("/api/ats/applications/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          stage,
          status,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to update application");
      }

      setLocalRows((prev) =>
        prev.map((r) =>
          r.applicationId === applicationId
            ? {
                ...r,
                stage: data.stage || stage,
                status: data.status || status,
              }
            : r,
        ),
      );

      setLastSavedId(applicationId);
      setTimeout(() => {
        setLastSavedId((current) =>
          current === applicationId ? null : current,
        );
      }, 1500);
    } catch (err) {
      console.error("Update stage/status error", err);
      setErrorId(applicationId);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Toolbar / filters */}
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Applications ({filteredRows.length})
            </h2>
            <p className="text-[11px] text-slate-500">
              Newest applications appear first. Use the filters to slice
              this pipeline by tier, stage and status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {/* Tier filter pills */}
            <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1 py-0.5">
              <TierFilterPill
                label={`All tiers`}
                active={filterTier === "ALL"}
                onClick={() => {
                  setFilterTier("ALL");
                  resetPage();
                }}
              />
              {(["A", "B", "C", "D"] as TierLetter[]).map((tier) => (
                <TierFilterPill
                  key={tier}
                  label={`${tier} · ${tierCounts[tier] || 0}`}
                  active={filterTier === tier}
                  tone={tier}
                  onClick={() => {
                    setFilterTier(
                      filterTier === tier ? "ALL" : tier,
                    );
                    resetPage();
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Second row: stage/status + search */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <select
              value={filterStage}
              onChange={(e) => {
                setFilterStage(e.target.value);
                resetPage();
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm focus:border-[#172965] focus:outline-none"
            >
              <option value="ALL">All stages</option>
              {STAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                resetPage();
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm focus:border-[#172965] focus:outline-none"
            >
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex-1 min-w-[180px] max-w-xs">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
              placeholder="Search name, email, company…"
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Empty state */}
      {pageRows.length === 0 ? (
        <div className="px-4 py-10 text-center text-xs text-slate-500">
          {filteredRows.length === 0
            ? "No applications match your current filters."
            : "No applications on this page."}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-t border-slate-100 text-xs">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Candidate</th>
                  <th className="px-4 py-2 text-left">Stage / status</th>
                  <th className="px-4 py-2 text-left">Tier / score</th>
                  <th className="px-4 py-2 text-left">
                    Match summary &amp; interview focus
                  </th>
                  <th className="px-4 py-2 text-left">CV / applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((row) => {
                  const applied = new Date(
                    row.appliedAt,
                  ).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });

                  const stageValue = (row.stage || "APPLIED").toUpperCase();
                  const statusValue = (row.status || "PENDING").toUpperCase();

                  const isSaving = savingId === row.applicationId;
                  const isError = errorId === row.applicationId;
                  const isJustSaved =
                    lastSavedId === row.applicationId;

                  return (
                    <tr
                      key={row.applicationId}
                      className="align-top transition-colors hover:bg-slate-50/70"
                    >
                      {/* Candidate */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {row.candidateId ? (
                            <Link
                              href={`/ats/candidates/${row.candidateId}`}
                              className="text-xs font-semibold text-[#172965] hover:underline"
                            >
                              {row.fullName}
                            </Link>
                          ) : (
                            <span className="text-xs font-semibold text-slate-900">
                              {row.fullName}
                            </span>
                          )}
                          <p className="text-[11px] text-slate-500">
                            {row.currentTitle || "—"}
                            {row.currentCompany
                              ? ` · ${row.currentCompany}`
                              : ""}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {row.email}
                          </p>
                        </div>
                      </td>

                      {/* Stage / status – inline editable */}
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-[11px]">
                          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 shadow-sm">
                            <span className="text-slate-500">
                              Stage:
                            </span>
                            <select
                              value={stageValue}
                              onChange={(e) =>
                                updateStageStatus(
                                  row.applicationId,
                                  e.target.value,
                                  undefined,
                                )
                              }
                              className="bg-transparent text-[11px] font-medium text-slate-800 focus:outline-none"
                            >
                              {STAGE_OPTIONS.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                >
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 shadow-sm">
                            <span className="text-slate-500">
                              Status:
                            </span>
                            <select
                              value={statusValue}
                              onChange={(e) =>
                                updateStageStatus(
                                  row.applicationId,
                                  undefined,
                                  e.target.value,
                                )
                              }
                              className="bg-transparent text-[11px] font-medium text-slate-800 focus:outline-none"
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                >
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {isSaving && (
                            <p className="text-[10px] text-slate-400">
                              Saving…
                            </p>
                          )}
                          {isJustSaved && !isSaving && !isError && (
                            <p className="text-[10px] text-emerald-500">
                              Updated
                            </p>
                          )}
                          {isError && (
                            <p className="text-[10px] text-rose-500">
                              Couldn&apos;t update, try again.
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Tier / score */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <TierBadge tier={row.tier} />
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-semibold text-slate-900">
                              {row.score}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              / 100
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Summary + risks + interview focus */}
                      <td className="px-4 py-3">
                        <div className="space-y-1.5">
                          {/* Summary */}
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Summary
                            </p>
                            <p
                              className="mt-0.5 max-w-xs text-[11px] text-slate-600 line-clamp-3"
                              title={row.reason}
                            >
                              {row.reason}
                            </p>
                          </div>

                          {/* Risks / red flags */}
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Risks &amp; red flags
                            </p>
                            <RiskBadges
                              risks={row.risks}
                              redFlags={row.redFlags}
                            />
                          </div>

                          {/* Interview focus */}
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Interview focus
                            </p>
                            {row.interviewFocus.length === 0 ? (
                              <span className="text-[11px] text-slate-400">
                                —
                              </span>
                            ) : (
                              <ul className="mt-0.5 space-y-0.5 text-[11px] text-slate-600">
                                {row.interviewFocus
                                  .slice(0, 2)
                                  .map((item, idx) => (
                                    <li
                                      key={idx}
                                      className="line-clamp-2"
                                      title={item}
                                    >
                                      • {item}
                                    </li>
                                  ))}
                                {row.interviewFocus.length > 2 && (
                                  <li className="text-[10px] text-slate-400">
                                    +
                                    {row.interviewFocus.length - 2}{" "}
                                    more focus points
                                  </li>
                                )}
                              </ul>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CV + applied */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2 text-[11px]">
                          {row.cvUrl ? (
                            <a
                              href={row.cvUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700 hover:bg-slate-100"
                            >
                              View CV
                            </a>
                          ) : (
                            <span className="text-slate-400">
                              No CV on file
                            </span>
                          )}
                          <p className="text-[10px] text-slate-500">
                            Applied {applied}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500">
            <p>
              Showing{" "}
              <span className="font-medium">
                {filteredRows.length === 0
                  ? 0
                  : startIndex + 1}
                –
                {Math.min(
                  filteredRows.length,
                  startIndex + PAGE_SIZE,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {filteredRows.length}
              </span>{" "}
              applications
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <span>
                Page{" "}
                <span className="font-medium">{currentPage}</span>{" "}
                of{" "}
                <span className="font-medium">{totalPages}</span>
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function TierFilterPill({
  label,
  active,
  tone,
  onClick,
}: {
  label: string;
  active: boolean;
  tone?: TierLetter;
  onClick: () => void;
}) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium cursor-pointer transition-colors";
  if (!active) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} border border-transparent text-slate-600 hover:bg-slate-100`}
      >
        {label}
      </button>
    );
  }

  const toneClasses =
    tone === "A"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "B"
      ? "border-sky-200 bg-sky-50 text-sky-800"
      : tone === "C"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "D"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-[#172965] bg-[#172965] text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${toneClasses}`}
    >
      {label}
    </button>
  );
}

function TierBadge({ tier }: { tier: TierLetter }) {
  const map: Record<
    TierLetter,
    { label: string; classes: string }
  > = {
    A: {
      label: "Tier A · Priority",
      classes:
        "border-emerald-200 bg-emerald-50 text-emerald-800",
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

  const { label, classes } = map[tier];

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
    return (
      <span className="text-[11px] text-slate-400">
        No obvious risks
      </span>
    );
  }

  return (
    <div className="mt-0.5 flex flex-wrap gap-1.5">
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
