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
  applications: PipelineApp[];
  stageOptions: string[]; // currently not used directly, but kept for API compatibility
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

function formatApplied(atIso: string) {
  try {
    const d = new Date(atIso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function JobPipelineList({
  jobId,
  applications,
}: JobPipelineListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStage, setBulkStage] = useState<string>("");
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  const hasSelection = selectedIds.length > 0;

  function toggleRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    if (selectedIds.length === applications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map((a) => a.id));
    }
  }

  async function runBulkUpdate(action: "move_stage" | "set_status") {
    if (!hasSelection) return;

    if (action === "move_stage" && !bulkStage.trim()) return;
    if (action === "set_status" && !bulkStatus.trim()) return;

    try {
      setIsBulkRunning(true);

      const body: any = {
        jobId,
        applicationIds: selectedIds,
        action,
      };

      if (action === "move_stage") {
        body.stage = bulkStage;
      } else if (action === "set_status") {
        body.status = bulkStatus;
      }

      const res = await fetch(`/api/ats/jobs/${jobId}/pipeline/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("Bulk update failed", await res.text());
        return;
      }

      // Keep it simple for now – refresh to pick up latest values
      window.location.reload();
    } catch (err) {
      console.error("Bulk update error", err);
    } finally {
      setIsBulkRunning(false);
    }
  }

  async function handleInlineStatusChange(
    applicationId: string,
    nextStatus: string,
  ) {
    if (!nextStatus) return;

    try {
      const res = await fetch(`/api/ats/jobs/${jobId}/pipeline/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          applicationIds: [applicationId],
          action: "set_status",
          status: nextStatus,
        }),
      });

      if (!res.ok) {
        console.error("Inline status update failed", await res.text());
        return;
      }

      // For now, just refresh; you can swap to in-memory updates later
      window.location.reload();
    } catch (err) {
      console.error("Inline status update error", err);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Top bar: summary + bulk actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 text-xs">
        <div className="flex flex-col gap-1 text-slate-600">
          <span className="font-medium">
            {applications.length} candidate
            {applications.length === 1 ? "" : "s"} in this view
          </span>
          <span className="text-[11px] text-slate-500">
            Use checkboxes for bulk stage moves or decision changes.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Bulk move stage */}
          <div className="flex items-center gap-1">
            <select
              value={bulkStage}
              onChange={(e) => setBulkStage(e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            >
              <option value="">Move to stage…</option>
              <option value="APPLIED">Applied</option>
              <option value="SCREENING">Screening</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="HIRED">Hired</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button
              type="button"
              disabled={!hasSelection || !bulkStage || isBulkRunning}
              onClick={() => runBulkUpdate("move_stage")}
              className="inline-flex h-8 items-center rounded-full bg-slate-900 px-3 text-[11px] font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Apply
            </button>
          </div>

          {/* Bulk set status */}
          <div className="flex items-center gap-1">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            >
              <option value="">Set decision…</option>
              <option value="PENDING">Accepted / active</option>
              <option value="ON_HOLD">On hold</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button
              type="button"
              disabled={!hasSelection || !bulkStatus || isBulkRunning}
              onClick={() => runBulkUpdate("set_status")}
              className="inline-flex h-8 items-center rounded-full bg-slate-900 px-3 text-[11px] font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-xs">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-slate-500">
              <th className="w-10 px-4 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={
                    applications.length > 0 &&
                    selectedIds.length === applications.length
                  }
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500/40"
                />
              </th>
              <th className="w-[40%] px-2 py-1 text-left">Candidate</th>
              <th className="w-[15%] px-2 py-1 text-left">Match score</th>
              <th className="w-[20%] px-2 py-1 text-left">Stage</th>
              <th className="w-[15%] px-2 py-1 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="align-top">
                {/* Checkbox */}
                <td className="px-4 py-1">
                  <input
                    type="checkbox"
                    aria-label={`Select ${app.fullName}`}
                    checked={selectedIds.includes(app.id)}
                    onChange={() => toggleRow(app.id)}
                    className="h-3.5 w-3.5 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500/40"
                  />
                </td>

                {/* Candidate card cell */}
                <td className="px-2 py-1">
                  <CandidateCell app={app} />
                </td>

                {/* Match score */}
                <td className="px-2 py-1 align-middle">
                  <MatchScoreCell app={app} />
                </td>

                {/* Stage inline (StageSelect) */}
                <td className="px-2 py-1 align-middle">
                  <StageSelect
                    jobId={jobId}
                    applicationId={app.id}
                    currentStage={app.stage}
                  />
                </td>

                {/* Status inline */}
                <td className="px-2 py-1 align-middle">
                  <StatusCell
                    app={app}
                    onChangeStatus={(status) =>
                      handleInlineStatusChange(app.id, status)
                    }
                  />
                </td>
              </tr>
            ))}

            {applications.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-[11px] text-slate-500"
                >
                  No candidates found for this view. Adjust filters or save a
                  new view for this job.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CandidateCell({ app }: { app: PipelineApp }) {
  const appliedOn = formatApplied(app.appliedAt);
  const topSkills = app.skillTags.slice(0, 3);

  return (
    <div className="flex min-w-0 justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
      <div className="min-w-0 space-y-1">
        {/* Name + email / link */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {app.candidateId ? (
              <Link
                href={`/ats/candidates/${app.candidateId}`}
                className="block truncate text-[13px] font-semibold text-slate-900 hover:text-indigo-700"
              >
                {app.fullName}
              </Link>
            ) : (
              <span className="block truncate text-[13px] font-semibold text-slate-900">
                {app.fullName}
              </span>
            )}
            {app.email && (
              <p className="truncate text-[11px] text-slate-500">
                {app.email}
              </p>
            )}
          </div>
        </div>

        {/* Meta: role / company / location */}
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

        {/* Tags + applied */}
        <div className="flex flex-wrap items-center gap-2">
          {topSkills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {topSkills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
                >
                  {skill.label}
                </span>
              ))}
            </div>
          )}

          {appliedOn && (
            <span className="text-[10px] text-slate-500">
              Applied · {appliedOn}
            </span>
          )}
        </div>
      </div>

      {/* Email icon floated so it stays neat regardless of text length */}
      {app.email && (
        <div className="flex items-start">
          <a
            href={`mailto:${app.email}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-[12px] text-slate-600 shadow-sm hover:bg-slate-50"
            title={`Email ${app.fullName}`}
          >
            ✉
          </a>
        </div>
      )}
    </div>
  );
}

function MatchScoreCell({ app }: { app: PipelineApp }) {
  const score = app.matchScore;
  const tier = app.tier;
  const scoreReason =
    app.scoreReason || app.matchReason || "Scored by semantic CV/JD engine.";

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tierColour(
          tier,
        )}`}
        title={scoreReason}
      >
        <span className={scoreColour(score)}>
          {score != null ? `${score}` : "–"}
        </span>
        {tier && (
          <span className="text-[10px] uppercase text-slate-500">
            · {tier}
          </span>
        )}
      </div>
      <span className="text-[10px] text-slate-500">Match score</span>
    </div>
  );
}

function StatusCell({
  app,
  onChangeStatus,
}: {
  app: PipelineApp;
  onChangeStatus: (status: string) => void;
}) {
  const value = (app.status || "PENDING").toUpperCase();

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={[
          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
          value === "REJECTED"
            ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
            : value === "ON_HOLD"
              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        ].join(" ")}
      >
        {value === "PENDING"
          ? "Accepted / active"
          : value === "ON_HOLD"
            ? "On hold"
            : "Rejected"}
      </span>

      <select
        value={value}
        onChange={(e) => onChangeStatus(e.target.value)}
        className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-[10px] text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
      >
        <option value="PENDING">Accepted / active</option>
        <option value="ON_HOLD">On hold</option>
        <option value="REJECTED">Rejected</option>
      </select>
    </div>
  );
}
