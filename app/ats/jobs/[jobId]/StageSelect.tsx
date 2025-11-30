// app/ats/jobs/[jobId]/StageSelect.tsx
import React from "react";

const STAGES = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
] as const;

type StageSelectProps = {
  jobId: string;
  applicationId: string;
  currentStage?: string | null;
};

export function StageSelect({
  jobId,
  applicationId,
  currentStage,
}: StageSelectProps) {
  const value = (currentStage || "APPLIED").toUpperCase();

  return (
    <form
      method="POST"
      action="/ats/applications/actions"
      className="inline-flex items-center gap-1"
    >
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="applicationId" value={applicationId} />
      <select
        name="newStage"
        defaultValue={value}
        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
      >
        {STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {stage}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="text-[10px] font-medium text-[#172965] hover:underline"
      >
        Move
      </button>
    </form>
  );
}
