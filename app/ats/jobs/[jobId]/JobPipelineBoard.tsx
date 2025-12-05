// app/ats/jobs/[jobId]/JobPipelineBoard.tsx
"use client";

import { useMemo, useState } from "react";
import ApplicationStageStatusInline from "@/components/ats/jobs/ApplicationStageStatusInline";

type SkillTag = {
  id: string;
  label: string;
  color?: string | null;
};

type TimelineEvent = {
  id: string;
  type: string;
  createdAt: string;
  payload?: any;
};

type Interview = {
  id: string;
  type: string | null;
  scheduledAt: string;
  status: string;
  location: string | null;
  videoUrl: string | null;
};

export type PipelineApp = {
  id: string;
  fullName: string;
  email: string;
  location: string | null;
  source: string | null;
  stage: string | null;
  status: string | null;
  matchReason: string | null;
  createdAt: string;
  score: number | null;
  tier: string | null;
  engine: string | null;
  candidateTitle: string | null;
  candidateCompany: string | null;
  cvUrl: string | null;
  skillTags: SkillTag[];
  yearsExperienceLabel: string | null;
  notesCount: number;
  events: TimelineEvent[];
  interviews: Interview[];
};

export type StageColumn = {
  name: string;
  apps: PipelineApp[];
};

export type JobPipelineBoardProps = {
  jobId: string;
  stageNames: string[];
  stageOptions: string[];
  mode: "kanban" | "list";
  columns: StageColumn[];
  allVisibleApplicationIds: string[];
};

type DragState = {
  appId: string;
  fromStage: string;
};

type ActiveTab =
  | "overview"
  | "resume"
  | "interviews"
  | "evaluations"
  | "timeline";

