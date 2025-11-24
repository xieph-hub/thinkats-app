// components/ats/JobsIndexClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Drawer } from "@/components/ui/Drawer";

export type AtsJobSummary = {
  id: string;
  title: string;
  location: string | null;
  employmentType: string | null;
  seniority: string | null;
  status: string | null;
  visibility: string | null;
  createdAt: string;
  department: string | null;
  tags: string[] | null;
  workMode: string | null;
  applicationsTotal: number;
  applicationsByStatus: Record<string, number>;
};

type Props = {
  jobs: AtsJobSummary[];
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "on_hold", label: "On hold" },
  { value: "closed", label: "Closed" },
];

export function JobsIndexClient({ jobs }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();

    return jobs.filter((job) => {
      if (statusFilter !== "all") {
        if (job.status?.toLowerCase() !== statusFilter) return false;
      }

      if (!q) return true;

      const haystack = [
        job.title,
        job.location,
        job.department,
        job.workMode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [jobs, statusFilter, query]);

  const selectedJob = filteredJobs.find((j) => j.id === selectedJobId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((opt) => {
            const active = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                  active
                    ? "border-[#172965] bg-[#172965]/5 text-[#172965]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="w-full max-w-xs">
          <input
            type="search"
            placeholder="Search by title, location, department..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-[#172965] focus:ring-1 focus:ring-[#172965]/60"
          />
        </div>
      </div>

      {/* Jobs list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-xs">
          <thead className="bg-slate-50/80">
            <tr className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left hidden sm:table-cell">
                Location
              </th>
              <th className="px-4 py-2 text-left hidden sm:table-cell">
                Work mode
              </th>
              <th className="px-4 py-2 text-left hidden md:table-cell">
                Department
              </th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right hidden sm:table-cell">
                Applicants
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredJobs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-4 text-[11px] text-slate-500"
                >
                  No jobs found for the current filters.
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = job.id === selectedJobId;
                return (
                  <tr
                    key={job.id}
                    className={`cursor-pointer hover:bg-slate-50 ${
                      isSelected ? "bg-[#172965]/5" : ""
                    }`}
                    onClick={() =>
                      setSelectedJobId(
                        isSelected ? null : job.id
                      )
                    }
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-semibold text-slate-900">
                          {job.title}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {job.employmentType || "Employment type not set"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top hidden sm:table-cell text-[11px] text-slate-600">
                      {job.location || "—"}
                    </td>
                    <td className="px-4 py-3 align-top hidden sm:table-cell text-[11px] text-slate-600">
                      {job.workMode || "—"}
                    </td>
                    <td className="px-4 py-3 align-top hidden md:table-cell text-[11px] text-slate-600">
                      {job.department || "—"}
                    </td>
                    <td className="px-4 py-3 align-top text-[11px] text-slate-600">
                      <StatusBadge status={job.status} visibility={job.visibility} />
                    </td>
                    <td className="px-4 py-3 align-top text-right hidden sm:table-cell text-[11px] text-slate-600">
                      {job.applicationsTotal}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer preview */}
      <Drawer
        isOpen={!!selectedJob}
        onClose={() => setSelectedJobId(null)}
        title={selectedJob?.title ?? ""}
        size="lg"
      >
        {selectedJob && <JobPreview job={selectedJob} />}
      </Drawer>
    </div>
  );
}

function StatusBadge({
  status,
  visibility,
}: {
  status: string | null;
  visibility: string | null;
}) {
  const s = (status || "").toLowerCase();
  const v = (visibility || "").toLowerCase();

  const label = s || "unspecified";
  const visLabel =
    v === "internal"
      ? "Internal"
      : v === "public"
      ? "Public"
      : v || "visibility?";

  let bg = "bg-slate-50 text-slate-700";
  if (s === "open") bg = "bg-emerald-50 text-emerald-800";
  else if (s === "draft") bg = "bg-slate-50 text-slate-700";
  else if (s === "on_hold") bg = "bg-amber-50 text-amber-800";
  else if (s === "closed") bg = "bg-rose-50 text-rose-800";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${bg}`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-60" />
      {label}
      <span className="text-slate-400">·</span>
      <span className="text-slate-500">{visLabel}</span>
    </span>
  );
}

function JobPreview({ job }: { job: AtsJobSummary }) {
  const created = new Date(job.createdAt).toLocaleDateString();
  const byStatus = job.applicationsByStatus || {};
  const applied = byStatus["applied"] ?? 0;
  const screening = byStatus["screening"] ?? 0;
  const interview = byStatus["interview"] ?? 0;
  const offer = byStatus["offer"] ?? 0;

  return (
    <div className="space-y-4 text-sm text-slate-700">
      <section>
        <h3 className="text-xs font-semibold text-slate-900">
          Overview
        </h3>
        <p className="mt-1 text-[11px] text-slate-500">
          Created {created}. {job.location || "Location not set"}.
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
          {job.location && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
              <span aria-hidden="true">📍</span>
              {job.location}
            </span>
          )}
          {job.workMode && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
              <span aria-hidden="true">🧭</span>
              {job.workMode}
            </span>
          )}
          {job.employmentType && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
              <span aria-hidden="true">💼</span>
              {job.employmentType}
            </span>
          )}
          {job.seniority && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
              <span aria-hidden="true">⭐</span>
              {job.seniority}
            </span>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-slate-900">
          Applicants
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
          <Metric label="Total" value={job.applicationsTotal} />
          <Metric label="Applied" value={applied} />
          <Metric label="Screening" value={screening} />
          <Metric label="Interview" value={interview} />
          <Metric label="Offer" value={offer} />
        </div>
      </section>

      {job.tags && job.tags.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-slate-900">Tags</h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="pt-2">
        <div className="flex flex-wrap gap-2 text-[11px]">
          <Link
            href={`/ats/jobs/${job.id}`}
            className="inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#111c4c]"
          >
            Open pipeline
          </Link>
          <Link
            href={`/ats/jobs/${job.id}/edit`}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-[#172965] hover:text-[#172965]"
          >
            Edit job
          </Link>
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-slate-300"
          >
            View on careers site
          </Link>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
