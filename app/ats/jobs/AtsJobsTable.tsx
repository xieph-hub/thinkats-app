// app/ats/jobs/AtsJobsTable.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import type { AtsJobRow } from "./page";

type Props = {
  initialJobs: AtsJobRow[];
};

type BulkAction = "publish" | "unpublish" | "close" | "delete";

function titleCaseFromEnum(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEmploymentType(value: string) {
  if (!value) return "";
  const map: Record<string, string> = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract",
    temporary: "Temporary",
    internship: "Internship",
    consulting: "Consulting / Advisory",
  };
  const key = value.toLowerCase();
  return map[key] || titleCaseFromEnum(value);
}

function formatExperienceLevel(value: string) {
  if (!value) return "";
  const map: Record<string, string> = {
    entry: "Entry level / Graduate",
    junior: "Junior (1–3 years)",
    mid: "Mid-level (3–7 years)",
    senior: "Senior (7–12 years)",
    lead_principal: "Lead / Principal",
    manager_head: "Manager / Head of",
    director_vp: "Director / VP",
    c_level_partner: "C-level / Partner",
  };
  const key = value.toLowerCase();
  return map[key] || titleCaseFromEnum(value);
}

function formatWorkMode(value: string) {
  if (!value) return "";
  const map: Record<string, string> = {
    onsite: "Onsite",
    hybrid: "Hybrid",
    remote: "Remote",
    field_based: "Field-based",
  };
  const key = value.toLowerCase();
  return map[key] || titleCaseFromEnum(value);
}

function formatStatus(value: string) {
  const key = value.toLowerCase();
  if (key === "open") return "Open";
  if (key === "draft") return "Draft";
  if (key === "closed") return "Closed";
  return titleCaseFromEnum(value);
}

function formatVisibility(value: string) {
  const key = value.toLowerCase();
  if (key === "public") return "Public";
  if (key === "internal") return "Internal";
  return titleCaseFromEnum(value);
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function AtsJobsTable({ initialJobs }: Props) {
  const [jobs, setJobs] = React.useState<AtsJobRow[]>(initialJobs);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const allSelected = jobs.length > 0 && selectedIds.length === jobs.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(jobs.map((j) => j.id));
    }
  };

  async function runBulkAction(action: BulkAction, ids?: string[]) {
    const jobIds = (ids && ids.length > 0) ? ids : selectedIds;
    if (jobIds.length === 0) return;

    if (action === "delete") {
      const ok = window.confirm(
        jobIds.length === 1
          ? "Delete this role and its associated applications? This cannot easily be undone."
          : `Delete ${jobIds.length} roles and their associated applications?`
      );
      if (!ok) return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ats/jobs/bulk-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobIds, action }),
      });

      if (!res.ok) {
        console.error(await res.text());
        alert("Something went wrong applying the action to selected roles.");
        return;
      }

      const data: {
        ok: boolean;
        updatedJobs?: { id: string; status: string; visibility: string }[];
        deletedIds?: string[];
      } = await res.json();

      if (action === "delete") {
        setJobs((prev) => prev.filter((job) => !jobIds.includes(job.id)));
        setSelectedIds((prev) => prev.filter((id) => !jobIds.includes(id)));
      } else if (data.updatedJobs && data.updatedJobs.length > 0) {
        setJobs((prev) =>
          prev.map((job) => {
            const updated = data.updatedJobs!.find((u) => u.id === job.id);
            if (!updated) return job;
            return {
              ...job,
              status: updated.status,
              visibility: updated.visibility,
            };
          })
        );
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error running bulk action.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
        <p>No roles yet for this tenant.</p>
        <p className="mt-1 text-xs text-slate-500">
          Use{" "}
          <Link
            href="/ats/jobs/new"
            className="font-semibold text-[#172965] hover:underline"
          >
            “New role”
          </Link>{" "}
          to create your first mandate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Bulk action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-slate-600">
          {selectedIds.length > 0 ? (
            <span className="font-medium text-slate-900">
              {selectedIds.length} selected
            </span>
          ) : (
            <span>{jobs.length} role{jobs.length === 1 ? "" : "s"}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {selectedIds.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => runBulkAction("publish")}
                disabled={isSubmitting}
                className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100"
              >
                Publish
              </button>
              <button
                type="button"
                onClick={() => runBulkAction("unpublish")}
                disabled={isSubmitting}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-100"
              >
                Unpublish
              </button>
              <button
                type="button"
                onClick={() => runBulkAction("close")}
                disabled={isSubmitting}
                className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-800 hover:border-amber-300 hover:bg-amber-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => runBulkAction("delete")}
                disabled={isSubmitting}
                className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-medium text-rose-800 hover:border-rose-300 hover:bg-rose-100"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-[11px] text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Work mode</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Level</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Visibility</th>
              <th className="px-3 py-2">Apps</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const selected = selectedIds.includes(job.id);

              const typeLabel = job.employmentType
                ? formatEmploymentType(job.employmentType)
                : "";
              const levelLabel = job.experienceLevel
                ? formatExperienceLevel(job.experienceLevel)
                : "";
              const workModeLabel = job.workMode
                ? formatWorkMode(job.workMode)
                : "";
              const statusLabel = formatStatus(job.status);
              const visibilityLabel = formatVisibility(job.visibility);

              return (
                <tr
                  key={job.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    selected ? "bg-slate-50/80" : "bg-white"
                  }`}
                >
                  <td className="px-3 py-2 align-top">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-[#172965] focus:ring-[#172965]"
                      checked={selected}
                      onChange={() => toggleSelection(job.id)}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-col">
                      <Link
                        href={`/ats/jobs/${job.id}`}
                        className="text-xs font-semibold text-slate-900 hover:text-[#172965] hover:underline"
                      >
                        {job.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="text-[11px] text-slate-700">
                      {job.clientName}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="text-[11px] text-slate-700">
                      {job.location || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="text-[11px] text-slate-700">
                      {workModeLabel || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="text-[11px] text-slate-700">
                      {typeLabel || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="text-[11px] text-slate-700">
                      {levelLabel || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        job.status === "open"
                          ? "bg-emerald-50 text-emerald-800"
                          : job.status === "draft"
                          ? "bg-slate-50 text-slate-700"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        job.visibility === "public"
                          ? "bg-sky-50 text-sky-800"
                          : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {visibilityLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="text-[11px] text-slate-700">
                      {job.applicationsCount}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="text-[11px] text-slate-700">
                      {formatDate(job.createdAt)}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <Link
                        href={`/ats/jobs/${job.id}`}
                        className="font-semibold text-[#172965] hover:underline"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => runBulkAction("unpublish", [job.id])}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      >
                        Unpublish
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => runBulkAction("close", [job.id])}
                        className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800 hover:border-amber-300 hover:bg-amber-100"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => runBulkAction("delete", [job.id])}
                        className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] text-rose-800 hover:border-rose-300 hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
