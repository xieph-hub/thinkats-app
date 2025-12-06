// app/ats/jobs/[jobId]/JobPipelineBoard.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { Download, Star } from "lucide-react";

type SkillTag = {
  id: string;
  label: string;
  color?: string | null;
};

export type PipelineAppRow = {
  id: string; // application id
  candidateId: string | null;

  fullName: string;
  email: string;
  location: string | null;
  source: string | null;
  stage: string | null;
  status: string | null;
  matchScore: number | null;
  matchReason: string | null;
  tier: string | null;
  appliedAt: string; // ISO date string
  skillTags: SkillTag[];
  experienceLabel: string | null;
};

export type JobPipelineBoardProps = {
  jobId: string;
  stageOptions: string[];
  apps: PipelineAppRow[];
};

type DecisionStatus = "PENDING" | "ON_HOLD" | "REJECTED";

function formatDate(iso: string) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function initialsFromName(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return (
    (parts[0][0]?.toUpperCase() || "") +
    (parts[parts.length - 1][0]?.toUpperCase() || "")
  );
}

// --- Scoring + badges (mock-style) -----------------------------------------

function getScoreColor(score: number | null) {
  if (score == null) return "#9CA3AF"; // slate-400
  if (score >= 90) return "#22C55E";   // emerald-500
  if (score >= 80) return "#2563EB";   // indigo/blue-600
  if (score >= 70) return "#FACC15";   // amber-400
  return "#EF4444";                    // red-500
}

function scoreBadgeClasses(score: number | null) {
  if (score == null) return "bg-slate-100 text-slate-600";
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 65) return "bg-sky-100 text-sky-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function tierBadgeClasses(tier: string | null) {
  if (!tier) return "bg-slate-100 text-slate-600";
  const upper = tier.toUpperCase();
  if (upper === "A")
    return "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
  if (upper === "B")
    return "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20";
  if (upper === "C")
    return "bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/20";
  return "bg-slate-100 text-slate-600";
}

function decisionLabel(status: string | null) {
  const upper = (status || "PENDING").toUpperCase() as DecisionStatus;
  if (upper === "ON_HOLD") return "On hold";
  if (upper === "REJECTED") return "Rejected";
  return "Accepted / active";
}

function decisionChipClasses(status: string | null) {
  const upper = (status || "PENDING").toUpperCase() as DecisionStatus;
  if (upper === "ON_HOLD") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }
  if (upper === "REJECTED") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }
  return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
}

function stagePillClasses() {
  // Neutral stage pill – score + decision carry the colour weight
  return "border border-slate-200 bg-white text-slate-700";
}

function skillTagStyle(tag: SkillTag): React.CSSProperties {
  if (!tag.color) {
    return {
      backgroundColor: "rgba(148, 163, 184, 0.1)",
      color: "#111827",
    };
  }
  // Use 8-digit hex (RRGGBBAA) to fade background: e.g. #2563EB15
  const base = tag.color.trim();
  const bgHex = base.length === 7 ? `${base}20` : base;
  return {
    backgroundColor: bgHex,
    color: base,
  };
}

// --- Export helpers --------------------------------------------------------

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const s = String(value).replace(/"/g, '""');
  return `"${s}"`;
}

function buildExportContent(rows: PipelineAppRow[], delimiter: string) {
  const headers = [
    "Candidate name",
    "Email",
    "Location",
    "Experience",
    "Stage",
    "Status",
    "Tier",
    "Match score",
    "Source",
    "Applied at",
    "Skills",
  ];

  const lines = rows.map((r) => {
    const skills = (r.skillTags || []).map((t) => t.label).join(", ");
    const applied = formatDate(r.appliedAt);
    const cells = [
      r.fullName,
      r.email,
      r.location || "",
      r.experienceLabel || "",
      r.stage || "APPLIED",
      r.status || "PENDING",
      r.tier || "",
      r.matchScore != null ? r.matchScore : "",
      r.source || "",
      applied,
      skills,
    ];
    return cells.map(escapeCsvValue).join(delimiter);
  });

  return [headers.map(escapeCsvValue).join(delimiter), ...lines].join("\n");
}

