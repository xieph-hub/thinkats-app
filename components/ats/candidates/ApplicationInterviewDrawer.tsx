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
  inviterOrgName: string;
};

type Props = {
  candidateId: string;
  application: ApplicationContext;
};

type Attendee = {
  name: string;
  email: string;
  role: string;
};

export default function ApplicationInterviewDrawer({
  candidateId,
  application,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([
    { name: "", email: "", role: "Interviewer" },
  ]);

  function handleOpen() {
    setError(null);
    setOpen(true);
  }

  function handleClose() {
    if (submitting) return;
    setOpen(false);
  }

  function updateAttendee(
    index: number,
    field: keyof Attendee,
    value: string,
  ) {
    setAttendees((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addAttendeeRow() {
    setAttendees((prev) => [
      ...prev,
      { name: "", email: "", role: "Interviewer" },
    ]);
  }

  function removeAttendeeRow(index: number) {
    setAttendees((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const scheduledAt = (formData.get("scheduledAt") as string) || "";
      const type = (formData.get("type") as string) || "VIRTUAL";
      const durationMinsRaw = formData.get("durationMins") as string;
      const durationMins = durationMinsRaw ? Number(durationMinsRaw) : 60;

      const location =
        ((formData.get("location") as string) || "").trim() || null;
      const videoUrl =
        ((formData.get("videoUrl") as string) || "").trim() || null;
      const notes =
        ((formData.get("notes") as string) || "").trim() || null;
      const organiserName =
        ((formData.get("organiserName") as string) || "").trim() ||
        null;
      const organiserEmail =
        ((formData.get("organiserEmail") as string) || "").trim() ||
        null;

      const cleanAttendees = attendees
        .map((a) => ({
          name: a.name.trim(),
          email: a.email.trim(),
          role: a.role.trim(),
        }))
        .filter((a) => a.email);

      const payload = {
        applicationId: application.id,
        scheduledAt,
        durationMins,
        type,
        location,
        videoUrl,
        notes,
        organiserName,
        organiserEmail,
        inviterOrgName: application.inviterOrgName,
        attendees: cleanAttendees,
      };

      const res = await fetch("/api/ats/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(
          data?.error ||
            "Unable to schedule interview. Please try again.",
        );
      }

      setOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error("Error scheduling interview", err);
      setError(
        err?.message ||
          "Something went wrong while scheduling the interview.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const orgLabel = application.inviterOrgName;

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
                <p className="mt-0.5 text-[10px] text-slate-500">
                  From:{" "}
                  <span className="font-medium text-slate-800">
                    {orgLabel}
                  </span>
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

            <div className="flex-1 overflow-y-auto px-4 py-3 text-xs text-slate-700">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Hidden: candidate just for context if you ever need */}
                <input
                  type="hidden"
                  name="candidateId"
                  value={candidateId}
                />

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

                {/* Attendees */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-slate-500">
                      Interviewers &amp; attendees (CC)
                    </label>
                    <button
                      type="button"
                      onClick={addAttendeeRow}
                      className="text-[10px] font-medium text-sky-700 hover:underline"
                    >
                      + Add attendee
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {attendees.map((att, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2"
                      >
                        <input
                          type="text"
                          placeholder="Name"
                          value={att.name}
                          onChange={(e) =>
                            updateAttendee(index, "name", e.target.value)
                          }
                          className="h-7 flex-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                        />
                        <input
                          type="email"
                          placeholder="email@company.com"
                          value={att.email}
                          onChange={(e) =>
                            updateAttendee(index, "email", e.target.value)
                          }
                          className="h-7 flex-[1.4] rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                        />
                        <input
                          type="text"
                          placeholder="Role"
                          value={att.role}
                          onChange={(e) =>
                            updateAttendee(index, "role", e.target.value)
                          }
                          className="h-7 w-24 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttendeeRow(index)}
                          className="text-[10px] text-slate-400 hover:text-rose-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    All attendees with an email will be CC’d on the invite and
                    appear as participants in the candidate’s timeline.
                  </p>
                </div>

                {error && (
                  <p className="text-[11px] text-rose-600">{error}</p>
                )}

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="inline-flex h-8 items-center rounded-full border border-slate-200 px-3 text-[11px] text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
                  >
                    {submitting ? "Scheduling…" : "Confirm & send invite"}
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
