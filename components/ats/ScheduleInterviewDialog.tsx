"use client";

import { useState } from "react";

type Attendee = {
  name: string;
  email: string;
  role: string;
};

type ScheduleInterviewDialogProps = {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
};

export default function ScheduleInterviewDialog({
  applicationId,
  candidateName,
  candidateEmail,
  jobTitle,
}: ScheduleInterviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMins, setDurationMins] = useState("60");
  const [interviewType, setInterviewType] = useState("video");
  const [location, setLocation] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [organiserName, setOrganiserName] = useState("");
  const [organiserEmail, setOrganiserEmail] = useState("");

  const [attendees, setAttendees] = useState<Attendee[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetForm() {
    setDate("");
    setTime("");
    setDurationMins("60");
    setInterviewType("video");
    setLocation("");
    setVideoUrl("");
    setNotes("");
    setOrganiserName("");
    setOrganiserEmail("");
    setAttendees([]);
    setError(null);
    setSuccess(null);
  }

  function closeDialog() {
    setIsOpen(false);
    resetForm();
  }

  function addAttendee() {
    setAttendees((prev) => [
      ...prev,
      { name: "", email: "", role: "Interviewer" },
    ]);
  }

  function updateAttendee(
    index: number,
    field: keyof Attendee,
    value: string,
  ) {
    setAttendees((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!date || !time) {
      setError("Select a date and time for the interview.");
      return;
    }

    const localDate = new Date(`${date}T${time}:00`);
    if (Number.isNaN(localDate.getTime())) {
      setError("The selected date/time is invalid.");
      return;
    }

    const duration = parseInt(durationMins, 10) || 60;

    const payload = {
      applicationId,
      scheduledAt: localDate.toISOString(),
      durationMins: duration,
      type: interviewType || undefined,
      location: location || null,
      videoUrl: videoUrl || null,
      notes: notes || null,
      organiserName: organiserName || null,
      organiserEmail: organiserEmail || null,
      attendees: attendees
        .filter((a) => a.email.trim().length > 0)
        .map((a) => ({
          name: a.name || undefined,
          email: a.email.trim(),
          role: a.role || undefined,
        })),
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ats/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(
          data?.error ||
            "Unable to schedule the interview. Please try again.",
        );
        return;
      }

      setSuccess("Interview scheduled and invite sent.");
      // Simple reload so pipeline & candidate views pick up the new interview
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.reload();
        }, 900);
      }
    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong while scheduling the interview. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-1 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-[#172965] hover:bg-slate-50"
      >
        Schedule interview
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Schedule interview
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  {candidateName} ({candidateEmail || "no email on file"}) ·{" "}
                  <span className="font-medium">{jobTitle}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="text-sm text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-3 space-y-3 text-xs text-slate-800"
            >
              {/* Date / time / duration */}
              <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_1fr]">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Duration (mins)
                  </label>
                  <select
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                  >
                    <option value="30">30</option>
                    <option value="45">45</option>
                    <option value="60">60</option>
                    <option value="90">90</option>
                  </select>
                </div>
              </div>

              {/* Type / location / video */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Type
                  </label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                  >
                    <option value="video">Video</option>
                    <option value="in_person">In-person</option>
                    <option value="phone">Phone</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Location (if in-person / hybrid)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Office address, meeting room, etc."
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600">
                  Video link
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Teams / Zoom / Google Meet link"
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                />
              </div>

              {/* Organiser */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Organiser name
                  </label>
                  <input
                    type="text"
                    value={organiserName}
                    onChange={(e) => setOrganiserName(e.target.value)}
                    placeholder="e.g. Victor Ephraim"
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Organiser email
                  </label>
                  <input
                    type="email"
                    value={organiserEmail}
                    onChange={(e) => setOrganiserEmail(e.target.value)}
                    placeholder="organiser@example.com"
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                  />
                </div>
              </div>

              {/* Additional attendees */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Additional attendees
                  </label>
                  <button
                    type="button"
                    onClick={addAttendee}
                    className="text-[11px] font-medium text-[#172965] hover:underline"
                  >
                    + Add attendee
                  </button>
                </div>
                {attendees.length === 0 && (
                  <p className="text-[11px] text-slate-400">
                    Optional – add interviewers or observers who should get the
                    calendar invite.
                  </p>
                )}
                <div className="mt-2 space-y-2">
                  {attendees.map((attendee, index) => (
                    <div
                      key={index}
                      className="grid gap-2 rounded-lg bg-slate-50 p-2 sm:grid-cols-[1.2fr_1.4fr_1fr]"
                    >
                      <input
                        type="text"
                        value={attendee.name}
                        onChange={(e) =>
                          updateAttendee(index, "name", e.target.value)
                        }
                        placeholder="Name"
                        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                      />
                      <input
                        type="email"
                        value={attendee.email}
                        onChange={(e) =>
                          updateAttendee(index, "email", e.target.value)
                        }
                        placeholder="email@example.com"
                        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                      />
                      <input
                        type="text"
                        value={attendee.role}
                        onChange={(e) =>
                          updateAttendee(index, "role", e.target.value)
                        }
                        placeholder="Role (Interviewer)"
                        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600">
                  Notes to include in invite
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional context for the candidate and interviewers."
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]"
                />
              </div>

              {/* Status line */}
              {(error || success) && (
                <p
                  className={`text-[11px] ${
                    error ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {error || success}
                </p>
              )}

              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="text-[11px] text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-medium text-white hover:bg-[#12204d] disabled:opacity-60"
                >
                  {isSubmitting ? "Scheduling…" : "Send invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
