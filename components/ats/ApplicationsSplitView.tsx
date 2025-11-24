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
  note?: string;
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
  latestNote?: string;
};

type Props = {
  applications: Application[];
};

type FilterKey = "all" | "applied" | "interview" | "offer" | "rejected";

export function ApplicationsSplitView({ applications }: Props) {
  const [selected, setSelected] = useState<Application | null>(
    applications[0] ?? null
  );
  const [drawerCandidate, setDrawerCandidate] = useState<Application | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<FilterKey>("all");

  // Precompute counts per filter
  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = {
      all: applications.length,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    for (const app of applications) {
      if (app.status === "applied") base.applied += 1;
      if (app.status === "interview") base.interview += 1;
      if (app.status === "offer") base.offer += 1;
      if (app.status === "rejected") base.rejected += 1;
    }

    return base;
  }, [applications]);

  // Filtered list based on statusFilter
  const visibleApplications = useMemo(() => {
    if (statusFilter === "all") return applications;
    return applications.filter((a) => a.status === statusFilter);
  }, [applications, statusFilter]);

  const isEmpty = visibleApplications.length === 0;

  // Ensure selected candidate always belongs to the current filtered set
  useEffect(() => {
    if (!visibleApplications.length) {
      setSelected(null);
      return;
    }

    if (!selected || !visibleApplications.some((a) => a.id === selected.id)) {
      setSelected(visibleApplications[0]);
    }
  }, [visibleApplications, selected]);

  const handleSelect = (app: Application) => {
    setSelected(app);
    setDrawerCandidate(app); // used on mobile
  };

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Desktop split view */}
      <div className="hidden h-full md:grid md:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
        {/* List */}
        <div className="border-r border-slate-100">
          <header className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Applications ({applications.length})
              </h2>
            </div>
            <FilterChips
              statusFilter={statusFilter}
              counts={counts}
              onChange={setStatusFilter}
            />
          </header>

          <div className="h-full overflow-y-auto">
            {isEmpty ? (
              <p className="px-4 py-6 text-xs text-slate-500">
                No applications match this filter.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {visibleApplications.map((app) => {
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
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Change status
                  </button>
                  <button
                    type="button"
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

      {/* Mobile list + drawer */}
      <div className="flex h-full flex-col md:hidden">
        <header className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Applications ({applications.length})
            </h2>
          </div>
          <FilterChips
            statusFilter={statusFilter}
            counts={counts}
            onChange={setStatusFilter}
          />
        </header>

        <div className="h-full overflow-y-auto">
          {isEmpty ? (
            <p className="px-4 py-6 text-xs text-slate-500">
              No applications match this filter.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visibleApplications.map((app) => (
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
    </div>
  );
}

function FilterChips({
  statusFilter,
  counts,
  onChange,
}: {
  statusFilter: FilterKey;
  counts: Record<FilterKey, number>;
  onChange: (value: FilterKey) => void;
}) {
  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "applied", label: "Applied" },
    { key: "interview", label: "Interview" },
    { key: "offer", label: "Offer" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {filters.map((f) => {
        const active = statusFilter === f.key;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onChange(f.key)}
            className={
              active
                ? "inline-flex items-center gap-1 rounded-full bg-[#172965] px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm"
                : "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-700 hover:border-[#172965]/60 hover:bg-white"
            }
          >
            <span>{f.label}</span>
            <span className={active ? "text-slate-100" : "text-slate-500"}>
              {counts[f.key]}
            </span>
          </button>
        );
      })}
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
  const lastEvent =
    candidate.timeline && candidate.timeline.length > 0
      ? candidate.timeline[candidate.timeline.length - 1]
      : undefined;

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

      {/* Latest update block */}
      {candidate.latestNote && (
        <section>
          <h3 className="text-xs font-semibold text-slate-900">
            Latest update
          </h3>
          <p className="mt-1 whitespace-pre-line text-[11px] text-slate-600">
            {candidate.latestNote}
          </p>
          {lastEvent && (
            <p className="mt-1 text-[10px] text-slate-400">
              Last updated {new Date(lastEvent.at).toLocaleString()}
            </p>
          )}
        </section>
      )}

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
                {t.note && (
                  <p className="mt-0.5 whitespace-pre-line text-[10px] text-slate-500">
                    {t.note}
                  </p>
                )}
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
