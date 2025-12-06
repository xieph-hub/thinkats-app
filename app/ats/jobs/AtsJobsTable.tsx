"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  createdAt: string; // ISO string
};

type Props = {
  initialJobs: AtsJobRow[];
};

type BulkAction = "publish" | "unpublish" | "close" | "delete";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function statusChipColor(status: string, visibility: string) {
  const s = (status || "").toLowerCase();
  const v = (visibility || "").toLowerCase();

  // Canonical: open + public = "live" role
  if (s === "open" && v === "public") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  // Open but not fully public (internal / private search)
  if (s === "open" && v !== "public") {
    return "bg-sky-50 text-sky-700 border-sky-100";
  }
  // Closed roles
  if (s === "closed") {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }
  // Draft / anything else
  return "bg-amber-50 text-amber-700 border-amber-100";
}

function visibilityChipColor(visibility: string) {
  const v = (visibility || "").toLowerCase();
  if (v === "public") {
    return "bg-indigo-50 text-indigo-700 border-indigo-100";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function AtsJobsTable({ initialJobs }: Props) {
  const router = useRouter();
  const [jobs, setJobs] = useState<AtsJobRow[]>(initialJobs);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [submittingAction, setSubmittingAction] = useState<BulkAction | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const allSelected = useMemo(() => {
    if (!jobs.length) return false;
    return jobs.every((j) => selectedIds.has(j.id));
  }, [jobs, selectedIds]);

  const selectedCount = selectedIds.size;

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      if (prev.size === jobs.length) {
        return new Set();
      }
      return new Set(jobs.map((j) => j.id));
    });
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function runBulkAction(action: BulkAction) {
    if (!selectedIds.size) return;

    setError(null);
    setSubmittingAction(action);

    try {
      const res = await fetch("/api/ats/jobs/bulk-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobIds: Array.from(selectedIds),
          action,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        const message =
          data?.error ||
          "Something went wrong while running the bulk action.";
        setError(message);
        return;
      }

      setJobs((prev) => {
        if (action === "delete") {
          const deletedIds: string[] = data.deletedIds || [];
          const deletedSet = new Set(deletedIds);
          return prev.filter((job) => !deletedSet.has(job.id));
        }

        const updatedJobs: { id: string; status: string; visibility: string }[] =
          data.updatedJobs || [];

        const updatesById = new Map(
          updatedJobs.map((j) => [
            j.id,
            { status: j.status, visibility: j.visibility },
          ]),
        );

        return prev.map((job) => {
          const update = updatesById.get(job.id);
          if (!update) return job;
          return {
            ...job,
            status: update.status ?? job.status,
            visibility: update.visibility ?? job.visibility,
          };
        });
      });

      setSelectedIds(new Set());

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error("Bulk action failed", err);
      setError("Something went wrong while running the bulk action.");
    } finally {
      setSubmittingAction(null);
    }
  }

  if (!jobs.length) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
        <h2 className="text-sm font-semibold text-slate-900">
          No jobs found in this view
        </h2>
        <p className="mt-1 max-w-md text-[11px] text-slate-500">
          Adjust your filters or create a new role to start building your ATS
          pipeline. Published roles will automatically appear on your career
          site where enabled.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
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
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white">
      {/* Bulk actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 text-[11px] text-slate-600">
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              checked={allSelected}
              onChange={toggleSelectAll}
            />
            <span className="font-medium">
              {selectedCount ? `${selectedCount} selected` : "Select jobs"}
            </span>
          </label>
          <span className="hidden text-[10px] text-slate-400 sm:inline">
            Use the controls on the right to publish, unpublish, close or delete
            selected roles.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {error && (
            <span className="mr-2 text-[10px] text-rose-600">
              {error}
            </span>
          )}
          <button
            type="button"
            disabled={
              !selectedCount ||
              isPending ||
              submittingAction === "publish"
            }
            onClick={() => runBulkAction("publish")}
            className="inline-flex h-7 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
          >
            Publish
          </button>
          <button
            type="button"
            disabled={
              !selectedCount ||
              isPending ||
              submittingAction === "unpublish"
            }
            onClick={() => runBulkAction("unpublish")}
            className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
          >
            Unpublish
          </button>
          <button
            type="button"
            disabled={!selectedCount || isPending || submittingAction === "close"}
            onClick={() => runBulkAction("close")}
            className="inline-flex h-7 items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-[10px] font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
          >
            Close
          </button>
          <button
            type="button"
            disabled={
              !selectedCount ||
              isPending ||
              submittingAction === "delete"
            }
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                !window.confirm(
                  "Delete selected jobs and their applications? This cannot be undone.",
                )
              ) {
                return;
              }
              runBulkAction("delete");
            }}
            className="inline-flex h-7 items-center rounded-full border border-rose-200 bg-rose-50 px-3 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-[11px] text-slate-700">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="sticky left-0 z-10 w-8 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Role
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Location &amp; type
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Experience
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Applications
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Status
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">
                Visibility
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-right">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, idx) => {
              const selected = selectedIds.has(job.id);
              const borderClass =
                idx === jobs.length - 1 ? "" : "border-b border-slate-100";

              return (
                <tr
                  key={job.id}
                  className={`group bg-white hover:bg-slate-50/80 ${borderClass}`}
                >
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 align-top group-hover:bg-slate-50/80">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      checked={selected}
                      onChange={() => toggleRow(job.id)}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/ats/jobs/${job.id}`}
                          className="truncate text-[12px] font-semibold text-slate-900 hover:underline"
                        >
                          {job.title || "Untitled role"}
                        </Link>
                        {job.clientName && (
                          <span className="truncate text-[10px] text-slate-500">
                            · {job.clientName}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                        {job.workMode && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5">
                            {job.workMode}
                          </span>
                        )}
                        {job.employmentType && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5">
                            {job.employmentType}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-slate-800">
                        {job.location || "—"}
                      </span>
                      {job.workMode && (
                        <span className="text-[10px] text-slate-500">
                          {job.workMode}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="text-[11px] text-slate-800">
                      {job.experienceLevel || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700">
                      {job.applicationsCount}{" "}
                      {job.applicationsCount === 1
                        ? "candidate"
                        : "candidates"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusChipColor(
                        job.status,
                        job.visibility,
                      )}`}
                    >
                      {job.status
                        ? job.status.charAt(0).toUpperCase() +
                          job.status.slice(1)
                        : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${visibilityChipColor(
                        job.visibility,
                      )}`}
                    >
                      {(job.visibility || "—")
                        .charAt(0)
                        .toUpperCase() +
                        (job.visibility || "—").slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top text-right">
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

      {/* Footer hint */}
      <div className="border-t border-slate-200 px-4 py-2.5 text-[10px] text-slate-400">
        <span>
          Need a richer view? Open any role to manage its stages, candidates and
          client-facing pipeline.
        </span>
      </div>
    </section>
  );
}
