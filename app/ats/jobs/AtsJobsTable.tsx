"use client";

import { useState } from "react";
import Link from "next/link";

export type AtsJobRow = {
  id: string;
  title: string;
  clientName: string;
  location: string | null;
  workMode: string | null;
  employmentType: string | null;
  experienceLevel: string | null;
  status: string;
  visibility: string;
  applicationsCount: number;
  createdAt: string; // ISO string from server
};

type Props = {
  initialJobs: AtsJobRow[];
};

function formatDate(dateIso: string) {
  if (!dateIso) return "";
  return dateIso.slice(0, 10);
}

function statusChipColor(status: string, visibility: string) {
  const s = status.toLowerCase();
  const v = visibility.toLowerCase();

  const isPublished = s === "open" && v === "public";

  if (isPublished) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "open") return "bg-sky-100 text-sky-700 border-sky-200";
  if (s === "closed") return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function workModeLabel(job: AtsJobRow) {
  if (!job.workMode) return "—";
  const wm = job.workMode.toLowerCase();
  if (wm === "remote") return "Remote";
  if (wm === "hybrid") return "Hybrid";
  if (wm === "onsite" || wm === "on-site") return "On-site";
  return job.workMode;
}

export default function AtsJobsTable({ initialJobs }: Props) {
  const [jobs, setJobs] = useState<AtsJobRow[]>(initialJobs);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const anySelected = selectedIds.size > 0;

  function toggleAll() {
    if (selectedIds.size === jobs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(jobs.map((j) => j.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleApplyBulk() {
    setError(null);
    setSuccess(null);

    if (!bulkAction) {
      setError("Select a bulk action first.");
      return;
    }

    if (!anySelected) {
      setError("Select at least one job.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/ats/jobs/bulk-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobIds: Array.from(selectedIds),
          action: bulkAction,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to run bulk action.");
      }

      const data = await res.json();

      // If action is delete
      if (bulkAction === "delete") {
        const deletedIds = new Set<string>(data.deletedIds || []);
        setJobs((prev) => prev.filter((j) => !deletedIds.has(j.id)));
        setSelectedIds(new Set());
        setSuccess("Selected jobs deleted.");
        return;
      }

      // Otherwise, update status/visibility
      const updatedList: { id: string; status: string; visibility: string }[] =
        data.updatedJobs || [];

      const updates = new Map<string, { status: string; visibility: string }>();
      for (const u of updatedList) {
        updates.set(u.id, { status: u.status, visibility: u.visibility });
      }

      setJobs((prev) =>
        prev.map((j) =>
          updates.has(j.id)
            ? {
                ...j,
                status: updates.get(j.id)!.status,
                visibility: updates.get(j.id)!.visibility,
              }
            : j,
        ),
      );

      setSuccess("Bulk action applied.");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (jobs.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-[11px] text-slate-600">
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/90 text-xs font-semibold text-white shadow-sm">
            ATS
          </div>
          <p className="text-xs font-medium text-slate-900">
            No jobs match your current filters.
          </p>
          <p className="max-w-sm text-[11px] text-slate-500">
            Try clearing filters or create a new role to start building your
            first pipeline in this workspace.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/ats/jobs"
              className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-4 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset filters
            </Link>
            <Link
              href="/ats/jobs/new"
              className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800"
            >
              + Create job
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white">
      {/* Bulk actions toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">
            Bulk actions
          </span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="h-8 w-[160px] rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
          >
            <option value="">Select action…</option>
            <option value="publish">Publish (open + public)</option>
            <option value="unpublish">Unpublish</option>
            <option value="close">Mark as closed</option>
            <option value="delete">Delete</option>
          </select>
          <button
            type="button"
            onClick={handleApplyBulk}
            disabled={!anySelected || !bulkAction || isSubmitting}
            className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Applying…" : "Apply"}
          </button>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span>
            Selected:{" "}
            <span className="font-semibold text-slate-800">
              {selectedIds.size}
            </span>
          </span>
        </div>
      </div>

      {/* Feedback strip */}
      {(error || success) && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px]">
          {error && (
            <p className="text-[11px] text-rose-600">
              {error}
            </p>
          )}
          {success && !error && (
            <p className="text-[11px] text-emerald-600">
              {success}
            </p>
          )}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-[11px] text-slate-700">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={selectedIds.size === jobs.length}
                  onChange={toggleAll}
                  className="h-3 w-3 rounded border-slate-300 text-slate-900"
                />
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Title / client
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Function / experience
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Location &amp; mode
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Type
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-right">
                Apps
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Status
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-right">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, idx) => {
              const isSelected = selectedIds.has(job.id);
              const isPublished =
                job.status.toLowerCase() === "open" &&
                job.visibility.toLowerCase() === "public";

              return (
                <tr
                  key={job.id}
                  className={`text-[11px] ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                  }`}
                >
                  <td className="sticky left-0 z-10 border-b border-slate-100 bg-inherit px-3 py-2 align-top">
                    <input
                      type="checkbox"
                      aria-label={`Select job ${job.title}`}
                      checked={isSelected}
                      onChange={() => toggleOne(job.id)}
                      className="h-3 w-3 rounded border-slate-300 text-slate-900"
                    />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 align-top">
                    <div className="flex flex-col gap-0.5">
                      <Link
                        href={`/ats/jobs/${job.id}`}
                        className="text-[12px] font-semibold text-slate-900 hover:underline"
                      >
                        {job.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                        {job.clientName && (
                          <span>{job.clientName}</span>
                        )}
                        {isPublished && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-emerald-700">
                              Live on careers site
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 align-top">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-medium text-slate-800">
                        {/* “Function” label, backed by department/experience */}
                        {job.experienceLevel
                          ? job.experienceLevel
                          : "—"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {/* You can swap this out later if you add a separate “function” field */}
                        Function:{" "}
                        {job.experienceLevel
                          ? job.experienceLevel
                          : "Not specified"}
                      </span>
                    </div>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 align-top">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-slate-800">
                        {job.location || "Location not set"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {workModeLabel(job)}
                      </span>
                    </div>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 align-top">
                    <span className="text-[10px] text-slate-700">
                      {job.employmentType || "—"}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right align-top">
                    <span className="text-[11px] font-medium text-slate-800">
                      {job.applicationsCount}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 align-top">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={[
                          "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          statusChipColor(job.status, job.visibility),
                        ].join(" ")}
                      >
                        {job.status.toLowerCase() === "open"
                          ? "Open"
                          : job.status.toLowerCase() === "closed"
                          ? "Closed"
                          : "Draft"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {job.visibility.toLowerCase() === "public"
                          ? "Public"
                          : "Internal only"}
                      </span>
                    </div>
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 text-right align-top">
                    <span className="text-[10px] text-slate-500">
                      {formatDate(job.createdAt)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
