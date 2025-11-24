// components/ats/ApplicationsSplitView.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";

type ApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected";

type TimelineItem = {
  label: string;
  at: string;
};

type Application = {
  id: string;
  fullName: string;
  email: string;
  status: ApplicationStatus;
  appliedAt: string;
  location?: string;
  cvUrl?: string;
  phone?: string;
  timeline?: TimelineItem[];
};

type Props = {
  applications: Application[];

  // These are provided by JobDetailShell and actually hit Supabase
  onStatusChange?: (
    applicationId: string,
    newStatus: string,
    note?: string
  ) => void | Promise<void>;

  onScheduleInterview?: (
    applicationId: string,
    payload: any // keep this loose to match your existing handler type
  ) => void | Promise<void>;
};

type FilterKey = "all" | ApplicationStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "applied", label: "Applied" },
  { key: "screening", label: "Screening" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "rejected", label: "Rejected" },
];

export function ApplicationsSplitView({
  applications,
  onStatusChange,
  onScheduleInterview,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<FilterKey>("all");

  const filteredApplications = useMemo(() => {
    if (statusFilter === "all") return applications;
    return applications.filter((a) => a.status === statusFilter);
  }, [applications, statusFilter]);

  const [selected, setSelected] = useState<Application | null>(
    filteredApplications[0] ?? null
  );

  const [drawerCandidate, setDrawerCandidate] = useState<Application | null>(
    null
  );

  // Drawers for actions
  const [statusDrawerFor, setStatusDrawerFor] = useState<Application | null>(
    null
  );
  const [statusDraft, setStatusDraft] = useState<ApplicationStatus>("applied");
  const [statusNote, setStatusNote] = useState("");
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const [interviewDrawerFor, setInterviewDrawerFor] =
    useState<Application | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewType, setInterviewType] = useState<
    "phone" | "video" | "onsite"
  >("video");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [submittingInterview, setSubmittingInterview] = useState(false);

  const isEmpty = filteredApplications.length === 0;

  // Keep a sensible selected candidate when filters change
  useEffect(() => {
    if (!selected || !filteredApplications.some((a) => a.id === selected.id)) {
      setSelected(filteredApplications[0] ?? null);
    }
  }, [filteredApplications, selected]);

  const handleSelect = (app: Application) => {
    setSelected(app);
    setDrawerCandidate(app); // used on mobile
  };

  const openStatusDrawer = () => {
    if (!selected) return;
    setStatusDraft(selected.status);
    setStatusNote("");
    setStatusDrawerFor(selected);
  };

  const openInterviewDrawer = () => {
    if (!selected) return;
    setInterviewDate("");
    setInterviewTime("");
    setInterviewType("video");
    setInterviewLocation("");
    setInterviewNotes("");
    setInterviewDrawerFor(selected);
  };

  const handleSubmitStatus: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();
    if (!statusDrawerFor || !onStatusChange) {
      setStatusDrawerFor(null);
      return;
    }
    try {
      setSubmittingStatus(true);
      await onStatusChange(
        statusDrawerFor.id,
        statusDraft,
        statusNote.trim() || undefined
      );
      setStatusDrawerFor(null);
    } catch (err) {
      console.error("Error changing status", err);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleSubmitInterview: React.FormEventHandler<HTMLFormElement> =
    async (e) => {
      e.preventDefault();
      if (!interviewDrawerFor || !onScheduleInterview) {
        setInterviewDrawerFor(null);
        return;
      }

      try {
        setSubmittingInterview(true);
        await onScheduleInterview(interviewDrawerFor.id, {
          date: interviewDate,
          time: interviewTime,
          type: interviewType,
          location: interviewLocation || undefined,
          notes: interviewNotes || undefined,
        });
        setInterviewDrawerFor(null);
      } catch (err) {
        console.error("Error scheduling interview", err);
      } finally {
        setSubmittingInterview(false);
      }
    };

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Desktop split view */}
      <div className="hidden h-full md:grid md:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
        {/* List */}
        <div className="border-r border-slate-100">
          <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Applications ({applications.length})
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Showing {filteredApplications.length}{" "}
                {statusFilter === "all" ? "total" : statusFilter} candidate
                {filteredApplications.length === 1 ? "" : "s"}.
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
                    statusFilter === f.key
                      ? "border-[#172965] bg-[#172965]/5 text-[#172965]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </header>
          <div className="h-full overflow-y-auto">
            {isEmpty ? (
              <p className="px-4 py-6 text-xs text-slate-500">
                No applications in this view yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredApplications.map((app) => {
                  const active = selected?.id === app.id;
                  return (
                    <li
                      key={app.id}
                      onClick={() => handleSelect(app)}
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
                    onClick={openStatusDrawer}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Change status
                  </button>
                  <button
                    type="button"
                    onClick={openInterviewDrawer}
                    className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#111c4c]"
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

      {/* Mobile: list + drawer */}
      <div className="flex h-full flex-col md:hidden">
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Applications ({applications.length})
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-500">
              {filteredApplications.length} in this view
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
                  statusFilter === f.key
                    ? "border-[#172965] bg-[#172965]/5 text-[#172965]"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>
        <div className="h-full overflow-y-auto">
          {isEmpty ? (
            <p className="px-4 py-6 text-xs text-slate-500">
              No applications in this view yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredApplications.map((app) => (
                <li
                  key={app.id}
                  className="cursor-pointer px-4 py-3 text-xs hover:bg-slate-50"
                  onClick={() => {
                    setSelected(app);
                    setDrawerCandidate(app);
                  }}
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
        isOpen={!!statusDrawerFor}
        onClose={() => setStatusDrawerFor(null)}
        title="Change status"
        size="sm"
      >
        {statusDrawerFor && (
          <form onSubmit={handleSubmitStatus} className="space-y-4 text-[13px]">
            <p className="text-xs text-slate-600">
              Update status for{" "}
              <span className="font-semibold">
                {statusDrawerFor.fullName}
              </span>
              .
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                New status
              </label>
              <select
                value={statusDraft}
                onChange={(e) =>
                  setStatusDraft(e.target.value as ApplicationStatus)
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              >
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Internal note (optional)
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusDrawerFor(null)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingStatus}
                className="rounded-full bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingStatus ? "Updating…" : "Update status"}
              </button>
            </div>
          </form>
        )}
      </Drawer>

      {/* Schedule interview drawer */}
      <Drawer
        isOpen={!!interviewDrawerFor}
        onClose={() => setInterviewDrawerFor(null)}
        title="Schedule interview"
        size="sm"
      >
        {interviewDrawerFor && (
          <form
            onSubmit={handleSubmitInterview}
            className="space-y-4 text-[13px]"
          >
            <p className="text-xs text-slate-600">
              Schedule an interview with{" "}
              <span className="font-semibold">
                {interviewDrawerFor.fullName}
              </span>
              .
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-800">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-800">
                  Time
                </label>
                <input
                  type="time"
                  required
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Interview type
              </label>
              <select
                value={interviewType}
                onChange={(e) =>
                  setInterviewType(e.target.value as "phone" | "video" | "onsite")
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              >
                <option value="phone">Phone</option>
                <option value="video">Video</option>
                <option value="onsite">On-site</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Location / Link (optional)
              </label>
              <input
                type="text"
                value={interviewLocation}
                onChange={(e) => setInterviewLocation(e.target.value)}
                placeholder="Office address or meeting link"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Notes (optional)
              </label>
              <textarea
                rows={3}
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInterviewDrawerFor(null)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingInterview}
                className="rounded-full bg-[#172965] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingInterview ? "Scheduling…" : "Schedule"}
              </button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}

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

function StatusDot({ status }: { status: ApplicationStatus }) {
  const map: Record<ApplicationStatus, { label: string; color: string }> = {
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
