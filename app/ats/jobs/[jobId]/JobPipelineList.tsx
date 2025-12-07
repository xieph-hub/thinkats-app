"use client";

import React, { useState } from "react";
import Link from "next/link";

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
  matchReason?: string | null;
  tier: string | null;
  scoreReason?: string | null;

  appliedAt: string; // ISO string
  skillTags: SkillTag[];
  experienceLabel: string | null;
};

type JobPipelineListProps = {
  jobId: string;
  applications: PipelineApp[];
  stageOptions: string[];
};

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "REJECTED", label: "Rejected" },
];

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  // yyyy-mm-dd
  return iso.slice(0, 10);
}

function scoreChipColor(score: number | null) {
  if (score == null) return "bg-slate-100 text-slate-600";
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 65) return "bg-sky-100 text-sky-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function tierChipColor(tier?: string | null) {
  if (!tier) return "bg-slate-100 text-slate-600";
  const upper = tier.toUpperCase();
  if (upper === "A") return "bg-emerald-100 text-emerald-700";
  if (upper === "B") return "bg-sky-100 text-sky-700";
  if (upper === "C") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function statusLabel(status: string | null) {
  const up = (status || "").toUpperCase();
  if (up === "PENDING") return "Active";
  if (up === "ON_HOLD") return "On hold";
  if (up === "REJECTED") return "Rejected";
  return up || "—";
}

function statusChipClass(status: string | null) {
  const up = (status || "").toUpperCase();
  if (up === "PENDING") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }
  if (up === "ON_HOLD") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }
  if (up === "REJECTED") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }
  return "bg-slate-50 text-slate-600 ring-1 ring-slate-200";
}

export default function JobPipelineList({
  jobId,
  applications,
  stageOptions,
}: JobPipelineListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allIds = applications.map((a) => a.id);
  const allSelected = selectedIds.length > 0 && selectedIds.length === allIds.length;

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : allIds));
  }

  async function handleBulkSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedIds.length) return;

    const formData = new FormData(e.currentTarget);
    const newStage = (formData.get("bulkStage") as string) || "";
    const newStatus = (formData.get("bulkStatus") as string) || "";

    // Nothing to do
    if (!newStage && !newStatus) return;

    setIsSubmitting(true);

    try {
      // Reuse existing /ats/applications/actions endpoint; one POST per application.
      await Promise.all(
        selectedIds.map((applicationId) => {
          const fd = new FormData();
          fd.append("jobId", jobId);
          fd.append("applicationId", applicationId);
          if (newStage) fd.append("newStage", newStage);
          if (newStatus) fd.append("newStatus", newStatus);
          // small hint for backend if you ever want to branch on origin
          fd.append("source", "job_pipeline_bulk");

          return fetch("/ats/applications/actions", {
            method: "POST",
            body: fd,
          });
        }),
      );

      setSelectedIds([]);

      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white">
      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <form
          onSubmit={handleBulkSubmit}
          className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px]"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">
              {selectedIds.length} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-[10px] text-indigo-600 hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              name="bulkStage"
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            >
              <option value="">Move to stage…</option>
              {stageOptions.map((stageName) => {
                const value = (stageName || "").toUpperCase();
                return (
                  <option key={value} value={value}>
                    {stageName}
                  </option>
                );
              })}
            </select>

            <select
              name="bulkStatus"
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            >
              <option value="">Change status…</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-8 items-center rounded-full bg-indigo-600 px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? "Updating…" : "Apply"}
            </button>
          </div>
        </form>
      )}

      {/* List table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-1 text-[11px]">
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-3 py-2">Candidate</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Tier / score</th>
              <th className="px-3 py-2 text-right">Applied</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => {
              const isSelected = selectedIds.includes(app.id);
              const appliedDate = formatDate(app.appliedAt);

              return (
                <tr key={app.id}>
                  {/* Checkbox */}
                  <td className="align-top px-3 py-2">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40"
                      checked={isSelected}
                      onChange={() => toggleSelect(app.id)}
                    />
                  </td>

                  {/* Candidate */}
                  <td className="align-top px-3 py-2">
                    <div
                      className={[
                        "flex flex-col gap-0.5 rounded-xl border px-3 py-2",
                        isSelected
                          ? "border-indigo-300 bg-indigo-50/70"
                          : "border-slate-100 bg-slate-50/70",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={
                              app.candidateId
                                ? `/ats/candidates/${app.candidateId}`
                                : "#"
                            }
                            className="text-[11px] font-semibold text-slate-900 hover:underline"
                          >
                            {app.fullName}
                          </Link>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                            {app.email && <span>{app.email}</span>}
                            {app.location && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>{app.location}</span>
                              </>
                            )}
                            {app.currentCompany && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>{app.currentCompany}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end text-[10px] text-slate-500">
                          <span>Added {appliedDate}</span>
                          {app.source && (
                            <span className="mt-0.5 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
                              {app.source}
                            </span>
                          )}
                        </div>
                      </div>

                      {app.skillTags && app.skillTags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {app.skillTags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-700"
                            >
                              {tag.label}
                            </span>
                          ))}
                          {app.skillTags.length > 3 && (
                            <span className="text-[9px] text-slate-400">
                              +{app.skillTags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Stage */}
                  <td className="align-top px-3 py-2 text-[10px] text-slate-600">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-slate-900">
                        {(app.stage || "APPLIED").toUpperCase()}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="align-top px-3 py-2 text-[10px] text-slate-600">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        statusChipClass(app.status),
                      ].join(" ")}
                    >
                      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {statusLabel(app.status)}
                    </span>
                  </td>

                  {/* Tier / score */}
                  <td className="align-top px-3 py-2 text-right">
                    <div className="flex flex-col items-end gap-1">
                      {app.tier && (
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            tierChipColor(app.tier),
                          ].join(" ")}
                        >
                          Tier {app.tier.toUpperCase()}
                        </span>
                      )}
                      {app.matchScore != null && (
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                            scoreChipColor(app.matchScore),
                          ].join(" ")}
                        >
                          Score {app.matchScore}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Applied at */}
                  <td className="align-top px-3 py-2 text-right text-[10px] text-slate-600">
                    {appliedDate}
                  </td>

                  {/* Actions */}
                  <td className="align-top px-3 py-2 text-right text-[10px] text-slate-600">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {app.email && (
                        <a
                          href={`mailto:${app.email}`}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          ✉ Email
                        </a>
                      )}
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

        {applications.length === 0 && (
          <div className="px-6 py-10 text-center text-[11px] text-slate-500">
            No applications in this view yet.
          </div>
        )}
      </div>
    </div>
  );
}
