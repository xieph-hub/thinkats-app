// components/ats/jobs/ApplicationScheduleInterviewButton.tsx
"use client";

import { useState } from "react";

type Props = {
  applicationId: string;
  candidateName?: string | null;
  candidateEmail?: string | null;
};

export default function ApplicationScheduleInterviewButton({
  applicationId,
  candidateName,
  candidateEmail,
}: Props) {
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMins, setDurationMins] = useState<number>(60);
  const [type, setType] = useState("VIRTUAL");
  const [location, setLocation] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!scheduledAt) {
      setError("Please pick a date & time.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/ats/applications/${encodeURIComponent(
          applicationId,
        )}/interviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledAt,
            durationMins,
            type,
            location,
            videoUrl,
            notes,
            participants:
              candidateEmail && candidateEmail.trim()
                ? [
                    {
                      name: candidateName || candidateEmail,
                      email: candidateEmail,
                      role: "Candidate",
                    },
                  ]
                : [],
          }),
        },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(
          (data && data.error) || "Failed to schedule interview",
        );
      }

      setMessage("Interview scheduled");
      setSaving(false);
      // Optional: collapse the form after success
      // setOpen(false);
    } catch (err: any) {
      console.error("Schedule interview UI error:", err);
      setSaving(false);
      setError(err?.message || "Unexpected error");
    }
  }

  return (
    <div className="mt-1 space-y-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-50 hover:bg-slate-800"
      >
        {open ? "Close scheduler" : "Schedule interview"}
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-2 space-y-2 rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-[11px] text-slate-100"
        >
          <div className="grid gap-2 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-300">
                Date &amp; time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="h-8 rounded-md border border-slate-600 bg-slate-950 px-2 text-[11px] text-slate-50"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-300">
                Duration (mins)
              </label>
              <input
                type="number"
                min={15}
                step={15}
                value={durationMins}
                onChange={(e) =>
                  setDurationMins(
                    Number(e.target.value || 0) > 0
                      ? Number(e.target.value)
                      : 60,
                  )
                }
                className="h-8 rounded-md border border-slate-600 bg-slate-950 px-2 text-[11px] text-slate-50"
              />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-300">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-8 rounded-md border border-slate-600 bg-slate-950 px-2 text-[11px] text-slate-50"
              >
                <option value="VIRTUAL">Virtual</option>
                <option value="ONSITE">Onsite</option>
                <option value="PHONE">Phone</option>
                <option value="PANEL">Panel</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-300">
                Location / room
              </label>
              <input
                type="text"
                placeholder="Meeting room or address"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-8 rounded-md border border-slate-600 bg-slate-950 px-2 text-[11px] text-slate-50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-300">
              Video link (optional)
            </label>
            <input
              type="text"
              placeholder="Zoom / Meet URL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="h-8 rounded-md border border-slate-600 bg-slate-950 px-2 text-[11px] text-slate-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-300">
              Internal notes (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-1 text-[11px] text-slate-50"
            />
          </div>

          {error && (
            <div className="rounded-md border border-rose-500/50 bg-rose-900/30 px-2 py-1 text-[10px] text-rose-100">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-md border border-emerald-500/50 bg-emerald-900/30 px-2 py-1 text-[10px] text-emerald-100">
              {message}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center rounded-full border border-slate-600 px-3 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1 text-[11px] font-semibold text-white hover:bg-[#111c4a] disabled:opacity-60"
            >
              {saving ? "Scheduling…" : "Schedule"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
