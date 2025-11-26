// app/ats/jobs/[jobId]/StageSelect.tsx
"use client";

import { useState, useTransition } from "react";

type Props = {
  applicationId: string;
  currentStage?: string | null;
};

const STAGE_OPTIONS = [
  { value: "APPLIED", label: "Applied" },
  { value: "SCREENING", label: "Screening" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "OFFER", label: "Offer" },
  { value: "HIRED", label: "Hired" },
  { value: "REJECTED", label: "Rejected" },
];

export default function StageSelect({ applicationId, currentStage }: Props) {
  const initialStage =
    currentStage && STAGE_OPTIONS.some((s) => s.value === currentStage)
      ? currentStage
      : "APPLIED";

  const [selectedStage, setSelectedStage] = useState(initialStage);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value;
    setSelectedStage(newStage);
    setError(null);
    setJustSaved(false);

    startTransition(async () => {
      try {
        const res = await fetch("/api/ats/candidates/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // reuse the bulk endpoint with a single application
            applicationIds: [applicationId],
            action: "updateStageStatus",
            stage: newStage,
            // status: you can choose to also send a status here if you like
          }),
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      } catch (err) {
        console.error("Failed to update stage", err);
        setError("Could not update stage");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedStage}
        onChange={handleChange}
        disabled={isPending}
        className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-700 outline-none ring-0 hover:border-[#172965] focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
      >
        {STAGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {isPending && (
        <span className="text-[9px] text-slate-400">Saving…</span>
      )}

      {!isPending && justSaved && !error && (
        <span className="text-[9px] text-[#306B34]">Saved</span>
      )}

      {error && (
        <span className="text-[9px] text-red-600">{error}</span>
      )}
    </div>
  );
}
