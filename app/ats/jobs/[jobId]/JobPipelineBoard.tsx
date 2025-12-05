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
  if (targetIndex === -1) return columns;

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
            <div className="flex min-w-full gap-3">
              {columns.map((column) => {
                const isDragOver =
                  dragOverStage &&
                  dragOverStage.toUpperCase() ===
                    column.name.toUpperCase();

                return (
                  <div
                    key={column.name}
                    className={[
                      "flex min-w-[250px] max-w-sm flex-1 flex-col rounded-2xl border bg-white",
                      isDragOver
                        ? "border-indigo-400 shadow-[0_0_0_1px_rgba(129,140,248,0.6)]"
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
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                          {column.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {column.apps.length}{" "}
                          {column.apps.length === 1
                            ? "candidate"
                            : "candidates"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                      {column.apps.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-[11px] text-slate-500">
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
                          className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 shadow-sm"
                        >
                          {/* Header row: initials + name + score/tier */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                name="applicationIds"
                                value={app.id}
                                className="mt-1 h-3 w-3 rounded border-slate-400"
                              />
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                                {app.fullName
                                  .split(" ")
                                  .slice(0, 2)
                                  .map((p) => p[0]?.toUpperCase())
                                  .join("")}
                              </div>
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openModal(app, "overview")
                                  }
                                  className="text-[12px] font-semibold text-slate-900 hover:underline"
                                >
                                  {app.fullName}
                                </button>
                                <div className="text-[10px] text-slate-500">
                                  {app.email}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
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
                          </div>

                          {/* Skills row (compact) */}
                          {app.skillTags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {app.skillTags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-700"
                                >
                                  {tag.label}
                                </span>
                              ))}
                              {app.yearsExperienceLabel && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                                  {app.yearsExperienceLabel}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                            {app.location && (
                              <span className="inline-flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                {app.location}
                              </span>
                            )}
                            {app.source && (
                              <span className="inline-flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                {app.source}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              {formatShortDate(app.createdAt)}
                            </span>
                            {app.notesCount > 0 && (
                              <span className="inline-flex items-center gap-1">
                                📝 {app.notesCount}
                              </span>
                            )}
                          </div>

                          {/* Inline stage / status editor – your existing logic */}
                          <ApplicationStageStatusInline
                            applicationId={app.id}
                            currentStage={app.stage}
                            currentStatus={app.status}
                            stageOptions={stageOptions}
                          />

                          {/* Match reason (single line, compact) */}
                          {app.matchReason && (
                            <p className="line-clamp-2 text-[10px] text-slate-600">
                              {app.matchReason}
                            </p>
                          )}

                          {/* Quick actions (small pills, less vertical space) */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px]">
                            <div className="text-slate-500">
                              {app.candidateTitle && (
                                <span>{app.candidateTitle}</span>
                              )}
                              {app.candidateCompany && (
                                <span> · {app.candidateCompany}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  openModal(app, "overview")
                                }
                                className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-100"
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
                              <button
                                type="button"
                                onClick={() =>
                                  openModal(app, "overview")
                                }
                                className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-100"
                              >
                                Email
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openModal(app, "interviews")
                                }
                                className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-100"
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
            // List view — same as before, left unchanged
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              {/* ... your existing list view implementation ... */}
            </div>
          )}
        </div>

        {/* Bulk move bar (unchanged) */}
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

      {/* Candidate detail modal (same as before) */}
      {selectedApp && (
        // ... keep the modal implementation you already pasted; no stage / status changes needed there ...
        <div className="fixed inset-0 z-40 flex items-stretch justify-end bg-slate-950/40">
          {/* modal content unchanged from previous version */}
        </div>
      )}
    </>
  );
}
