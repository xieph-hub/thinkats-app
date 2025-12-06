// components/ats/candidates/ApplicationInterviewDrawer.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ApplicationContext = {
  id: string;
  jobId: string;
  jobTitle: string;
  clientName: string | null;
  candidateName: string;
  candidateEmail: string | null;
};

type Props = {
  candidateId: string;
  application: ApplicationContext;
};

export default function ApplicationInterviewDrawer({
  candidateId, // kept for future use if needed
  application,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setOpen(true);
  }

  function handleClose() {
    if (isSubmitting) return;
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const scheduledAt = String(formData.get("scheduledAt") || "");
      const type = String(formData.get("type") || "");
      const durationRaw = String(formData.get("durationMins") || "");
      const location = String(formData.get("location") || "");
      const videoUrl = String(formData.get("videoUrl") || "");
      const notes = String(formData.get("notes") || "");
      const organiserName = String(formData.get("organiserName") || "");
      const organiserEmail = String(formData.get("organiserEmail") || "");

      if (!scheduledAt) {
        throw new Error("Please select a date and time.");
      }

      const durationMins =
        durationRaw.trim() === "" ? undefined : Number(durationRaw);

      const body = {
        applicationId: application.id,
        scheduledAt,
        durationMins,
        type: type || undefined,
        location: location || null,
        videoUrl: videoUrl || null,
        notes: notes || null,
        organiserName: organiserName || null,
        organiserEmail: organiserEmail || null,
        attendees: [] as { name?: string; email: string; role?: string }[],
      };

      const res = await fetch("/api/ats/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore parse error
      }

      if (!res.ok || data?.ok === false) {
        throw new Error(
          data?.error || "Failed to schedule interview. Please try again.",
        );
      }

      // Success: reset form, close drawer, refresh page so the interview list updates
      form.reset();
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Something went wrong scheduling interview.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex h-7 items-center rounded-full border border-slate-300 bg-white px-2.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
      >
        Schedule interview
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/40"
            onClick={handleClose}
          />

          {/* Drawer panel */}
          <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Schedule interview
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {application.candidateName} · {application.jobTitle}
                  {application.clientName
                    ? ` · ${application.clientName}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {/* Body + form */}
            <div className="flex-1 overflow-y-auto px-4 py-3 text-xs text-slate-700">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* When */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    When
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    required
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400">
                    Uses your local time. We’ll store the exact timestamp on
                    the interview.
                  </p>
                </div>

                {/* Type + duration */}
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500">
                      Type
                    </label>
                    <select
                      name="type"
                      defaultValue="VIRTUAL"
                      className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                    >
                      <option value="PHONE">Phone</option>
                      <option value="VIRTUAL">Virtual</option>
                      <option value="ONSITE">Onsite</option>
                      <option value="PANEL">Panel</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500">
                      Duration (mins)
                    </label>
                    <input
                      type="number"
                      name="durationMins"
                      min={5}
                      step={5}
                      defaultValue={60}
                      className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    Location (if in-person)
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="Office address or meeting room…"
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                  />
                </div>

                {/* Video link */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    Video link (if virtual)
                  </label>
                  <input
                    type="text"
                    name="videoUrl"
                    placeholder="Google Meet / Zoom / Teams link…"
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                  />
                </div>

                {/* Organiser details (optional) */}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500">
                      Organiser name (optional)
                    </label>
                    <input
                      type="text"
                      name="organiserName"
                      placeholder="Your name"
                      className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500">
                      Organiser email (optional)
                    </label>
                    <input
                      type="email"
                      name="organiserEmail"
                      placeholder="you@company.com"
                      className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    Internal notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-800"
                    placeholder="What you want to cover, panel composition, focus areas…"
                  />
                  <p className="text-[10px] text-slate-400">
                    Notes are internal only and won’t be sent to the candidate.
                  </p>
                </div>

                {error && (
                  <p className="text-[11px] text-rose-600">
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="inline-flex h-8 items-center rounded-full border border-slate-200 px-3 text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {isSubmitting ? "Saving…" : "Save interview"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
