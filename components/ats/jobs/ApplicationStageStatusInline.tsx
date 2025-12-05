// components/ats/jobs/ApplicationStageStatusInline.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  applicationId: string;
  currentStage: string | null;
  currentStatus: string | null;
  stageOptions: string[];
};

const STATUS_OPTIONS = [
  "PENDING",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

export default function ApplicationStageStatusInline({
  applicationId,
  currentStage,
  currentStatus,
  stageOptions,
}: Props) {
  const [stage, setStage] = useState(currentStage || "APPLIED");
  const [status, setStatus] = useState(currentStatus || "PENDING");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function persist(nextStage: string, nextStatus: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ats/applications/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          stage: nextStage,
          status: nextStatus,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to update");
      }

      setStage(data.stage || nextStage);
      setStatus(data.status || nextStatus);
      router.refresh();
    } catch (err: any) {
      console.error("Inline update error:", err);
      setError(err?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleStageChange(value: string) {
    const nextStage = value || stage;
    setStage(nextStage);
    await persist(nextStage, status);
  }

  async function handleStatusChange(value: string) {
    const nextStatus = value || status;
    setStatus(nextStatus);
    await persist(stage, nextStatus);
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[11px] text-slate-500">Stage</label>
        <select
          value={stage}
          disabled={saving}
          onChange={(e) => handleStageChange(e.target.value)}
          className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700"
        >
          {stageOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <label className="ml-2 text-[11px] text-slate-500">Status</label>
        <select
          value={status}
          disabled={saving}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {saving && (
        <p className="text-[10px] text-slate-400">Updating…</p>
      )}
      {error && (
        <p className="text-[10px] text-rose-600">{error}</p>
      )}
    </div>
  );
}
