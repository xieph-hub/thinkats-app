"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StageSelect } from "./StageSelect";

type SkillTag = {
  id: string;
  label: string;
  color?: string | null;
};

type PipelineAppRow = {
  id: string; // application id
  candidateId: string | null; // for linking to candidate profile

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

type JobPipelineListProps = {
  jobId: string;
  applications: PipelineAppRow[];
  stageOptions: string[];
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

function scoreColour(score: number | null | undefined) {
  if (score == null) return "text-slate-500";
  if (score >= 80) return "text-emerald-700";
  if (score >= 65) return "text-sky-700";
  if (score >= 50) return "text-amber-700";
  return "text-slate-600";
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function JobPipelineList({
  jobId,
  applications,
  stageOptions,
}: JobPipelineListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStage, setBulkStage] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allSelected = useMemo(
    () => applications.length > 0 && selectedIds.length === applications.length,
    [applications.length, selectedIds.length],
  );

  const selectedCount = selectedIds.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map((a) => a.id));
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function runBulkStageUpdate() {
    if (!bulkStage || selectedIds.length === 0) return;

    setIsRunning(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch(`/api/ats/jobs/${jobId}/pipeline/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          applicationIds: selectedIds,
          action: "move_stage",
          stage: bulkStage,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          text || `Bulk stage update failed with status ${res.status}`,
        );
      }

      setFeedback("Stage updated for selected candidates. Refreshing…");
      // simplest: reload to pull fresh server data
      window.location.reload();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong updating stages.";
      setError(msg);
    } finally {
      setIsRunning(false);
    }
  }

  async function runBulkStatusUpdate(nextStatus: "PENDING" | "ON_HOLD" | "REJECTED") {
    if (selectedIds.length === 0) return;

    setIsRunning(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch(`/api/ats/jobs/${jobId}/pipeline/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          applicationIds: selectedIds,
          action: "set_status",
          status: nextStatus,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          text || `Bulk status update failed with status ${res.status}`,
        );
      }

      setFeedback("Status updated for selected candidates. Refreshing…");
      window.location.reload();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Something went wrong updating candidate status.";
      setError(msg);
    } finally {
      setIsRunning(false);
    }
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        No candidates in this view yet.
        <div className="mt-1 text-[11px] text-slate-400">
          Once applications land for this role, they will appear here with full
          pipeline controls.
        </div>
      </div>
    );
  }

  const topStageOptions = stageOptions.length
    ? stageOptions
    : ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

  return (
    <div className="space-y-3">
      {/* Bulk actions bar */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            Pipeline · List
          </span>
          <span className="text-[11px] text-slate-600">
            Selected:{" "}
            <span className="font-semibold text-slate-900">
              {selectedCount}
            </span>{" "}
            / {applications.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Legend */}
          <div className="hidden items-center gap-1.5 text-[10px] text-slate-400 md:flex">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Tier A
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              Tier B
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Tier C
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Bulk stage */}
          <div className="flex items-center gap-1.5">
            <select
              value={bulkStage}
              onChange={(e) => setBulkStage(e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            >
              <option value="">Move selected to stage…</option>
              {topStageOptions.map((s) => (
                <option key={s} value={s.toUpperCase()}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={runBulkStageUpdate}
              disabled={!bulkStage || selectedCount === 0 || isRunning}
              className="inline-flex h-8 items-center rounded-full bg-indigo-600 px-3 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isRunning ? "Updating…" : "Move"}
            </button>
          </div>

          <div className="hidden h-4 w-px bg-slate-200 md:block" />

          {/* Bulk status */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Set status:</span>
            <button
              type="button"
              onClick={() => runBulkStatusUpdate("PENDING")}
              disabled={selectedCount === 0 || isRunning}
              className="inline-flex h-7 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
            >
              Accepted / active
            </button>
            <button
              type="button"
              onClick={() => runBulkStatusUpdate("ON_HOLD")}
              disabled={selectedCount === 0 || isRunning}
              className="inline-flex h-7 items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[10px] font-medium text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
            >
              On hold
            </button>
            <button
              type="button"
              onClick={() => runBulkStatusUpdate("REJECTED")}
              disabled={selectedCount === 0 || isRunning}
              className="inline-flex h-7 items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 text-[10px] font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      {(feedback || error) && (
        <div
          className={`rounded-lg border px-3 py-2 text-[11px] ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || feedback}
        </div>
      )}

      {/* List table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-10 px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500/40"
                />
              </th>
              <th className="px-3 py-2 text-left">Candidate</th>
              <th className="px-3 py-2 text-left">Tags</th>
              <th className="px-3 py-2 text-left">Tier / Score</th>
              <th className="px-3 py-2 text-left">Stage</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-left">Applied</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => {
              const isSelected = selectedIds.includes(app.id);
              const score = app.matchScore;
              const tier = app.tier;
              const scoreReason =
                app.scoreReason ||
                app.matchReason ||
                "Scored by semantic CV/JD engine.";

              const topTags = app.skillTags.slice(0, 4);

              return (
                <tr
                  key={app.id}
                  className={`border-t border-slate-100 ${
                    isSelected ? "bg-indigo-50/40" : "hover:bg-slate-50/60"
                  }`}
                >
                  <td className="px-3 py-2 align-top">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(app.id)}
                      className="mt-1 h-3.5 w-3.5 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500/40"
                    />
                  </td>

                  {/* Candidate */}
                  <td className="max-w-xs px-3 py-2 align-top">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-medium text-slate-900">
                          {app.fullName}
                        </span>
                        {app.email && (
                          <a
                            href={`mailto:${app.email}`}
                            className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200"
                          >
                            ✉ Email
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                        {app.currentTitle && (
                          <span className="truncate">{app.currentTitle}</span>
                        )}
                        {app.currentCompany && (
                          <span className="truncate">
                            {" · "}
                            {app.currentCompany}
                          </span>
                        )}
                        {app.location && (
                          <span className="truncate">
                            {" · "}
                            {app.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Tags */}
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-wrap gap-1">
                      {topTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                        >
                          {tag.label}
                        </span>
                      ))}
                      {app.skillTags.length > topTags.length && (
                        <span className="text-[10px] text-slate-400">
                          +{app.skillTags.length - topTags.length} more
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Tier / score */}
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-col items-start gap-0.5">
                      <div
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tierColour(
                          tier,
                        )}`}
                      >
                        <span className={scoreColour(score)}>
                          {score != null ? score : "–"}
                        </span>
                        {tier && (
                          <span className="text-[10px] uppercase text-slate-500">
                            · {tier}
                          </span>
                        )}
                      </div>
                      <span
                        className="cursor-help text-[10px] text-slate-400"
                        title={scoreReason}
                      >
                        Why this score?
                      </span>
                    </div>
                  </td>

                  {/* Stage */}
                  <td className="px-3 py-2 align-top">
                    <StageSelect
                      jobId={jobId}
                      applicationId={app.id}
                      currentStage={app.stage}
                    />
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2 align-top">
                    <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {(app.status || "PENDING").replace(/_/g, " ")}
                    </span>
                  </td>

                  {/* Source */}
                  <td className="px-3 py-2 align-top">
                    {app.source ? (
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {app.source}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
                  </td>

                  {/* Applied */}
                  <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                    {formatDate(app.appliedAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2 align-top text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-1">
                      {app.candidateId && (
                        <Link
                          href={`/ats/candidates/${app.candidateId}`}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          👤 Profile
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
