// app/ats/jobs/[jobId]/JobPipelineBoard.tsx
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type PipelineApp = {
  id: string;
  fullName: string;
  email: string;
  location: string | null;
  source: string | null;
  stage: string | null;
  status: string | null;
  matchScore: number | null;
  matchReason: string | null;
  tier: string | null;
  appliedAt: string; // ISO
  skillTags: { id: string; label: string; color?: string | null }[];
  experienceLabel: string | null;
};

type JobPipelineBoardProps = {
  jobId: string;
  stageOptions: string[];
  apps: PipelineApp[];
};

type UiStatus = "accepted" | "on_hold" | "rejected";

function uiStatusFromDb(status: string | null | undefined): UiStatus {
  const s = (status || "").toUpperCase();
  if (s === "REJECTED") return "rejected";
  if (s === "ON_HOLD") return "on_hold";
  return "accepted"; // default = active
}

function dbStatusFromUi(ui: UiStatus): string {
  if (ui === "rejected") return "REJECTED";
  if (ui === "on_hold") return "ON_HOLD";
  return "PENDING";
}

function scoreColor(score?: number | null) {
  if (score == null) return "bg-slate-700/40 text-slate-100";
  if (score >= 85) return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40";
  if (score >= 70) return "bg-sky-500/15 text-sky-300 border border-sky-500/40";
  if (score >= 60) return "bg-amber-500/15 text-amber-300 border border-amber-500/40";
  return "bg-rose-500/15 text-rose-300 border border-rose-500/40";
}

function tierColor(tier?: string | null) {
  if (!tier) return "bg-slate-700/40 text-slate-100";
  const upper = tier.toUpperCase();
  if (upper === "A")
    return "bg-emerald-600/20 text-emerald-200 border border-emerald-500/40";
  if (upper === "B")
    return "bg-sky-600/20 text-sky-200 border border-sky-500/40";
  if (upper === "C")
    return "bg-amber-600/20 text-amber-200 border border-amber-500/40";
  return "bg-slate-700/40 text-slate-100";
}

