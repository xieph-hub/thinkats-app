// app/ats/jobs/[jobId]/JobPipelineViewShell.tsx
"use client";

import { useState } from "react";
import JobPipelineBoard, {
  PipelineApp,
  StageInfo,
} from "./JobPipelineBoard";
import JobPipelineList from "./JobPipelineList";

type JobPipelineViewShellProps = {
  jobId: string;
  stages: StageInfo[];
  applications: PipelineApp[];
};

type ViewMode = "board" | "list";

export default function JobPipelineViewShell({
  jobId,
  stages,
  applications,
}: JobPipelineViewShellProps) {
  const [view, setView] = useState<ViewMode>("board");

  const totalApplications = applications.length;
  const stageCount =
    stages && stages.length > 0 ? stages.length : 7;

  const exportCsvHref = `/api/ats/jobs/${jobId}/pipeline/export?format=csv`;
  const exportXlsHref = `/api/ats/jobs/${jobId}/pipeline/export?format=xls`;

  return (
    <section className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Pipeline
          </h2>
          <p className="text-xs text-slate-500">
            {totalApplications} application
            {totalApplications === 1 ? "" : "s"} across {stageCount} stage
            {stageCount === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          {/* View toggle */}
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 text-[11px]">
            <button
              type="button"
              onClick={() => setView("list")}
              className={
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] transition " +
                (view === "list"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800")
              }
            >
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setView("board")}
              className={
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] transition " +
                (view === "board"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800")
              }
            >
              <span>Board</span>
            </button>
          </div>

          {/* Legend + export */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Tier A
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                Tier B
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Tier C
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Tier D / unscored
              </span>
            </div>

            <div className="flex items-center gap-1">
              <a
                href={exportCsvHref}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <span>⬇</span>
                <span>Export CSV</span>
              </a>
              <a
                href={exportXlsHref}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <span>⬇</span>
                <span>Export XLS</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {view === "board" ? (
        <JobPipelineBoard
          jobId={jobId}
          stages={stages}
          applications={applications}
        />
      ) : (
        <JobPipelineList
          jobId={jobId}
          stages={stages}
          applications={applications}
        />
      )}
    </section>
  );
}
