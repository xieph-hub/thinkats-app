"use client";

import { useMemo, useState, useTransition } from "react";
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

  // Extra fields for preview
  shortDescription?: string | null;
  overview?: string | null;
  department?: string | null; // “Function” in UI
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
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

function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string | null | undefined,
): string | null {
  if (!min && !max) return null;
  const cur = currency || "NGN";

  const format = (n: number) =>
    n.toLocaleString("en-NG", {
      maximumFractionDigits: 0,
    });

  if (min && max) {
    return `${cur} ${format(min)} – ${format(max)}`;
  }
  if (min) return `${cur} ${format(min)}+`;
  if (max) return `Up to ${cur} ${format(max)}`;
  return null;
}

export default function AtsJobsTable({ initialJobs }: Props) {
  const router = useRouter();
  const [jobs, setJobs] = useState<AtsJobRow[]>(initialJobs);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeJobId, setActiveJobId] = useState<string | null>(
    initialJobs[0]?.id ?? null,
  );
  const [isPending, startTransition] = useTransition();
  const [submittingAction, setSubmittingAction] = useState<BulkAction | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const activeJob = useMemo(
    () => jobs.find((j) => j.id === activeJobId) ?? null,
    [jobs, activeJobId],
  );

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

  function handleRowClick(id: string) {
    setActiveJobId(id);
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
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)]">
      {/* Left side: bulk actions + table */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Bulk actions bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 text-[11px] text-slate-600">
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                checked={allSelected}
                onChange={toggleSelectAll}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="font-medium">
                {selectedCount ? `${selectedCount} selected` : "Select jobs"}
              </span>
            </label>
            <span className="hidden text-[10px] text-slate-400 sm:inline">
              Use the controls on the right to publish, unpublish, close or
              delete selected roles.
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
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-left">
                  Role
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-left">
                  Location &amp; type
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-left">
                  Function / experience
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
                const isActive = job.id === activeJobId;
                const borderClass =
                  idx === jobs.length - 1 ? "" : "border-b border-slate-100";

                return (
                  <tr
                    key={job.id}
                    className={`group cursor-pointer bg-white hover:bg-slate-50/80 ${borderClass} ${
                      isActive ? "bg-slate-50/80 ring-1 ring-slate-200" : ""
                    }`}
                    onClick={() => handleRowClick(job.id)}
                  >
                    <td className="sticky left-0 z-10 bg-white px-3 py-2 align-top group-hover:bg-slate-50/80">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        checked={selected}
                        onChange={() => toggleRow(job.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/ats/jobs/${job.id}`}
                            className="truncate text-[12px] font-semibold text-slate-900 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {job.title || "Untitled role"}
                          </Link>
                          {job.clientName && (
                            <span className="truncate text-[10px] text-slate-500">
                              · {job.clientName}
                            </span>
                          )}
                        </div>
                        {job.shortDescription && (
                          <p className="line-clamp-1 text-[10px] text-slate-500">
                            {job.shortDescription}
                          </p>
                        )}
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
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] text-slate-800">
                          {job.department || "—"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {job.experienceLevel || "Experience not set"}
                        </span>
                      </div>
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
            Need a richer view? Open any role to manage its stages, candidates
            and client-facing pipeline.
          </span>
        </div>
      </div>

      {/* Right side: active job preview (desktop only) */}
      <aside className="hidden min-h-[260px] border-l border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-700 lg:block">
        {activeJob ? (
          <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Preview
                </div>
                <h2 className="truncate text-sm font-semibold text-slate-900">
                  {activeJob.title}
                </h2>
                {activeJob.clientName && (
                  <p className="truncate text-[11px] text-slate-500">
                    {activeJob.clientName}
                  </p>
                )}
              </div>
              <Link
                href={`/ats/jobs/${activeJob.id}`}
                className="inline-flex h-7 items-center rounded-full bg-slate-900 px-3 text-[10px] font-semibold text-white hover:bg-slate-800"
              >
                Open role
              </Link>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5 text-[10px]">
              {activeJob.location && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-slate-700">
                  {activeJob.location}
                </span>
              )}
              {activeJob.workMode && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-slate-700">
                  {activeJob.workMode}
                </span>
              )}
              {activeJob.employmentType && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-slate-700">
                  {activeJob.employmentType}
                </span>
              )}
              {activeJob.department && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-slate-700">
                  Function: {activeJob.department}
                </span>
              )}
              {activeJob.experienceLevel && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-slate-700">
                  {activeJob.experienceLevel}
                </span>
              )}
            </div>

            {activeJob.shortDescription && (
              <p className="mb-2 text-[11px] text-slate-700">
                {activeJob.shortDescription}
              </p>
            )}

            {activeJob.overview && (
              <p className="mb-3 line-clamp-4 text-[11px] text-slate-600">
                {activeJob.overview}
              </p>
            )}

            <div className="mt-auto border-t border-slate-100 pt-3 text-[10px] text-slate-500">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold ${statusChipColor(
                      activeJob.status,
                      activeJob.visibility,
                    )}`}
                  >
                    {activeJob.status
                      ? activeJob.status.charAt(0).toUpperCase() +
                        activeJob.status.slice(1)
                      : "—"}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold ${visibilityChipColor(
                      activeJob.visibility,
                    )}`}
                  >
                    {(activeJob.visibility || "—")
                      .charAt(0)
                      .toUpperCase() +
                      (activeJob.visibility || "—").slice(1)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {activeJob.applicationsCount}{" "}
                  {activeJob.applicationsCount === 1
                    ? "candidate"
                    : "candidates"}
                </span>
              </div>

              {formatSalaryRange(
                activeJob.salaryMin ?? null,
                activeJob.salaryMax ?? null,
                activeJob.salaryCurrency ?? null,
              ) && (
                <p className="text-[10px] text-slate-500">
                  Compensation:{" "}
                  <span className="font-medium text-slate-700">
                    {formatSalaryRange(
                      activeJob.salaryMin ?? null,
                      activeJob.salaryMax ?? null,
                      activeJob.salaryCurrency ?? null,
                    )}
                  </span>
                </p>
              )}

              <p className="mt-1 text-[10px] text-slate-400">
                Click into this role to edit the JD, configure stages or manage
                candidates.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center text-[11px] text-slate-500">
            Select a role on the left to see a quick preview.
          </div>
        )}
      </aside>
    </section>
  );
}
