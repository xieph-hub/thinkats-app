// app/ats/jobs/[jobId]/StageSelect.tsx
"use client";

import { useTransition } from "react";
import { moveApplicationStage } from "./actions";

// Local type that matches JobApplication.stage values
type ApplicationStageType =
  | "APPLIED"
  | "SCREENING"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

const STAGES: ApplicationStageType[] = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

export function StageSelect({
  applicationId,
  currentStage,
}: {
  applicationId: string;
  currentStage: ApplicationStageType;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onChange={(e) => {
        const form = e.currentTarget as HTMLFormElement;
        const fd = new FormData(form);
        startTransition(async () => {
          await moveApplicationStage(fd);
        });
      }}
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      <select
        name="stage"
        defaultValue={currentStage}
        disabled={isPending}
        className="rounded border bg-transparent px-1 py-0.5 text-[11px]"
      >
        {STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {stage}
          </option>
        ))}
      </select>
    </form>
  );
}