function triggerDownload(
  rows: PipelineAppRow[],
  jobId: string,
  format: "csv" | "xls",
) {
  if (rows.length === 0) return;

  const delimiter = format === "csv" ? "," : "\t";
  const content = buildExportContent(rows, delimiter);
  const blob = new Blob([content], {
    type:
      format === "csv"
        ? "text/csv;charset=utf-8;"
        : "application/vnd.ms-excel;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `thinkats-job-${jobId}-pipeline-${today}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --- Component -------------------------------------------------------------

export default function JobPipelineBoard({
  jobId,
  stageOptions,
  apps,
}: JobPipelineBoardProps) {
  const [rows, setRows] = useState<PipelineAppRow[]>(apps);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStage, setBulkStage] = useState<string>("");
  const [bulkStatus, setBulkStatus] = useState<DecisionStatus | "">("");
  const [isBulkSubmitting, startBulkTransition] = useTransition();
  const [inlineSavingId, setInlineSavingId] = useState<string | null>(null);

  // keep in sync with server-filtered props
  useEffect(() => {
    setRows(apps);
    setSelectedIds([]);
    setBulkStage("");
    setBulkStatus("");
  }, [apps]);

  const total = rows.length;
  const acceptedCount = rows.filter(
    (r) => (r.status || "PENDING").toUpperCase() === "PENDING",
  ).length;
  const onHoldCount = rows.filter(
    (r) => (r.status || "").toUpperCase() === "ON_HOLD",
  ).length;
  const rejectedCount = rows.filter(
    (r) => (r.status || "").toUpperCase() === "REJECTED",
  ).length;

  const allSelected = total > 0 && selectedIds.length === total;
  const partiallySelected =
    selectedIds.length > 0 && selectedIds.length < total;

  function toggleSelectAll() {
    if (allSelected || partiallySelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((r) => r.id));
    }
  }

  function toggleRowSelection(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function updateSingleInline(
    appId: string,
    updates: { status?: DecisionStatus; stage?: string },
  ) {
    const row = rows.find((r) => r.id === appId);
    if (!row) return;

    setInlineSavingId(appId);

    try {
      const formData = new FormData();
      formData.set("jobId", jobId);
      formData.set("applicationIds", appId);
      formData.set("stage", updates.stage ?? row.stage ?? "APPLIED");
      formData.set(
        "status",
        (updates.status ?? (row.status as DecisionStatus) ?? "PENDING") as string,
      );

      await fetch("/api/ats/applications/bulk-stage", {
        method: "POST",
        body: formData,
      });

      setRows((prev) =>
        prev.map((r) =>
          r.id === appId
            ? {
                ...r,
                stage: updates.stage !== undefined ? updates.stage : r.stage,
                status:
                  updates.status !== undefined ? updates.status : r.status,
              }
            : r,
        ),
      );
    } catch (err) {
      console.error("Failed to update application inline", err);
    } finally {
      setInlineSavingId(null);
    }
  }

  function handleInlineStatusChange(appId: string, value: string) {
    const v = (value || "PENDING").toUpperCase() as DecisionStatus;
    updateSingleInline(appId, { status: v });
  }

  function handleInlineStageChange(appId: string, value: string) {
    updateSingleInline(appId, { stage: value || "APPLIED" });
  }

  function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    if (!bulkStage && !bulkStatus) return;

    startBulkTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("jobId", jobId);
        formData.set("applicationIds", selectedIds.join(","));
        if (bulkStage) formData.set("stage", bulkStage);
        if (bulkStatus) formData.set("status", bulkStatus);

        await fetch("/api/ats/applications/bulk-stage", {
          method: "POST",
          body: formData,
        });

        setRows((prev) =>
          prev.map((r) => {
            if (!selectedIds.includes(r.id)) return r;
            return {
              ...r,
              stage: bulkStage || r.stage,
              status: bulkStatus || r.status,
            };
          }),
        );
        setSelectedIds([]);
      } catch (err) {
        console.error("Bulk update failed", err);
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Summary + bulk + export */}
      <section className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Summary chips */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-slate-800 ring-1 ring-indigo-100">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
              {total}{" "}
              {total === 1
                ? "candidate in pipeline"
                : "candidates in pipeline"}
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {acceptedCount} accepted / active
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-amber-700 ring-1 ring-amber-100">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
              {onHoldCount} on hold
            </span>
            <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-rose-700 ring-1 ring-rose-100">
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
              {rejectedCount} rejected
            </span>
          </div>

          {/* Bulk bar + export */}
          <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-end">
            <form
              onSubmit={handleBulkSubmit}
              className="flex flex-wrap items-center gap-2 text-[11px]"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Bulk actions
              </span>
              <select
                value={bulkStatus}
                onChange={(e) =>
                  setBulkStatus(e.target.value as DecisionStatus | "")
                }
                className="h-8 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="">Decision…</option>
                <option value="PENDING">Accept / active</option>
                <option value="ON_HOLD">On hold</option>
                <option value="REJECTED">Reject</option>
              </select>
              <select
                value={bulkStage}
                onChange={(e) => setBulkStage(e.target.value)}
                className="h-8 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="">Stage…</option>
                {stageOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={
                  selectedIds.length === 0 ||
                  (!bulkStage && !bulkStatus) ||
                  isBulkSubmitting
                }
                className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isBulkSubmitting
                  ? "Updating…"
                  : `Apply to ${selectedIds.length || 0} selected`}
              </button>
            </form>

            {/* Export buttons */}
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => triggerDownload(rows, jobId, "csv")}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => triggerDownload(rows, jobId, "xls")}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-slate-900 px-3 text-[11px] font-medium text-white shadow-sm hover:bg-slate-800"
              >
                <Download className="h-3.5 w-3.5" />
                Export Excel
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="flex-1 overflow-x-auto bg-white px-5 pb-5 pt-3">
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-[11px] text-slate-500">
            <p className="mb-1 font-medium text-slate-700">
              No candidates match this view.
            </p>
            <p>
              Adjust filters above or broaden your search to see more of the
              pipeline.
            </p>
          </div>
        ) : (
          <table className="min-w-full border-separate border-spacing-y-2 text-[11px]">
            <thead>
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-1">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex h-4 w-4 items-center justify-center rounded border border-slate-300 bg-white"
                    aria-checked={allSelected}
                  >
                    {allSelected || partiallySelected ? (
                      <span className="h-2 w-2 rounded bg-slate-900" />
                    ) : null}
                  </button>
                </th>
                <th className="px-3 py-1">Candidate</th>
                <th className="px-3 py-1">Match</th>
                <th className="px-3 py-1">Decision</th>
                <th className="px-3 py-1">Stage</th>
                <th className="px-3 py-1">Source</th>
                <th className="px-3 py-1">Applied</th>
                <th className="px-3 py-1 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((app) => {
                const isSelected = selectedIds.includes(app.id);
                const saving = inlineSavingId === app.id;
                const statusUpper = (app.status ||
                  "PENDING") as DecisionStatus;

                const score = app.matchScore ?? null;
                const circumference = 2 * Math.PI * 28;
                const progress =
                  score != null ? Math.max(0, Math.min(100, score)) : 0;
                const offset =
                  circumference - (progress / 100) * circumference;

                return (
                  <tr
                    key={app.id}
                    className="align-top transition hover:bg-indigo-50/40"
                  >
                    <td className="align-top px-3">
                      <button
                        type="button"
                        onClick={() => toggleRowSelection(app.id)}
                        className={[
                          "mt-2 flex h-4 w-4 items-center justify-center rounded border bg-white",
                          isSelected
                            ? "border-slate-900"
                            : "border-slate-300",
                        ].join(" ")}
                      >
                        {isSelected && (
                          <span className="h-2 w-2 rounded bg-slate-900" />
                        )}
                      </button>
                    </td>

                    {/* Candidate cell */}
                    <td className="align-top px-3">
                      <div className="flex gap-2">
                        <div className="relative mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-indigo-600 text-[11px] font-semibold text-slate-50 shadow-sm">
                          {initialsFromName(app.fullName)}
                          {app.tier?.toUpperCase() === "A" && (
                            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] text-slate-900 shadow">
                              <Star className="h-3 w-3 fill-slate-900 text-slate-900" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {app.candidateId ? (
                            <Link
                              href={`/ats/candidates/${app.candidateId}`}
                              className="text-[11px] font-semibold text-slate-900 hover:text-indigo-700 hover:underline"
                            >
                              {app.fullName}
                            </Link>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-900">
                              {app.fullName}
                            </span>
                          )}

                          <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                            {app.email && <span>{app.email}</span>}
                            {app.location && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>{app.location}</span>
                              </>
                            )}
                            {app.experienceLabel && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>{app.experienceLabel}</span>
                              </>
                            )}
                          </div>

                          {/* Skill tags – more visually prominent */}
                          {app.skillTags?.length > 0 && (
                            <div className="mt-0.5 flex flex-wrap gap-1">
                              {app.skillTags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium"
                                  style={skillTagStyle(tag)}
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
                      </div>
                    </td>

                    {/* Match (score + tier, mock-style) */}
                    <td className="align-top px-3">
                      <div className="mt-1 flex items-center gap-2">
                        {/* Circular score dial */}
                        <div className="relative h-12 w-12">
                          <svg className="h-12 w-12 -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="18"
                              stroke="#E5E7EB"
                              strokeWidth="4"
                              fill="none"
                            />
                            {score != null && (
                              <circle
                                cx="24"
                                cy="24"
                                r="18"
                                stroke={getScoreColor(score)}
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                className="transition-all duration-500"
                              />
                            )}
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[11px] font-semibold text-slate-900">
                              {score != null ? score : "—"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          {app.tier && (
                            <span
                              className={[
                                "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold",
                                tierBadgeClasses(app.tier),
                              ].join(" ")}
                            >
                              <Star className="h-3 w-3" />
                              Tier {app.tier.toUpperCase()}
                            </span>
                          )}
                          {score != null && (
                            <span
                              className={[
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px]",
                                scoreBadgeClasses(score),
                              ].join(" ")}
                            >
                              Match score
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Decision (status) */}
                    <td className="align-top px-3">
                      <div className="mt-1 flex flex-col gap-1">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            decisionChipClasses(app.status),
                          ].join(" ")}
                        >
                          {decisionLabel(app.status)}
                        </span>
                        <select
                          disabled={saving}
                          value={statusUpper}
                          onChange={(e) =>
                            handleInlineStatusChange(app.id, e.target.value)
                          }
                          className="h-7 rounded-full border border-slate-200 bg-white px-2 text-[10px] text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          <option value="PENDING">Accept / active</option>
                          <option value="ON_HOLD">On hold</option>
                          <option value="REJECTED">Reject</option>
                        </select>
                      </div>
                    </td>

                    {/* Stage */}
                    <td className="align-top px-3">
                      <div className="mt-1 flex flex-col gap-1">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px]",
                            stagePillClasses(),
                          ].join(" ")}
                        >
                          {app.stage || "APPLIED"}
                        </span>
                        <select
                          disabled={saving}
                          value={app.stage || ""}
                          onChange={(e) =>
                            handleInlineStageChange(app.id, e.target.value)
                          }
                          className="h-7 rounded-full border border-slate-200 bg-white px-2 text-[10px] text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          <option value="">Select stage…</option>
                          {stageOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Source */}
                    <td className="align-top px-3">
                      <div className="mt-1 text-[10px] text-slate-600">
                        {app.source || "—"}
                      </div>
                    </td>

                    {/* Applied */}
                    <td className="align-top px-3">
                      <div className="mt-1 text-[10px] text-slate-600">
                        {formatDate(app.appliedAt)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="align-top px-3 text-right">
                      <div className="mt-1 flex flex-wrap justify-end gap-1 text-[10px]">
                        {app.candidateId && (
                          <Link
                            href={`/ats/candidates/${app.candidateId}`}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            View profile
                          </Link>
                        )}
                        {app.email && (
                          <Link
                            href={`mailto:${encodeURIComponent(app.email)}`}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            Email
                          </Link>
                        )}
                      </div>
                      {saving && (
                        <div className="mt-1 text-[9px] text-slate-400">
                          Saving…
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
