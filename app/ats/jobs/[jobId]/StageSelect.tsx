// app/ats/jobs/[jobId]/StageSelect.tsx
"use client";

import { useEffect, useState } from "react";

type StageSelectProps = {
  jobId: string;
  applicationId: string;
  currentStage: string | null;
};

// Fallback defaults – your job-specific stages will usually map to these
const DEFAULT_STAGES = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

export function StageSelect({
  jobId,
  applicationId,
  currentStage,
}: StageSelectProps) {
  const [value, setValue] = useState<string>(
    (currentStage || "APPLIED").toUpperCase(),
  );
  const [isSaving, setIsSaving] = useState(false);

  // Keep in sync if server-side stage changes
  useEffect(() => {
    setValue((currentStage || "APPLIED").toUpperCase());
  }, [currentStage]);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextStage = e.target.value;
    setValue(nextStage);
    setIsSaving(true);

    try {
      const res = await fetch(
        `/api/ats/jobs/${jobId}/pipeline/bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "SET_STAGE",
            stage: nextStage,
            nextStage, // <-- this is what the bulk API already expects
            applicationIds: [applicationId],
          }),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to update stage");
      }
      // stays inline – no full page reload
    } catch (err) {
      console.error(err);
      // revert if it failed
      setValue((currentStage || "APPLIED").toUpperCase());
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-1">
      <select
        value={value}
        onChange={handleChange}
        className="h-7 rounded-full border border-slate-200 bg-slate-50 px-2 text-[10px] font-medium text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
      >
        {DEFAULT_STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {stage}
          </option>
        ))}
      </select>

      {isSaving && (
        <span className="text-[9px] text-slate-400">Saving…</span>
      )}
    </div>
  );
}
