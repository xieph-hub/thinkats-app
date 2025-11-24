"use client";

import React, { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";

export type ApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected";

type Application = {
  id: string;
  fullName: string;
  email: string;
  status: ApplicationStatus;
  appliedAt: string;
  location?: string;
  cvUrl?: string;
  phone?: string;
  timeline?: { label: string; at: string }[];
};

type Props = {
  applications: Application[];
  // Optional hooks you can implement later
  onStatusChange?: (
    appId: string,
    newStatus: ApplicationStatus,
    note?: string
  ) => Promise<void> | void;
  onScheduleInterview?: (
    appId: string,
    payload: {
      date: string;
      time: string;
      type: "onsite" | "remote" | "phone";
      location?: string;
      notes?: string;
    }
  ) => Promise<void> | void;
};

export function ApplicationsSplitView({
  applications,
  onStatusChange,
  onScheduleInterview,
}: Props) {
  const [selected, setSelected] = useState<Application | null>(
    applications[0] ?? null
  );

  // Mobile candidate drawer
  const [drawerCandidate, setDrawerCandidate] = useState<Application | null>(
    null
  );

  // Quick-action drawers
  const [statusDrawerCandidate, setStatusDrawerCandidate] =
    useState<Application | null>(null);
  const [interviewDrawerCandidate, setInterviewDrawerCandidate] =
    useState<Application | null>(null);

  const isEmpty = applications.length === 0;

  const handleSelectDesktop = (app: Application) => {
    setSelected(app);
  };

  const effectiveOnStatusChange =
    onStatusChange ??
    (async () => {
      // no-op default
    });

  const effectiveOnScheduleInterview =
    onScheduleInterview ??
    (async () => {
      // no-op default
    });

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Desktop: split view */}
      <div className="hidden h-full md:grid md:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
        {/* List */}
        <div className="border-r border-slate-100">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Applications ({applications.length})
            </h2>
          </header>
          <div className="h-full overflow-y-auto">
            {isEmpty ? (
              <p className="px-4 py-6 text-xs text-slate-500">
                No applications yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {applications.map((app) => {
                  const active = selected?.id === app.id;
                  return (
                    <li
                      key={app.id}
                      onClick={() => handleSelectDesktop(app)}
                      className={`cursor-pointer px-4 py-3 text-xs transition ${
                        active
                          ? "bg-[#172965]/5"
                          : "hover:bg-slate-50 active:bg-slate-100/80"
                      }`}
                    >
                      <div className="flex justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {app.fullName}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {app.location || "Location not specified"}
                          </p>
                        </div>
                        <div className="text-right">
                          <StatusDot status={app.status} />
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            Applied{" "}
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            {selected ? (
              <>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {selected.fullName}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {selected.email}
                    {selected.location && ` • ${selected.location}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => setStatusDrawerCandidate(selected)}
                  >
                    Change status
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#111c4c]"
                    onClick={() => setInterviewDrawerCandidate(selected)}
                  >
                    Schedule interview
                  </button>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-slate-500">
                Select a candidate to view their details.
              </p>
            )}
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 text-sm text-slate-700">
            {selected ? (
              <CandidateDetails candidate={selected} />
            ) : (
              <p className="text-xs text-slate-500">
                No candidate selected yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: list only + drawer for details */}
      <div className="flex h-full flex-col md:hidden">
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Applications ({applications.length})
          </h2>
        </header>
        <div className="h-full overflow-y-auto">
          {isEmpty ? (
            <p className="px-4 py-6 text-xs text-slate-500">
              No applications yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {applications.map((app) => (
                <li
                  key={app.id}
                  className="cursor-pointer px-4 py-3 text-xs hover:bg-slate-50"
                  onClick={() => setDrawerCandidate(app)}
                >
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {app.fullName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {app.location || "Location not specified"}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusDot status={app.status} />
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Drawer
          isOpen={!!drawerCandidate}
          onClose={() => setDrawerCandidate(null)}
          title={drawerCandidate?.fullName}
          size="md"
        >
          {drawerCandidate && (
            <CandidateDetails candidate={drawerCandidate} compact />
          )}
        </Drawer>
      </div>

      {/* Change status drawer */}
      <Drawer
        isOpen={!!statusDrawerCandidate}
        onClose={() => setStatusDrawerCandidate(null)}
        title={
          statusDrawerCandidate
            ? `Change status – ${statusDrawerCandidate.fullName}`
            : "Change status"
        }
        size="sm"
      >
        {statusDrawerCandidate && (
          <ChangeStatusForm
            candidate={statusDrawerCandidate}
            onCancel={() => setStatusDrawerCandidate(null)}
            onSave={async (newStatus, note) => {
              await effectiveOnStatusChange(
                statusDrawerCandidate.id,
                newStatus,
                note
              );
              setStatusDrawerCandidate(null);
            }}
          />
        )}
      </Drawer>

      {/* Schedule interview drawer */}
      <Drawer
        isOpen={!!interviewDrawerCandidate}
        onClose={() => setInterviewDrawerCandidate(null)}
        title={
          interviewDrawerCandidate
            ? `Schedule interview – ${interviewDrawerCandidate.fullName}`
            : "Schedule interview"
        }
        size="sm"
      >
        {interviewDrawerCandidate && (
          <ScheduleInterviewForm
            candidate={interviewDrawerCandidate}
            onCancel={() => setInterviewDrawerCandidate(null)}
            onSchedule={async (payload) => {
              await effectiveOnScheduleInterview(
                interviewDrawerCandidate.id,
                payload
              );
              setInterviewDrawerCandidate(null);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Candidate details                                                   */
/* ------------------------------------------------------------------ */

function CandidateDetails({
  candidate,
  compact,
}: {
  candidate: Application;
  compact?: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Contact */}
      <section>
        <h3 className="text-xs font-semibold text-slate-900">
          Contact details
        </h3>
        <dl className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
          <div>
            <dt className="font-medium text-slate-700">Email</dt>
            <dd className="mt-0.5 break-all">{candidate.email}</dd>
          </div>
          {candidate.phone && (
            <div>
              <dt className="font-medium text-slate-700">Phone</dt>
              <dd className="mt-0.5">{candidate.phone}</dd>
            </div>
          )}
          {candidate.location && (
            <div>
              <dt className="font-medium text-slate-700">Location</dt>
              <dd className="mt-0.5">{candidate.location}</dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-slate-700">Applied</dt>
            <dd className="mt-0.5">
              {new Date(candidate.appliedAt).toLocaleString()}
            </dd>
          </div>
        </dl>
      </section>

      {/* CV preview / link */}
      {candidate.cvUrl && (
        <section>
          <h3 className="text-xs font-semibold text-slate-900">Résumé</h3>
          <p className="mt-1 text-[11px] text-slate-600">
            Open the candidate&apos;s CV in a new tab.
          </p>
          <a
            href={candidate.cvUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#111c4c]"
          >
            View CV
          </a>
        </section>
      )}

      {/* Timeline */}
      {!compact && candidate.timeline && candidate.timeline.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-slate-900">
            Application timeline
          </h3>
          <ol className="mt-2 space-y-2 border-l border-slate-200 pl-3 text-[11px] text-slate-600">
            {candidate.timeline.map((t) => (
              <li key={`${t.label}-${t.at}`} className="relative">
                <span className="absolute -left-[7px] mt-0.5 h-3 w-3 rounded-full border border-white bg-[#64C247] shadow-sm" />
                <p className="font-medium">{t.label}</p>
                <p className="text-[10px] text-slate-500">
                  {new Date(t.at).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quick action forms                                                 */
/* ------------------------------------------------------------------ */

function ChangeStatusForm({
  candidate,
  onCancel,
  onSave,
}: {
  candidate: Application;
  onCancel: () => void;
  onSave: (status: ApplicationStatus, note?: string) => Promise<void> | void;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(candidate.status);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(status, note.trim() || undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-[11px]">
      <p className="text-slate-600">
        Update the pipeline status for{" "}
        <span className="font-semibold text-slate-900">
          {candidate.fullName}
        </span>
        .
      </p>

      <div className="space-y-1">
        <label className="font-medium text-slate-800">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
        >
          <option value="applied">Applied</option>
          <option value="screening">Screening</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="font-medium text-slate-800">
          Internal note (optional)
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Context for this status change (visible to your team only)."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#111c4c] disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save status"}
        </button>
      </div>
    </form>
  );
}

function ScheduleInterviewForm({
  candidate,
  onCancel,
  onSchedule,
}: {
  candidate: Application;
  onCancel: () => void;
  onSchedule: (payload: {
    date: string;
    time: string;
    type: "onsite" | "remote" | "phone";
    location?: string;
    notes?: string;
  }) => Promise<void> | void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<"onsite" | "remote" | "phone">("remote");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    setSubmitting(true);
    try {
      await onSchedule({
        date,
        time,
        type,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-[11px]">
      <p className="text-slate-600">
        Schedule an interview with{" "}
        <span className="font-semibold text-slate-900">
          {candidate.fullName}
        </span>
        .
      </p>

      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <label className="font-medium text-slate-800">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="font-medium text-slate-800">Time</label>
          <input
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="font-medium text-slate-800">Format</label>
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value as "onsite" | "remote" | "phone")
          }
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
        >
          <option value="remote">Remote (video)</option>
          <option value="onsite">On-site</option>
          <option value="phone">Phone</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="font-medium text-slate-800">
          Location / meeting link (optional)
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Office address or video link"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
        />
      </div>

      <div className="space-y-1">
        <label className="font-medium text-slate-800">
          Notes to include in invite (optional)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Interview panel, agenda, preparation notes..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[11px] text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !date || !time}
          className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#111c4c] disabled:opacity-60"
        >
          {submitting ? "Scheduling..." : "Schedule interview"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Status dot                                                          */
/* ------------------------------------------------------------------ */

function StatusDot({ status }: { status: ApplicationStatus }) {
  const map: Record<
    ApplicationStatus,
    { label: string; color: string }
  > = {
    applied: { label: "Applied", color: "#172965" },
    screening: { label: "Screening", color: "#FFC000" },
    interview: { label: "Interview", color: "#306B34" },
    offer: { label: "Offer", color: "#64C247" },
    rejected: { label: "Rejected", color: "#EF4444" },
  };

  const cfg = map[status];

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}
