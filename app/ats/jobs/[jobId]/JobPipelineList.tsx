// app/ats/jobs/[jobId]/JobPipelineList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { StageSelect } from "./StageSelect";

type SkillTag = {
  id: string;
  label: string;
  color?: string | null;
};

type PipelineApp = {
  id: string;
  candidateId: string | null;

  fullName: string;
  email: string;
  location: string | null;
  currentTitle: string | null;
  currentCompany: string | null;

  source: string | null;
  stage: string | null;
  status: string | null;

  matchScore: number | null;
  matchReason: string | null;
  tier: string | null;
  scoreReason: string | null;

  appliedAt: string; // ISO
  skillTags: SkillTag[];
  experienceLabel: string | null;
};

type Props = {
  jobId: string;
  applications: PipelineApp[];
  stageOptions: string[]; // from server: ["APPLIED", "SCREENING", ...]
};

function tierColour(tier: string | null | undefined) {
  switch ((tier || "").toUpperCase()) {
    case "A":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "B":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "C":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}

function scoreColorHex(score: number | null | undefined) {
  if (score == null) return "#64748b"; // slate-500
  if (score >= 80) return "#16a34a"; // emerald-600
  if (score >= 65) return "#2563eb"; // blue-600
  if (score >= 50) return "#f59e0b"; // amber-500
  return "#475569"; // slate-600
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ScoreRing({ score, title }: { score: number | null; title?: string }) {
  const value = score ?? 0;
  const clamped = Math.max(0, Math.min(value, 100));
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const stroke = scoreColorHex(score);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      title={title}
      aria-label={score != null ? `Match score ${score}` : "Match score not set"}
    >
      <svg viewBox="0 0 40 40" className="h-11 w-11">
        {/* track */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="#e5e7eb" // slate-200
          strokeWidth="4"
        />
        {/* progress */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference * 0.25} // start at top-right for a softer feel
          transform="rotate(-90 20 20)"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-semibold text-slate-900">
          {score != null ? score : "–"}
        </span>
      </div>
    </div>
  );
}

function StatusCell({
  status,
  onChangeStatus,
}: {
  status: string | null;
  onChangeStatus: (next: string) => void;
}) {
  const current = (status || "PENDING").toUpperCase();

  const options: { value: "PENDING" | "ON_HOLD" | "REJECTED"; label: string }[] =
    [
      { value: "PENDING", label: "Active" },
      { value: "ON_HOLD", label: "On hold" },
      { value: "REJECTED", label: "Rejected" },
    ];

  function dotClass(v: string) {
    if (v === "PENDING") return "bg-emerald-500";
    if (v === "ON_HOLD") return "bg-amber-500";
    return "bg-rose-500";
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-1 py-0.5">
      {options.map((opt) => {
        const isActive = current === opt.value;
        const activeClasses =
          opt.value === "PENDING"
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
            : opt.value === "ON_HOLD"
            ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200";

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChangeStatus(opt.value)}
            className={[
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition",
              isActive
                ? activeClasses
                : "text-slate-400 hover:bg-white hover:text-slate-700 hover:ring-1 hover:ring-slate-200",
            ].join(" ")}
          >
            <span
              className={["h-1.5 w-1.5 rounded-full", dotClass(opt.value)].join(
                " ",
              )}
            />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function JobPipelineList({
  jobId,
  applications,
  stageOptions,
}: Props) {
  const [rows, setRows] = useState<PipelineApp[]>(applications);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkStage, setBulkStage] = useState<string>("");
  const [bulkStatus, setBulkStatus] = useState<string>("");

  const allSelected =
    rows.length > 0 && selectedIds.length === rows.length;
  const anySelected = selectedIds.length > 0;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((a) => a.id));
    }
  }

  function toggleRowSelection(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function runBulkUpdate() {
    if (!anySelected) return;
    if (!bulkStage && !bulkStatus) return;

    setIsSubmittingBulk(true);

    try {
      const res = await fetch(`/api/ats/jobs/${jobId}/pipeline/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationIds: selectedIds,
          nextStage: bulkStage || null,
          nextStatus: bulkStatus || null,
        }),
      });

      if (!res.ok) {
        console.error("Bulk update failed", await res.text());
        alert("Failed to apply bulk update. Please try again.");
        return;
      }

      // Inline UI update: keep everything in line, no full reload
      setRows((prev) =>
        prev.map((row) => {
          if (!selectedIds.includes(row.id)) return row;
          return {
            ...row,
            stage: bulkStage || row.stage,
            status: bulkStatus || row.status,
          };
        }),
      );
      setSelectedIds([]);
      setBulkStage("");
      setBulkStatus("");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while applying bulk changes.");
    } finally {
      setIsSubmittingBulk(false);
    }
  }

  async function handleInlineStatusChange(
    applicationId: string,
    nextStatus: string,
  ) {
    // Remember current status so we can revert on failure
    const originalStatus =
      rows.find((row) => row.id === applicationId)?.status ?? null;

    // Optimistic update for snappy UX
    setRows((prev) =>
      prev.map((row) =>
        row.id === applicationId ? { ...row, status: nextStatus } : row,
      ),
    );

    try {
      const res = await fetch(`/api/ats/jobs/${jobId}/pipeline/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_STATUS",      // ✅ match API contract
          status: nextStatus,        // ✅ same key as backend
          applicationIds: [applicationId],
        }),
      });

      if (!res.ok) {
        console.error("Status update failed", await res.text());
        alert("Failed to update status. Please try again.");

        // Revert to original status on failure
        setRows((prev) =>
          prev.map((row) =>
            row.id === applicationId ? { ...row, status: originalStatus } : row,
          ),
        );
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while updating status.");

      // Revert to original status on error
      setRows((prev) =>
        prev.map((row) =>
          row.id === applicationId ? { ...row, status: originalStatus } : row,
        ),
      );
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Bulk toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-[11px] text-slate-600">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40"
              checked={allSelected}
              onChange={toggleSelectAll}
            />
            <span>
              {anySelected
                ? `${selectedIds.length} selected`
                : "Select all"}
            </span>
          </label>

          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col">
              <span className="mb-0.5 text-[10px] font-medium text-slate-500">
                Move to stage
              </span>
              <select
                value={bulkStage}
                onChange={(e) => setBulkStage(e.target.value)}
                className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="">Keep stage</option>
                {stageOptions.map((s) => (
                  <option key={s} value={s.toUpperCase()}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="mb-0.5 text-[10px] font-medium text-slate-500">
                Status
              </span>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="">Keep status</option>
                <option value="PENDING">Active</option>
                <option value="ON_HOLD">On hold</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <button
              type="button"
              onClick={runBulkUpdate}
              disabled={
                !anySelected || (!bulkStage && !bulkStatus) || isSubmittingBulk
              }
              className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white shadow-sm transition enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmittingBulk ? "Applying…" : "Apply to selected"}
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Hover over scores and tiers to see why a candidate was ranked where
          they are. Inline edits update instantly.
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-xs shadow-sm">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-10 border-b border-slate-200 px-3 py-2 text-left">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Candidate
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Match score
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Stage
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Status
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Applied
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Source / Skills
              </th>
              <th className="w-16 border-b border-slate-200 px-3 py-2 text-left">
                Email
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((app) => {
              const isSelected = selectedIds.includes(app.id);
              const tier = app.tier;
              const scoreReason =
                app.scoreReason ||
                app.matchReason ||
                "Scored by semantic CV/JD engine.";

              return (
                <tr
                  key={app.id}
                  className="border-t border-slate-100 hover:bg-slate-50/60"
                >
                  <td className="px-3 py-3 align-top">
                    <input
                      type="checkbox"
                      className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40"
                      checked={isSelected}
                      onChange={() => toggleRowSelection(app.id)}
                    />
                  </td>

                  {/* Candidate card */}
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={
                          app.candidateId
                            ? `/ats/candidates/${app.candidateId}`
                            : "#"
                        }
                        className="inline-flex max-w-xs items-center gap-1 text-[13px] font-semibold text-slate-900 hover:text-indigo-700 hover:underline"
                      >
                        {app.fullName || "Unnamed candidate"}
                      </Link>
                      {app.email && (
                        <span className="max-w-xs truncate text-[11px] text-slate-500">
                          {app.email}
                        </span>
                      )}
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                        {app.location && (
                          <span className="truncate">{app.location}</span>
                        )}
                        {app.currentTitle && (
                          <span className="truncate">
                            {" · "}
                            {app.currentTitle}
                          </span>
                        )}
                        {app.currentCompany && (
                          <span className="truncate">
                            {" · "}
                            {app.currentCompany}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Match score + tier */}
                  <td className="px-3 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <ScoreRing
                          score={app.matchScore}
                          title={scoreReason}
                        />
                        <span className="mt-1 text-[10px] text-slate-500">
                          Match score
                        </span>
                      </div>
                      {tier && (
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                            tierColour(tier),
                          ].join(" ")}
                          title={`Tier ${tier.toUpperCase()} · ${scoreReason}`}
                        >
                          {tier.toUpperCase() === "A" && <span>★</span>}
                          <span>Tier {tier.toUpperCase()}</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Stage (inline select) */}
                  <td className="px-3 py-3 align-top">
                    <StageSelect
                      jobId={jobId}
                      applicationId={app.id}
                      currentStage={app.stage}
                    />
                  </td>

                  {/* Status – icon buttons only (no duplicate select) */}
                  <td className="px-3 py-3 align-top">
                    <StatusCell
                      status={app.status}
                      onChangeStatus={(next) =>
                        handleInlineStatusChange(app.id, next)
                      }
                    />
                  </td>

                  {/* Applied date */}
                  <td className="px-3 py-3 align-top text-[11px] text-slate-600">
                    {formatDate(app.appliedAt)}
                  </td>

                  {/* Source + skills */}
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-col gap-1">
                      {app.source && (
                        <span className="inline-flex w-fit items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {app.source}
                        </span>
                      )}
                      {app.skillTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {app.skillTags.slice(0, 6).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Email icon */}
                  <td className="px-3 py-3 align-top">
                    {app.email && (
                      <a
                        href={`mailto:${app.email}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-[14px] text-slate-600 shadow-sm transition hover:-translate-y-px hover:bg-slate-50 hover:text-slate-900"
                        title="Email candidate"
                      >
                        ✉
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-6 text-center text-[11px] text-slate-500"
                >
                  No candidates match the current filters yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
