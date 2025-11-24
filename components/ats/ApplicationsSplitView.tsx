// components/ats/ApplicationsSplitView.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";

type Application = {
  id: string;
  fullName: string;
  email: string;
  status: "applied" | "screening" | "interview" | "offer" | "rejected";
  appliedAt: string;
  location?: string;
  cvUrl?: string;
  phone?: string;
  timeline?: { label: string; at: string }[];
};

type Props = {
  applications: Application[];
};

export function ApplicationsSplitView({ applications }: Props) {
  const router = useRouter();

  const [selected, setSelected] = useState<Application | null>(
    applications[0] ?? null
  );
  const [drawerCandidate, setDrawerCandidate] = useState<Application | null>(
    null
  );

  // Drawers for status + interview
  const [statusDrawerOpen, setStatusDrawerOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [interviewDrawerOpen, setInterviewDrawerOpen] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);

  const handleSelect = (app: Application) => {
    setSelected(app);
    setDrawerCandidate(app); // used on mobile
  };

  const isEmpty = applications.length === 0;

  const handleStatusSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!selected) return;

    const formData = new FormData(e.currentTarget);
    const newStatus = formData.get("status") as Application["status"] | null;
    const note = (formData.get("note") as string) || "";

    if (!newStatus) {
      setStatusError("Please select a status.");
      return;
    }

    setStatusLoading(true);
    setStatusError(null);

    try {
      const res = await fetch(
        `/api/ats/applications/${encodeURIComponent(selected.id)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, note }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      // Optimistic update for the currently selected candidate
      setSelected((prev) =>
        prev ? { ...prev, status: newStatus } : prev
      );
      setStatusDrawerOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Error updating status", err);
      setStatusError("Could not update status. Please try again.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleInterviewSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!selected) return;

    const formData = new FormData(e.currentTarget);
    const scheduledAtRaw = formData.get("scheduledAt") as string;
    const type = (formData.get("type") as string) || "";
    const location = (formData.get("location") as string) || "";
    const notes = (formData.get("notes") as string) || "";

    if (!scheduledAtRaw) {
      setInterviewError("Please select a date and time.");
      return;
    }

    const iso = new Date(scheduledAtRaw).toISOString();

    setInterviewLoading(true);
    setInterviewError(null);

    try {
      const res = await fetch(
        `/api/ats/applications/${encodeURIComponent(
          selected.id
        )}/interviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledAt: iso,
            type: type || null,
            location: location || null,
            notes: notes || null,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to schedule interview");
      }

      const payload = await res.json();

      const event = {
        label: "Interview scheduled",
        at: payload.scheduled_at ?? iso,
      };

      // Optimistic add to timeline
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              timeline: [...(prev.timeline ?? []), event],
            }
          : prev
      );

      setInterviewDrawerOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Error scheduling interview", err);
      setInterviewError(
        "Could not schedule interview. Please try again."
      );
    } finally {
      setInterviewLoading(false);
    }
  };

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Split view for desktop */}
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
                            {new Date(
                              app.appliedAt
                            ).toLocaleDateString()}
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
                    onClick={() =>
                      selected && setStatusDrawerOpen(true)
                    }
                    disabled={!selected}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Change status
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      selected && setInterviewDrawerOpen(true)
                    }
                    disabled={!selected}
                    className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-60"
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
                        {new Date(
                          app.appliedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Mobile candidate details drawer */}
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

      {/* Drawer: Change status */}
      <Drawer
        isOpen={statusDrawerOpen}
        onClose={() => !statusLoading && setStatusDrawerOpen(false)}
        title="Change status"
        size="sm"
      >
        {selected ? (
          <form
            onSubmit={handleStatusSubmit}
            className="space-y-3 text-xs text-slate-800"
          >
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                New status
              </label>
              <select
                name="status"
                defaultValue={selected.status}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
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
                Notes (optional)
              </label>
              <textarea
                name="note"
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
                placeholder="Why are you moving this candidate to this stage?"
              />
            </div>

            {statusError && (
              <p className="text-[11px] text-red-600">{statusError}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={statusLoading}
                onClick={() => setStatusDrawerOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={statusLoading}
                className="rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {statusLoading ? "Saving..." : "Save status"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-slate-500">
            Select a candidate to change their status.
          </p>
        )}
      </Drawer>

      {/* Drawer: Schedule interview */}
      <Drawer
        isOpen={interviewDrawerOpen}
        onClose={() =>
          !interviewLoading && setInterviewDrawerOpen(false)
        }
        title="Schedule interview"
        size="sm"
      >
        {selected ? (
          <form
            onSubmit={handleInterviewSubmit}
            className="space-y-3 text-xs text-slate-800"
          >
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Interview date &amp; time
              </label>
              <input
                type="datetime-local"
                name="scheduledAt"
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Format
              </label>
              <select
                name="type"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              >
                <option value="">Select...</option>
                <option value="virtual">Virtual</option>
                <option value="onsite">On-site</option>
                <option value="phone">Phone</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Location / link
              </label>
              <input
                name="location"
                placeholder="Office address or video link"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-800">
                Notes (optional)
              </label>
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/80"
                placeholder="Context for the interviewer or candidate."
              />
            </div>

            {interviewError && (
              <p className="text-[11px] text-red-600">
                {interviewError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={interviewLoading}
                onClick={() => setInterviewDrawerOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={interviewLoading}
                className="rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#111c4c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {interviewLoading ? "Scheduling..." : "Schedule"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-slate-500">
            Select a candidate to schedule an interview.
          </p>
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
              <dt className="font-medium text-slate-700">
                Location
              </dt>
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
          <h3 className="text-xs font-semibold text-slate-900">
            Résumé
          </h3>
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

function StatusDot({ status }: { status: Application["status"] }) {
  const map: Record<
    Application["status"],
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
