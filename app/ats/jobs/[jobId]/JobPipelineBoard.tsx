// app/ats/jobs/[jobId]/JobPipelineBoard.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

type UiStatus = "accepted" | "on_hold" | "rejected";

export type JobPipelineBoardProps = {
  jobId: string;
  stageOptions: string[];
  columns: StageColumn[];

  // these may still be passed from the page; we just don’t rely on them
  stageNames?: string[];
  mode?: "kanban" | "list";
  allVisibleApplicationIds?: string[];
};

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

function deriveUiStatus(status: string | null | undefined): UiStatus {
  const s = (status || "").toUpperCase();
  if (s === "REJECTED") return "rejected";
  if (s === "ON_HOLD") return "on_hold";
  return "accepted"; // everything else (PENDING / SCREENING / etc.) counts as accepted/active
}

export default function JobPipelineBoard({
  jobId,
  stageOptions,
  columns,
}: JobPipelineBoardProps) {
  const router = useRouter();

  const initialRows = useMemo(
    () => columns.flatMap((c) => c.apps),
    [columns],
  );

  const [rows, setRows] = useState<PipelineApp[]>(initialRows);
  const [selectedApp, setSelectedApp] = useState<PipelineApp | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "resume" | "interviews" | "evaluations" | "timeline"
  >("overview");

  const visibleCount = rows.length;

  async function updateApplication(
    appId: string,
    updates: { stage?: string; status?: string },
  ) {
    // optimistic local update
    setRows((prev) =>
      prev.map((row) =>
        row.id === appId ? { ...row, ...updates } : row,
      ),
    );

    try {
      await fetch("/api/ats/applications/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: appId,
          ...updates,
        }),
      });
      // Refresh server data (header stats, etc.) without full navigation
      router.refresh();
    } catch (error) {
      console.error("Failed to update application", error);
    }
  }

  async function handleStageChange(appId: string, stage: string) {
    await updateApplication(appId, { stage });
  }

  async function handleStatusChange(appId: string, uiStatus: UiStatus) {
    const status =
      uiStatus === "rejected"
        ? "REJECTED"
        : uiStatus === "on_hold"
        ? "ON_HOLD"
        : "PENDING"; // treat “accepted” as an active state

    await updateApplication(appId, { status });
  }

  function openModal(app: PipelineApp, tab: typeof activeTab = "overview") {
    setSelectedApp(app);
    setActiveTab(tab);
  }

  function closeModal() {
    setSelectedApp(null);
  }

  return (
    <>
      {/* LIST VIEW ONLY */}
      <div className="flex-1 overflow-auto bg-slate-50 px-4 py-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-[11px] text-slate-500">
            <span>
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {visibleCount}
              </span>{" "}
              candidate{visibleCount === 1 ? "" : "s"}
            </span>
            {/* placeholder for future bulk actions */}
          </div>

          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-500">
                  Candidate
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500">
                  Score / Tier
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500">
                  Location / Source
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500">
                  Skills / Experience
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500">
                  Stage
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500">
                  Applied
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((app) => {
                const uiStatus = deriveUiStatus(app.status);

                return (
                  <tr key={app.id} className="hover:bg-slate-50/80">
                    {/* Candidate */}
                    <td className="px-4 py-2 align-top">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                          {app.fullName
                            .split(" ")
                            .slice(0, 2)
                            .map((p) => p[0]?.toUpperCase())
                            .join("")}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => openModal(app, "overview")}
                            className="text-[12px] font-semibold text-slate-900 hover:underline"
                          >
                            {app.fullName}
                          </button>
                          <div className="text-[10px] text-slate-500">
                            {app.email}
                          </div>
                          {(app.candidateTitle || app.candidateCompany) && (
                            <div className="mt-0.5 text-[10px] text-slate-500">
                              {app.candidateTitle}
                              {app.candidateCompany
                                ? ` · ${app.candidateCompany}`
                                : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Score / Tier */}
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-col gap-1">
                        {app.score != null && (
                          <span
                            className={[
                              "inline-flex w-min items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                              scoreColor(app.score),
                            ].join(" ")}
                          >
                            {app.score}
                          </span>
                        )}
                        {app.tier && (
                          <span
                            className={[
                              "inline-flex w-min items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              getTierColor(app.tier),
                            ].join(" ")}
                          >
                            Tier {app.tier}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Location / Source */}
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-col gap-1 text-[10px] text-slate-500">
                        {app.location && (
                          <span>{app.location}</span>
                        )}
                        {app.source && (
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            {app.source}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Skills / Experience */}
                    <td className="px-3 py-2 align-top">
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
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                            {app.yearsExperienceLabel}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stage dropdown */}
                    <td className="px-3 py-2 align-top">
                      <select
                        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                        value={app.stage || ""}
                        onChange={(e) =>
                          handleStageChange(app.id, e.target.value)
                        }
                      >
                        <option value="">Select…</option>
                        {stageOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Status pills: Accept / On hold / Reject */}
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-col gap-1 text-[10px]">
                        <div className="inline-flex rounded-full bg-slate-50 p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(app.id, "accepted")
                            }
                            className={[
                              "flex-1 rounded-full px-2 py-0.5",
                              uiStatus === "accepted"
                                ? "bg-emerald-600 text-emerald-50"
                                : "text-slate-600 hover:bg-emerald-50",
                            ].join(" ")}
                          >
                            ✓ Accept
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(app.id, "on_hold")
                            }
                            className={[
                              "flex-1 rounded-full px-2 py-0.5",
                              uiStatus === "on_hold"
                                ? "bg-amber-500 text-amber-50"
                                : "text-slate-600 hover:bg-amber-50",
                            ].join(" ")}
                          >
                            ⏸ On hold
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(app.id, "rejected")
                            }
                            className={[
                              "flex-1 rounded-full px-2 py-0.5",
                              uiStatus === "rejected"
                                ? "bg-rose-600 text-rose-50"
                                : "text-slate-600 hover:bg-rose-50",
                            ].join(" ")}
                          >
                            ✗ Reject
                          </button>
                        </div>
                        {app.status && (
                          <span className="text-[10px] text-slate-500">
                            Raw status: {app.status}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Applied */}
                    <td className="px-3 py-2 align-top text-[10px] text-slate-500">
                      {formatShortDate(app.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-col items-end gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => openModal(app, "overview")}
                          className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold text-white hover:bg-slate-800"
                        >
                          View
                        </button>
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openModal(app, "interviews")}
                            className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-100"
                          >
                            Schedule
                          </button>
                          {app.email && (
                            <a
                              href={`mailto:${app.email}`}
                              className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-100"
                            >
                              Email
                            </a>
                          )}
                          {app.cvUrl && (
                            <a
                              href={app.cvUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-700 hover:bg-slate-100"
                            >
                              CV
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-[11px] text-slate-500"
                  >
                    No candidates match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate detail drawer / modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-40 flex items-stretch justify-end bg-slate-950/40">
          <div className="ml-auto flex h-full w-full max-w-3xl flex-col bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div>
                <div className="text-xs text-slate-500">
                  Candidate · Pipeline
                </div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {selectedApp.fullName}
                </h2>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  {selectedApp.email && <span>{selectedApp.email}</span>}
                  {selectedApp.location && (
                    <span>· {selectedApp.location}</span>
                  )}
                  {selectedApp.source && (
                    <span>· Source: {selectedApp.source}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedApp.score != null && (
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                      scoreColor(selectedApp.score),
                    ].join(" ")}
                  >
                    Score {selectedApp.score}
                  </span>
                )}
                {selectedApp.tier && (
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      getTierColor(selectedApp.tier),
                    ].join(" ")}
                  >
                    Tier {selectedApp.tier}
                  </span>
                )}
                <button
                  type="button"
                  onClick={closeModal}
                  className="ml-2 rounded-full border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-5 text-[11px]">
              {[
                ["overview", "Overview"],
                ["resume", "Resume"],
                ["interviews", "Interviews"],
                ["evaluations", "Evaluations"],
                ["timeline", "Timeline"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setActiveTab(key as typeof activeTab)
                  }
                  className={[
                    "mr-3 border-b-2 px-0.5 py-2",
                    activeTab === key
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-800",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 text-xs">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <section>
                    <h3 className="text-[11px] font-semibold text-slate-700">
                      Summary
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Applied {formatTime(selectedApp.createdAt)} ·{" "}
                      {selectedApp.yearsExperienceLabel
                        ? selectedApp.yearsExperienceLabel
                        : "Experience not specified"}
                    </p>
                  </section>
                  <section>
                    <h3 className="text-[11px] font-semibold text-slate-700">
                      Skills
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedApp.skillTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
                        >
                          {tag.label}
                        </span>
                      ))}
                      {selectedApp.skillTags.length === 0 && (
                        <span className="text-[11px] text-slate-500">
                          No skills captured yet.
                        </span>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "resume" && (
                <div className="space-y-3">
                  {selectedApp.cvUrl ? (
                    <>
                      <a
                        href={selectedApp.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
                      >
                        Open resume
                      </a>
                      <p className="text-[11px] text-slate-500">
                        Inline PDF viewer can be wired here later.
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      No resume attached yet.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "interviews" && (
                <div className="space-y-3">
                  {selectedApp.interviews.length === 0 && (
                    <p className="text-[11px] text-slate-500">
                      No interviews scheduled yet.
                    </p>
                  )}
                  {selectedApp.interviews.map((iv) => (
                    <div
                      key={iv.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
                    >
                      <div className="font-semibold text-slate-800">
                        {iv.type || "Interview"}
                      </div>
                      <div className="mt-0.5 text-slate-600">
                        {formatTime(iv.scheduledAt)} · {iv.status}
                      </div>
                      {iv.location && (
                        <div className="mt-0.5 text-slate-500">
                          {iv.location}
                        </div>
                      )}
                      {iv.videoUrl && (
                        <a
                          href={iv.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex text-sky-600 hover:underline"
                        >
                          Join meeting
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "evaluations" && (
                <p className="text-[11px] text-slate-500">
                  Evaluation UI can be wired here (scorecards, comments,
                  etc.).
                </p>
              )}

              {activeTab === "timeline" && (
                <div className="space-y-3">
                  {selectedApp.events.length === 0 && (
                    <p className="text-[11px] text-slate-500">
                      No activity recorded yet.
                    </p>
                  )}
                  {selectedApp.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex gap-2 text-[11px] text-slate-600"
                    >
                      <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                      <div>
                        <div className="font-medium text-slate-800">
                          {ev.type}
                        </div>
                        <div className="text-slate-500">
                          {formatTime(ev.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
