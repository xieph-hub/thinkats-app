// components/ats/ApplicationStageStatusControls.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  applicationId: string;
  initialStage: string;
  initialStatus: string;
};

const STAGE_OPTIONS = [
  { value: "APPLIED", label: "Applied" },
  { value: "SCREEN", label: "Screen" },
  { value: "SCREENING", label: "Screening" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "OFFER", label: "Offer" },
  { value: "OFFERED", label: "Offered" },
  { value: "HIRED", label: "Hired" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "HIRED", label: "Hired" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function ApplicationStageStatusControls({
  applicationId,
  initialStage,
  initialStatus,
}: Props) {
  const [stage, setStage] = useState(
    (initialStage || "APPLIED").toUpperCase(),
  );
  const [status, setStatus] = useState(
    (initialStatus || "PENDING").toUpperCase(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function update(nextStage: string, nextStatus: string) {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/ats/applications/update-stage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          stage: nextStage,
          status: nextStatus,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update application state");
      }

      setStage(nextStage.toUpperCase());
      setStatus(nextStatus.toUpperCase());
      router.refresh();
    } catch (e) {
      console.error(e);
      setError("Could not update. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStage = e.target.value;
    setStage(nextStage);
    void update(nextStage, status);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value;
    setStatus(nextStatus);
    void update(stage, nextStatus);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1">
        <select
          value={stage}
          onChange={handleStageChange}
          disabled={saving}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-800 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
        >
          <option value="">Stage…</option>
          {STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={handleStatusChange}
          disabled={saving}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-800 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
        >
          <option value="">Status…</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-[10px] text-rose-600">
          {error}
        </p>
      )}

      {saving && (
        <p className="text-[10px] text-slate-400">
          Saving…
        </p>
      )}
    </div>
  );
}