function getTierColor(tier?: string | null) {
  if (!tier) return "bg-slate-100 text-slate-600";
  const upper = tier.toUpperCase();
  if (upper === "A") return "bg-emerald-100 text-emerald-700";
  if (upper === "B") return "bg-sky-100 text-sky-700";
  if (upper === "C") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function scoreColor(score?: number | null) {
  if (score == null) return "bg-slate-100 text-slate-600";
  if (score >= 85) return "bg-emerald-100 text-emerald-700";
  if (score >= 70) return "bg-sky-100 text-sky-700";
  if (score >= 60) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function formatShortDate(value: string) {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatTime(value: string) {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function moveAppBetweenStages(
  columns: StageColumn[],
  appId: string,
  targetStageName: string,
): StageColumn[] {
  const fromIndex = columns.findIndex((c) =>
    c.apps.some((a) => a.id === appId),
  );
  if (fromIndex === -1) return columns;

  const appIndex = columns[fromIndex].apps.findIndex((a) => a.id === appId);
  if (appIndex === -1) return columns;

  const app = columns[fromIndex].apps[appIndex];
  const updatedApp: PipelineApp = { ...app, stage: targetStageName };

  const newColumns: StageColumn[] = columns.map((c, idx) => {
    if (idx === fromIndex) {
      return {
        ...c,
        apps: c.apps.filter((a) => a.id !== appId),
      };
    }
    return { ...c };
  });

  const targetIndex = newColumns.findIndex(
    (c) => c.name.toUpperCase() === targetStageName.toUpperCase(),
  );
  if (targetIndex === -1) {
    // If the target column doesn't exist, don't mutate.
    return columns;
  }

  newColumns[targetIndex] = {
    ...newColumns[targetIndex],
    apps: [updatedApp, ...newColumns[targetIndex].apps],
  };

  return newColumns;
}

export default function JobPipelineBoard({
  jobId,
  stageNames,
  stageOptions,
  mode,
  columns: initialColumns,
  allVisibleApplicationIds,
}: JobPipelineBoardProps) {
  const [columns, setColumns] = useState<StageColumn[]>(initialColumns);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const [selectedApp, setSelectedApp] = useState<PipelineApp | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  const visibleIds = useMemo(
    () => columns.flatMap((c) => c.apps.map((a) => a.id)),
    [columns],
  );
  const visibleCount = visibleIds.length;

  const initialVisibleCount = allVisibleApplicationIds.length || visibleCount;

  function getNextStage(currentStage: string | null): string | null {
    if (!stageOptions.length) return null;
    if (!currentStage) return stageOptions[0];

    const idx = stageOptions.findIndex(
      (s) => s.toUpperCase() === currentStage.toUpperCase(),
    );
    if (idx === -1 || idx === stageOptions.length - 1) {
      return stageOptions[idx === -1 ? 0 : idx];
    }
    return stageOptions[idx + 1];
  }

  function handleDragStart(appId: string, fromStage: string) {
    setDragState({ appId, fromStage });
  }

  function handleDragEnd() {
    setDragState(null);
    setDragOverStage(null);
  }

  async function handleDrop(targetStage: string) {
    if (!dragState) return;
    const { appId, fromStage } = dragState;
    if (fromStage === targetStage) {
      handleDragEnd();
      return;
    }

    setColumns((prev) =>
      moveAppBetweenStages(prev, appId, targetStage),
    );
    setDragState(null);
    setDragOverStage(null);

    // Persist via existing bulk-stage API
    const form = new FormData();
    form.append("jobId", jobId);
    form.append("stage", targetStage);
    form.append("applicationIds", appId);

    try {
      await fetch("/api/ats/applications/bulk-stage", {
        method: "POST",
        body: form,
      });
    } catch (e) {
      // Silently ignore network errors – UI already moved
      console.error("Drag/drop stage update failed", e);
    }
  }

  async function handleAdvance(app: PipelineApp) {
    const targetStage = getNextStage(app.stage);
    if (!targetStage) return;

    setColumns((prev) =>
      moveAppBetweenStages(prev, app.id, targetStage),
    );

    const form = new FormData();
    form.append("jobId", jobId);
    form.append("stage", targetStage);
    form.append("applicationIds", app.id);

    try {
      await fetch("/api/ats/applications/bulk-stage", {
        method: "POST",
        body: form,
      });
    } catch (e) {
      console.error("Advance stage failed", e);
    }
  }

  async function handleReject(app: PipelineApp) {
    // Optimistic local status update
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        apps: col.apps.map((a) =>
          a.id === app.id ? { ...a, status: "REJECTED" } : a,
        ),
      })),
    );

    const form = new FormData();
    form.append("applicationId", app.id);

    try {
      await fetch("/api/ats/applications/reject", {
        method: "POST",
        body: form,
      });
    } catch (e) {
      console.error("Reject application failed", e);
    }
  }

  function openModal(app: PipelineApp, tab: ActiveTab = "overview") {
    setSelectedApp(app);
    setActiveTab(tab);
  }

  function closeModal() {
    setSelectedApp(null);
  }

  return (
    <>
      <form
        action="/api/ats/applications/bulk-stage"
        method="POST"
        className="flex flex-1 flex-col overflow-hidden"
      >
        <input type="hidden" name="jobId" value={jobId} />
        <input
          type="hidden"
          name="visibleApplicationIds"
          value={visibleIds.join(",")}
        />

        {/* Visible count */}
        <div className="px-4 pt-3 text-right text-[11px] text-slate-500">
          Visible applications:{" "}
          <span className="font-semibold text-slate-800">
            {visibleCount || initialVisibleCount}
          </span>
        </div>

        {/* Main board */}
        <div className="flex-1 overflow-x-auto bg-slate-50 px-4 py-4">
          {mode === "kanban" ? (
            <div className="flex min-w-full gap-4">
              {columns.map((column) => {
                const isDragOver =
                  dragOverStage &&
                  dragOverStage.toUpperCase() ===
                    column.name.toUpperCase();

                return (
                  <div
                    key={column.name}
                    className={[
                      "flex min-w-[260px] max-w-xs flex-1 flex-col rounded-2xl border bg-slate-950/95 text-slate-50",
                      isDragOver
                        ? "border-indigo-500 shadow-[0_0_0_1px_rgba(129,140,248,0.7)]"
                        : "border-slate-200",
                    ].join(" ")}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverStage(column.name);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(column.name);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                          {column.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {column.apps.length}{" "}
                          {column.apps.length === 1
                            ? "candidate"
                            : "candidates"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                      {column.apps.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-3 text-center text-[11px] text-slate-500">
                          No candidates in this stage yet.
                        </div>
                      )}

                      {column.apps.map((app) => (
                        <article
                          key={app.id}
                          draggable
                          onDragStart={() =>
                            handleDragStart(app.id, column.name)
                          }
                          onDragEnd={handleDragEnd}
                          className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-100"
                        >
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                name="applicationIds"
                                value={app.id}
                                className="mt-1 h-3 w-3 rounded border-slate-500 text-slate-900"
                              />
                              <div>
                                <div className="flex flex-wrap items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openModal(app, "overview")
                                    }
                                    className="text-[13px] font-semibold hover:underline"
                                  >
                                    {app.fullName}
                                  </button>
                                  {app.tier && (
                                    <span
                                      className={[
                                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                        getTierColor(app.tier),
                                      ].join(" ")}
                                    >
                                      Tier {app.tier}
                                    </span>
                                  )}
                                  {app.score != null && (
                                    <span
                                      className={[
                                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                                        scoreColor(app.score),
                                      ].join(" ")}
                                    >
                                      Score {app.score}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 text-[11px] text-slate-400">
                                  {app.email}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Skills + meta */}
                          {app.skillTags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {app.skillTags.slice(0, 4).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-100"
                                >
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            {app.location && (
                              <span className="inline-flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                                {app.location}
                              </span>
                            )}
                            {app.source && (
                              <span className="inline-flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                                Source: {app.source}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                              Applied: {formatShortDate(app.createdAt)}
                            </span>
                            {app.yearsExperienceLabel && (
                              <span className="inline-flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                                Experience: {app.yearsExperienceLabel}
                              </span>
                            )}
                          </div>

                          {/* Inline stage/status editor – preserves your flow */}
                          <ApplicationStageStatusInline
                            applicationId={app.id}
                            currentStage={app.stage}
                            currentStatus={app.status}
                            stageOptions={stageOptions}
                          />

                          {/* Match reason */}
                          {app.matchReason && (
                            <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">
                              {app.matchReason}
                            </p>
                          )}

                          {/* Activity + quick actions */}
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                            <div className="flex flex-wrap items-center gap-2">
                              {app.candidateTitle && (
                                <span className="inline-flex items-center gap-1">
                                  <span className="h-1 w-1 rounded-full bg-slate-500" />
                                  {app.candidateTitle}
                                </span>
                              )}
                              {app.notesCount > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  📝 {app.notesCount} note
                                  {app.notesCount === 1 ? "" : "s"}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openModal(app, "overview")}
                                className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-slate-700"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdvance(app)}
                                className="rounded-full bg-emerald-700/80 px-2 py-0.5 text-[10px] text-emerald-50 hover:bg-emerald-600"
                              >
                                Advance
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(app)}
                                className="rounded-full bg-rose-700/80 px-2 py-0.5 text-[10px] text-rose-50 hover:bg-rose-600"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => openModal(app, "overview")}
                                className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-slate-700"
                              >
                                Email
                              </button>
                              <button
                                type="button"
                                onClick={() => openModal(app, "interviews")}
                                className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-slate-700"
                              >
                                Schedule
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // List view
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              {visibleIds.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[11px] text-slate-500">
                  No candidates match the current filters. Adjust your
                  search or clear filters to see more results.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-fixed text-left text-[11px] text-slate-600">
                    <thead className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="w-8 py-2 pr-2" />
                        <th className="w-40 py-2 pr-2">Candidate</th>
                        <th className="w-32 py-2 pr-2">Skills</th>
                        <th className="w-24 py-2 pr-2 text-right">
                          Score / Tier
                        </th>
                        <th className="w-28 py-2 pr-2">Stage</th>
                        <th className="w-28 py-2 pr-2">Status</th>
                        <th className="w-32 py-2 pr-2">Source</th>
                        <th className="w-32 py-2 pr-2">Location</th>
                        <th className="w-32 py-2 pr-2">Applied</th>
                        <th className="w-40 py-2 pr-2 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.flatMap((col) =>
                        col.apps.map((app) => (
                          <tr
                            key={app.id}
                            className="border-b border-slate-50 last:border-0"
                          >
                            <td className="py-2 pr-2 align-middle">
                              <input
                                type="checkbox"
                                name="applicationIds"
                                value={app.id}
                                className="h-3 w-3 rounded border-slate-400"
                              />
                            </td>
                            <td className="py-2 pr-2 align-middle">
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => openModal(app, "overview")}
                                  className="text-[12px] font-medium text-slate-800 hover:underline"
                                >
                                  {app.fullName}
                                </button>
                                <span className="text-[10px] text-slate-500">
                                  {app.email}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 pr-2 align-middle">
                              <div className="flex flex-wrap gap-1">
                                {app.skillTags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
                                  >
                                    {tag.label}
                                  </span>
                                ))}
                                {app.yearsExperienceLabel && (
                                  <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">
                                    {app.yearsExperienceLabel}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 pr-2 text-right align-middle">
                              <div className="inline-flex flex-col items-end gap-1">
                                {app.score != null && (
                                  <span
                                    className={[
                                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                                      scoreColor(app.score),
                                    ].join(" ")}
                                  >
                                    {app.score}
                                  </span>
                                )}
                                {app.tier && (
                                  <span
                                    className={[
                                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                      getTierColor(app.tier),
                                    ].join(" ")}
                                  >
                                    Tier {app.tier}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 pr-2 align-middle text-[11px] text-slate-700">
                              {app.stage || "APPLIED"}
                            </td>
                            <td className="py-2 pr-2 align-middle text-[11px] text-slate-700">
                              {app.status || "PENDING"}
                            </td>
                            <td className="py-2 pr-2 align-middle text-[11px] text-slate-700">
                              {app.source || "—"}
                            </td>
                            <td className="py-2 pr-2 align-middle text-[11px] text-slate-700">
                              {app.location || "—"}
                            </td>
                            <td className="py-2 pr-2 align-middle text-[11px] text-slate-700">
                              {formatShortDate(app.createdAt)}
                            </td>
                            <td className="py-2 pr-2 text-right align-middle">
                              <div className="inline-flex flex-wrap items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openModal(app, "overview")}
                                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-200"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdvance(app)}
                                  className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] text-emerald-50 hover:bg-emerald-500"
                                >
                                  Advance
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(app)}
                                  className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] text-rose-50 hover:bg-rose-500"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bulk move bar */}
        <div className="border-t border-slate-200 bg-white px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
            <div>
              <span className="font-medium text-slate-800">
                Bulk actions
              </span>{" "}
              <span className="text-slate-500">
                Select candidates above, then move them to a new stage.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                name="stage"
                className="h-8 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
              >
                <option value="">Select stage…</option>
                {stageNames.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800"
              >
                Move selected
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Candidate detail modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-40 flex items-stretch justify-end bg-slate-950/40">
          <div className="flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
            {/* Modal header */}
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {selectedApp.fullName
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join("")}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-slate-900">
                        {selectedApp.fullName}
                      </h2>
                      {selectedApp.score != null && (
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                            scoreColor(selectedApp.score),
                          ].join(" ")}
                        >
                          Score {selectedApp.score}
                        </span>
                      )}
                      {selectedApp.tier && (
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            getTierColor(selectedApp.tier),
                          ].join(" ")}
                        >
                          Tier {selectedApp.tier}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {selectedApp.candidateTitle && (
                        <span>{selectedApp.candidateTitle}</span>
                      )}
                      {selectedApp.candidateCompany && (
                        <span>
                          {" "}
                          · {selectedApp.candidateCompany}
                        </span>
                      )}
                      {selectedApp.location && (
                        <span> · {selectedApp.location}</span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {selectedApp.email}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openModal(selectedApp, "overview")}
                    className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                  >
                    Move forward
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Stage progress */}
              <div className="mt-3">
                <ol className="flex items-center gap-2 text-[10px] text-slate-500">
                  {stageNames.map((stage, idx) => {
                    const currentIdx = stageNames.findIndex(
                      (s) =>
                        s.toUpperCase() ===
                        (selectedApp.stage || "").toUpperCase(),
                    );
                    const reached =
                      currentIdx === -1 ? false : idx <= currentIdx;
                    return (
                      <li
                        key={stage}
                        className="flex flex-1 items-center gap-1"
                      >
                        <span
                          className={[
                            "h-2 w-2 rounded-full",
                            reached
                              ? "bg-indigo-500"
                              : "bg-slate-300",
                          ].join(" ")}
                        />
                        <span
                          className={[
                            "truncate",
                            reached
                              ? "text-slate-800 font-medium"
                              : "",
                          ].join(" ")}
                        >
                          {stage}
                        </span>
                        {idx < stageNames.length - 1 && (
                          <span className="mx-1 h-px flex-1 bg-slate-200" />
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Tabs */}
              <div className="mt-3 flex gap-2 text-[11px]">
                {(["overview", "resume", "interviews", "evaluations", "timeline"] as ActiveTab[]).map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={[
                        "rounded-full px-3 py-1",
                        activeTab === tab
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      {tab === "overview"
                        ? "Overview"
                        : tab === "resume"
                        ? "Resume"
                        : tab === "interviews"
                        ? "Interviews"
                        : tab === "evaluations"
                        ? "Evaluations"
                        : "Timeline"}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto bg-white p-5">
              {activeTab === "overview" && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-4 md:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="mb-2 text-xs font-semibold text-slate-900">
                        Summary
                      </h3>
                      <div className="grid gap-2 text-[11px] text-slate-600 sm:grid-cols-2">
                        <div>
                          <div className="text-slate-500">
                            Location
                          </div>
                          <div className="font-medium text-slate-800">
                            {selectedApp.location || "Not specified"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">
                            Experience
                          </div>
                          <div className="font-medium text-slate-800">
                            {selectedApp.yearsExperienceLabel ||
                              "Not specified"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">
                            Source
                          </div>
                          <div className="font-medium text-slate-800">
                            {selectedApp.source || "Not specified"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">
                            Applied
                          </div>
                          <div className="font-medium text-slate-800">
                            {formatShortDate(selectedApp.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="mb-2 text-xs font-semibold text-slate-900">
                        Skills
                      </h3>
                      {selectedApp.skillTags.length === 0 ? (
                        <p className="text-[11px] text-slate-500">
                          No skills tagged yet. Tag candidates from
                          the pipeline view.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {selectedApp.skillTags.map((tag) => (
                            <span
                              key={tag.id}
                              className="rounded-full bg-slate-900 px-3 py-1 text-[11px] text-slate-50"
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="mb-2 text-xs font-semibold text-slate-900">
                        Quick note
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Notes are still captured from your existing
                        UI; this is a read-only shell for now.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "resume" && (
                <div className="h-[520px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {selectedApp.cvUrl ? (
                    <iframe
                      src={selectedApp.cvUrl}
                      className="h-full w-full rounded-xl border border-slate-200 bg-white"
                      title="Candidate resume"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[11px] text-slate-500">
                      No resume URL captured for this candidate yet.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "interviews" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-900">
                      Interviews
                    </h3>
                    <button
                      type="button"
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                    >
                      Schedule interview
                    </button>
                  </div>
                  {selectedApp.interviews.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-500">
                      No interviews scheduled yet. Use &ldquo;Schedule
                      interview&rdquo; to add one.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedApp.interviews.map((iv) => (
                        <div
                          key={iv.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px]"
                        >
                          <div>
                            <div className="font-medium text-slate-800">
                              {iv.type || "Interview"}
                            </div>
                            <div className="text-slate-500">
                              {formatTime(iv.scheduledAt)}
                              {iv.location && ` · ${iv.location}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                              {iv.status}
                            </span>
                            {iv.videoUrl && (
                              <a
                                href={iv.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-white hover:bg-slate-800"
                              >
                                Join meeting
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "evaluations" && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-500">
                  Evaluation storage isn&apos;t wired yet, but this
                  tab is ready for a 5-star rating + free-text
                  feedback component hooked into your scoring events
                  or a separate evaluations table.
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-900">
                    Activity timeline
                  </h3>
                  {selectedApp.events.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-500">
                      No activity captured yet for this application.
                      Once your application events pipeline is wired,
                      they&apos;ll appear here.
                    </div>
                  ) : (
                    <ol className="space-y-2 text-[11px] text-slate-600">
                      {selectedApp.events
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime(),
                        )
                        .map((ev) => (
                          <li
                            key={ev.id}
                            className="flex gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
                          >
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                            <div>
                              <div className="font-medium text-slate-800">
                                {ev.type}
                              </div>
                              <div className="text-slate-500">
                                {formatTime(ev.createdAt)}
                              </div>
                            </div>
                          </li>
                        ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
