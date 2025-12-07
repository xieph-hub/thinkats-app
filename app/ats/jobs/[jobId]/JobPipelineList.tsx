// app/ats/jobs/[jobId]/JobPipelineList.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { PipelineApp, StageInfo } from "./JobPipelineBoard";

type JobPipelineListProps = {
  jobId: string;
  stages: StageInfo[];
  applications: PipelineApp[];
};

type StageOption = {
  label: string;
  value: string;
};

const DEFAULT_STAGE_NAMES = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

function normaliseStages(stageInfos: StageInfo[]): StageOption[] {
  const base =
    stageInfos && stageInfos.length > 0
      ? stageInfos.map((s) => s.name)
      : DEFAULT_STAGE_NAMES;

  return base.map((name) => {
    const label = name || "UNASSIGNED";
    return {
      label,
      value: label.toUpperCase(),
    };
  });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

function scoreChipColor(score: number | null): string {
  if (score == null) return "bg-slate-100 text-slate-600";
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 65) return "bg-sky-100 text-sky-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function tierChipColor(tier: string | null | undefined): string {
  const upper = (tier || "").toUpperCase();
  if (!upper) return "bg-slate-100 text-slate-600";
  if (upper === "A") return "bg-emerald-100 text-emerald-700";
  if (upper === "B") return "bg-sky-100 text-sky-700";
  if (upper === "C") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function statusChipClass(status: string | null): string {
  const up = (status || "").toUpperCase();
  if (up === "PENDING") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (up === "ON_HOLD") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  if (up === "REJECTED") {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }
  return "bg-slate-50 text-slate-600 ring-slate-200";
}

function statusLabel(status: string | null): string {
  const up = (status || "").toUpperCase();
  if (up === "PENDING") return "Active";
  if (up === "ON_HOLD") return "On hold";
  if (up === "REJECTED") return "Rejected";
  return up || "—";
}

export default function JobPipelineList({
  jobId,
  stages,
  applications,
}: JobPipelineListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  const [bulkStage, setBulkStage] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkTier, setBulkTier] = useState("");

  const [inlineUpdatingId, setInlineUpdatingId] = useState<string | null>(null);

  const stageOptions = normaliseStages(stages);

  const tiersInData = Array.from(
    new Set(
      applications
        .map((a) => (a.tier || "").toUpperCase())
        .filter(Boolean),
    ),
  );

  const statusOptions = [
    { value: "PENDING", label: "Accepted / active" },
    { value: "ON_HOLD", label: "On hold" },
    { value: "REJECTED", label: "Rejected" },
  ];

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? applications.map((a) => a.id) : []);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  }

  async function updateApplication(
    appId: string,
    opts: {
      newStage?: string;
      newStatus?: string;
      newTier?: string;
      source: string;
    },
  ) {
    const fd = new FormData();
    fd.append("jobId", jobId);
    fd.append("applicationId", appId);
    if (opts.newStage) fd.append("newStage", opts.newStage);
    if (opts.newStatus) fd.append("newStatus", opts.newStatus);
    if (opts.newTier) fd.append("newTier", opts.newTier);
    fd.append("source", opts.source);

    await fetch("/ats/applications/actions", {
      method: "POST",
      body: fd,
    });
  }

  async function handleInlineUpdate(
    appId: string,
    field: "stage" | "status" | "tier",
    value: string,
  ) {
    if (!value) return;
    setInlineUpdatingId(appId);

    try {
      const payload: {
        newStage?: string;
        newStatus?: string;
        newTier?: string;
        source: string;
      } = {
        source: `job_pipeline_list_inline_${field}`,
      };

      if (field === "stage") payload.newStage = value;
      if (field === "status") payload.newStatus = value;
      if (field === "tier") payload.newTier = value;

      await updateApplication(appId, payload);

      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } finally {
      setInlineUpdatingId(null);
    }
  }

  async function handleApplyBulk() {
    if (!selectedIds.length) return;
    if (!bulkStage && !bulkStatus && !bulkTier) return;

    setIsBulkSubmitting(true);
    try {
      const promises: Promise<void>[] = [];

      for (const id of selectedIds) {
        if (bulkStage) {
          promises.push(
            updateApplication(id, {
              newStage: bulkStage,
              source: "job_pipeline_bulk_stage",
            }),
          );
        }
        if (bulkStatus) {
          promises.push(
            updateApplication(id, {
              newStatus: bulkStatus,
              source: "job_pipeline_bulk_status",
            }),
          );
        }
        if (bulkTier) {
          promises.push(
            updateApplication(id, {
              newTier: bulkTier,
              source: "job_pipeline_bulk_tier",
            }),
          );
        }
      }

      await Promise.all(promises);

      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } finally {
      setIsBulkSubmitting(false);
    }
  }

  const anySelected = selectedIds.length > 0;

  if (!applications.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
        No applications in this view yet. Once candidates apply, they will
        appear here and you can move them through stages, assign tiers and run
        bulk actions.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Bulk actions bar */}
      {anySelected && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-[11px] text-indigo-900">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 items-center rounded-full bg-indigo-600 px-2 text-[10px] font-semibold text-white">
              {selectedIds.length} selected
            </span>
            <span className="text-[11px]">
              Apply a stage, decision or tier to all selected candidates.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stage */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide">
                Stage
              </span>
              <select
                value={bulkStage}
                onChange={(e) => setBulkStage(e.target.value)}
                className="h-7 min-w-[120px] rounded-md border border-indigo-200 bg-white px-2 text-[11px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="">No change</option>
                {stageOptions.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide">
                Decision
              </span>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="h-7 min-w-[120px] rounded-md border border-indigo-200 bg-white px-2 text-[11px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="">No change</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tier */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide">
                Tier
              </span>
              <select
                value={bulkTier}
                onChange={(e) => setBulkTier(e.target.value)}
                className="h-7 min-w-[90px] rounded-md border border-indigo-200 bg-white px-2 text-[11px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="">No change</option>
                {tiersInData.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleApplyBulk}
              disabled={
                isBulkSubmitting || (!bulkStage && !bulkStatus && !bulkTier)
              }
              className="inline-flex h-8 items-center rounded-full bg-indigo-600 px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {isBulkSubmitting ? "Applying…" : "Apply to selected"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="w-8 px-3 py-2 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={selectedIds.length === applications.length}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40"
                />
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Candidate
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Source &amp; stage
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Tier &amp; score
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Decision
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Applied
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => {
              const appliedDate = formatDate(app.appliedAt);
              const stageValue = (
                app.stage ||
                stageOptions[0]?.value ||
                "APPLIED"
              ).toUpperCase();
              const tierValue = (app.tier || "").toUpperCase();
              const statusValue = (app.status || "PENDING").toUpperCase();

              const stageLabel =
                stageOptions.find((s) => s.value === stageValue)?.label ||
                stageValue;

              const initials = getInitials(app.fullName);

              return (
                <tr key={app.id} className="hover:bg-slate-50/70">
                  {/* Select */}
                  <td className="whitespace-nowrap px-3 py-3 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(app.id)}
                      onChange={(e) => toggleOne(app.id, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40"
                    />
                  </td>

                  {/* Candidate card */}
                  <td className="min-w-[220px] px-3 py-3 align-top">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          {app.candidateId ? (
                            <Link
                              href={`/ats/candidates/${app.candidateId}`}
                              className="truncate text-[13px] font-semibold text-slate-900 hover:underline"
                            >
                              {app.fullName}
                            </Link>
                          ) : (
                            <span className="truncate text-[13px] font-semibold text-slate-900">
                              {app.fullName}
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                          {app.currentTitle && <span>{app.currentTitle}</span>}
                          {app.currentTitle && app.currentCompany && (
                            <span className="text-slate-300">•</span>
                          )}
                          {app.currentCompany && (
                            <span>{app.currentCompany}</span>
                          )}
                          {(app.currentTitle || app.currentCompany) &&
                            app.location && (
                              <span className="text-slate-300">•</span>
                            )}
                          {app.location && <span>{app.location}</span>}
                        </div>

                        {app.email && (
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            {app.email}
                          </div>
                        )}

                        {app.skillTags && app.skillTags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {app.skillTags.slice(0, 3).map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
                              >
                                {tag.label}
                              </span>
                            ))}
                            {app.skillTags.length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{app.skillTags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Source & Stage */}
                  <td className="min-w-[160px] px-3 py-3 align-top">
                    <div className="flex flex-col gap-1 text-[11px] text-slate-500">
                      <div className="flex flex-wrap items-center gap-1">
                        {app.source && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                            {app.source}
                          </span>
                        )}
                        {app.experienceLabel && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                            {app.experienceLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-slate-500">
                          Stage
                        </span>
                        <select
                          value={stageValue}
                          onChange={(e) =>
                            handleInlineUpdate(
                              app.id,
                              "stage",
                              e.target.value,
                            )
                          }
                          disabled={inlineUpdatingId === app.id}
                          className="h-7 min-w-[130px] rounded-full border border-slate-200 bg-slate-50 px-2 text-[10px] text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                        >
                          {stageOptions.map((stage) => (
                            <option key={stage.value} value={stage.value}>
                              {stage.label}
                            </option>
                          ))}
                        </select>
                        {inlineUpdatingId === app.id && (
                          <span className="text-[9px] text-indigo-500">
                            Updating…
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Tier & score */}
                  <td className="min-w-[150px] px-3 py-3 align-top">
                    <div className="flex flex-col gap-1 text-[11px] text-slate-500">
                      <div className="flex flex-wrap items-center gap-1">
                        {tierValue && (
                          <span
                            className={[
                              "inline-flex h-6 min-w-[32px] items-center justify-center rounded-full px-2 text-[10px] font-semibold",
                              tierChipColor(tierValue),
                            ].join(" ")}
                          >
                            {tierValue}
                          </span>
                        )}

                        {typeof app.matchScore === "number" && (
                          <span
                            className={[
                              "inline-flex h-6 items-center rounded-full px-2 text-[10px] font-medium",
                              scoreChipColor(app.matchScore),
                            ].join(" ")}
                          >
                            {app.matchScore}
                          </span>
                        )}
                      </div>

                      {app.matchReason && (
                        <p className="line-clamp-2 max-w-xs text-[10px] text-slate-500">
                          {app.matchReason}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Decision */}
                  <td className="min-w-[120px] px-3 py-3 align-top">
                    <div className="flex flex-col gap-1 text-[11px] text-slate-500">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                          statusChipClass(statusValue),
                        ].join(" ")}
                      >
                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {statusLabel(statusValue)}
                      </span>
                    </div>
                  </td>

                  {/* Applied */}
                  <td className="whitespace-nowrap px-3 py-3 align-top text-[11px] text-slate-500">
                    {appliedDate && <span>Applied {appliedDate}</span>}
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap px-3 py-3 align-top text-right">
                    <div className="flex flex-col items-end gap-1 text-[11px]">
                      {app.candidateId && (
                        <Link
                          href={`/ats/candidates/${app.candidateId}`}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View profile
                        </Link>
                      )}
                      <Link
                        href={`/ats/jobs/${jobId}`}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Open in pipeline
                      </Link>
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