function formatDate(dIso: string) {
  const d = new Date(dIso);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function JobPipelineBoard({
  jobId,
  stageOptions,
  apps,
}: JobPipelineBoardProps) {
  const router = useRouter();

  const [rows, setRows] = useState<PipelineApp[]>(apps);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStage, setBulkStage] = useState<string>("");

  const totalCount = rows.length;
  const selectedCount = selectedIds.length;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  const scoreSummary = useMemo(() => {
    const scores = rows
      .map((r) => r.matchScore)
      .filter((s): s is number => s != null);
    if (!scores.length) return "No scores yet";
    const avg =
      scores.reduce((acc, v) => acc + v, 0) / scores.length;
    return `Avg score ${Math.round(avg)}`;
  }, [rows]);

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((r) => r.id));
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id],
    );
  }

  async function updateSingle(
    applicationId: string,
    updates: { stage?: string; status?: string },
  ) {
    // optimistic update
    setRows((prev) =>
      prev.map((row) =>
        row.id === applicationId ? { ...row, ...updates } : row,
      ),
    );

    try {
      await fetch("/api/ats/applications/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          ...updates,
        }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to update application", error);
    }
  }

  async function handleStatusChange(id: string, uiStatus: UiStatus) {
    const status = dbStatusFromUi(uiStatus);
    await updateSingle(id, { status });
  }

  async function handleStageChange(id: string, stage: string) {
    await updateSingle(id, { stage });
  }

  async function bulkUpdate(payload: { status?: string; stage?: string }) {
    if (!selectedIds.length) return;

    setRows((prev) =>
      prev.map((row) =>
        selectedIds.includes(row.id) ? { ...row, ...payload } : row,
      ),
    );

    try {
      await fetch("/api/ats/applications/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationIds: selectedIds,
          ...payload,
        }),
      });
      setSelectedIds([]);
      router.refresh();
    } catch (error) {
      console.error("Bulk update failed", error);
    }
  }

  async function handleBulkStatus(uiStatus: UiStatus) {
    const status = dbStatusFromUi(uiStatus);
    await bulkUpdate({ status });
  }

  async function handleBulkStageApply() {
    if (!bulkStage) return;
    await bulkUpdate({ stage: bulkStage });
    setBulkStage("");
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-950">
      <section className="m-4 flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 text-slate-50 shadow-xl">
        {/* Top strip: metrics & legend */}
        <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="space-y-0.5 text-[11px]">
            <div className="text-[12px] font-semibold tracking-wide text-slate-100">
              Pipeline · Candidates
            </div>
            <div className="flex flex-wrap items-center gap-3 text-slate-400">
              <span>
                {totalCount} candidate{totalCount === 1 ? "" : "s"} in
                current view
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                {scoreSummary}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-sky-400" />
                <span>ThinkATS · list view</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-[10px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="ml-1">85+ strong match</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-sky-500/15 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span className="ml-1">70–84 good</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="ml-1">60–69 maybe</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-rose-500/15 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                <span className="ml-1">&lt;60 low fit</span>
              </span>
            </div>
            <span>
              Inline changes are saved instantly – no page refresh.
            </span>
          </div>
        </header>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-950/98 backdrop-blur">
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wide text-slate-400">
                <th className="w-10 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-500 bg-slate-900 text-sky-500"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="w-64 px-2 py-2 text-left">Candidate</th>
                <th className="w-40 px-2 py-2 text-left">Match</th>
                <th className="w-44 px-2 py-2 text-left">
                  Location / Source
                </th>
                <th className="px-2 py-2 text-left">
                  Skills / Experience
                </th>
                <th className="w-44 px-2 py-2 text-left">
                  Status (decision)
                </th>
                <th className="w-40 px-2 py-2 text-left">Stage</th>
                <th className="w-32 px-2 py-2 text-left">Applied</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const uiStatus = uiStatusFromDb(row.status);

                return (
                  <tr
                    key={row.id}
                    className="border-b border-slate-900/80 bg-slate-950/60 hover:bg-slate-900/70"
                  >
                    {/* Select */}
                    <td className="px-3 py-3 align-top">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-slate-500 bg-slate-900 text-sky-500"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelectOne(row.id)}
                      />
                    </td>

                    {/* Candidate */}
                    <td className="px-2 py-3 align-top">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-[11px] font-semibold text-slate-950">
                          {row.fullName
                            .split(" ")
                            .slice(0, 2)
                            .map((p) => p[0]?.toUpperCase())
                            .join("")}
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-slate-50">
                            {row.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {row.email}
                          </div>
                          {row.matchReason && (
                            <p className="mt-1 line-clamp-2 text-[10px] text-slate-300">
                              {row.matchReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Match / tier */}
                    <td className="px-2 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-min items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${scoreColor(
                            row.matchScore,
                          )}`}
                        >
                          {row.matchScore != null
                            ? `Score ${row.matchScore}`
                            : "No score"}
                        </span>
                        {row.tier && (
                          <span
                            className={`inline-flex w-min items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tierColor(
                              row.tier,
                            )}`}
                          >
                            Tier {row.tier}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Location / source */}
                    <td className="px-2 py-3 align-top">
                      <div className="flex flex-col gap-1 text-[10px] text-slate-300">
                        {row.location && <span>{row.location}</span>}
                        {row.source && (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                            {row.source}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Skills / experience */}
                    <td className="px-2 py-3 align-top">
                      <div className="flex flex-wrap gap-1">
                        {row.skillTags.slice(0, 4).map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-100"
                          >
                            {tag.label}
                          </span>
                        ))}
                        {row.experienceLabel && (
                          <span className="rounded-full bg-emerald-700/40 px-2 py-0.5 text-[10px] text-emerald-100">
                            {row.experienceLabel}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status control – Accept / On hold / Reject */}
                    <td className="px-2 py-3 align-top">
                      <div className="inline-flex rounded-full bg-slate-900 p-0.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(row.id, "accepted")
                          }
                          className={[
                            "flex-1 rounded-full px-2 py-0.5",
                            uiStatus === "accepted"
                              ? "bg-emerald-500 text-slate-950"
                              : "text-slate-300 hover:bg-emerald-500/20",
                          ].join(" ")}
                        >
                          ✓ Accept
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(row.id, "on_hold")
                          }
                          className={[
                            "flex-1 rounded-full px-2 py-0.5",
                            uiStatus === "on_hold"
                              ? "bg-amber-400 text-slate-950"
                              : "text-slate-300 hover:bg-amber-400/20",
                          ].join(" ")}
                        >
                          ⏸ On hold
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(row.id, "rejected")
                          }
                          className={[
                            "flex-1 rounded-full px-2 py-0.5",
                            uiStatus === "rejected"
                              ? "bg-rose-500 text-slate-50"
                              : "text-slate-300 hover:bg-rose-500/20",
                          ].join(" ")}
                        >
                          ✗ Reject
                        </button>
                      </div>
                      {row.status && (
                        <div className="mt-1 text-[10px] text-slate-500">
                          Stored as: {row.status}
                        </div>
                      )}
                    </td>

                    {/* Stage dropdown */}
                    <td className="px-2 py-3 align-top">
                      <select
                        className="h-8 w-full rounded-full border border-slate-700 bg-slate-900 px-3 text-[11px] text-slate-100 outline-none focus:border-sky-500"
                        value={row.stage || ""}
                        onChange={(e) =>
                          handleStageChange(row.id, e.target.value)
                        }
                      >
                        <option value="">Select stage…</option>
                        {stageOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Applied */}
                    <td className="px-2 py-3 align-top text-[10px] text-slate-300">
                      {formatDate(row.appliedAt)}
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-[11px] text-slate-400"
                  >
                    No candidates match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bulk action bar */}
        {selectedCount > 0 && (
          <footer className="border-t border-slate-800 bg-slate-950/95 px-4 py-3 text-[11px] text-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">
                  {selectedCount} selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full bg-slate-900 p-0.5">
                  <button
                    type="button"
                    onClick={() => handleBulkStatus("accepted")}
                    className="rounded-full px-3 py-1 text-[10px] hover:bg-emerald-500/20"
                  >
                    ✓ Mark as accepted
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatus("on_hold")}
                    className="rounded-full px-3 py-1 text-[10px] hover:bg-amber-400/20"
                  >
                    ⏸ Mark on hold
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatus("rejected")}
                    className="rounded-full px-3 py-1 text-[10px] hover:bg-rose-500/20"
                  >
                    ✗ Reject
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={bulkStage}
                    onChange={(e) => setBulkStage(e.target.value)}
                    className="h-8 rounded-full border border-slate-700 bg-slate-900 px-3 text-[11px] text-slate-100 outline-none focus:border-sky-500"
                  >
                    <option value="">Move to stage…</option>
                    {stageOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleBulkStageApply}
                    className="inline-flex h-8 items-center rounded-full bg-sky-500 px-3 text-[11px] font-semibold text-slate-950 hover:bg-sky-400"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}
