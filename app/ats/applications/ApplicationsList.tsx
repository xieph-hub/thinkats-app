"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ApplicationsRow = {
  id: string;
  candidateId: string | null;
  jobId: string | null;
  jobTitle: string;
  clientName: string | null;

  fullName: string;
  email: string;
  location: string | null;
  currentTitle: string | null;
  currentCompany: string | null;

  source: string | null;
  stage: string | null;
  status: string | null;

  matchScore: number | null;
  matchReason: string | null;
  tier: string | null;
  scoreReason: string | null;

  appliedAt: string; // ISO
  skillTags: { id: string; label: string; color?: string | null }[];
};

export default function ApplicationsList({
  applications,
}: {
  applications: ApplicationsRow[];
}) {
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const total = applications.length;
  const hasRows = total > 0;

  const pageCount = total === 0 ? 1 : Math.ceil(total / pageSize);
  const currentPage = Math.min(page, pageCount);

  const visibleApplications = useMemo(() => {
    if (total === 0) return [];
    const start = (currentPage - 1) * pageSize;
    return applications.slice(start, start + pageSize);
  }, [applications, currentPage, pageSize, total]);

  const startIndex = (currentPage - 1) * pageSize;
  const from = total === 0 ? 0 : startIndex + 1;
  const to = total === 0 ? 0 : Math.min(startIndex + visibleApplications.length, total);

  const statusTotals = applications.reduce(
    (acc, app) => {
      const normalized = (app.status || "PENDING").toUpperCase();
      if (normalized === "ON_HOLD") acc.onHold += 1;
      else if (normalized === "REJECTED") acc.rejected += 1;
      else acc.active += 1; // PENDING / ACTIVE / empty → active bucket
      return acc;
    },
    { active: 0, onHold: 0, rejected: 0 },
  );

  const summaryText = hasRows
    ? `${total} application${total === 1 ? "" : "s"} · ${
        statusTotals.active
      } active · ${statusTotals.onHold} on hold · ${
        statusTotals.rejected
      } rejected`
    : "No applications yet.";

  function goToPrevPage() {
    setPage((p) => Math.max(1, p - 1));
  }

  function goToNextPage() {
    setPage((p) => Math.min(pageCount, p + 1));
  }

  return (
    <div className="flex h-full flex-1 flex-col rounded-2xl border border-slate-200 bg-white">
      {/* Bulk bar – UI only, no backend actions wired yet */}
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/60"
              disabled
            />
            <span className="font-medium text-slate-700">Select all</span>
          </label>

          <select
            disabled
            className="h-8 rounded-full border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-500"
          >
            <option>Keep stage</option>
          </select>

          <select
            disabled
            className="h-8 rounded-full border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-500"
          >
            <option>Keep status</option>
          </select>

          <button
            type="button"
            disabled
            className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white opacity-60 shadow-sm"
          >
            Apply to selected
          </button>

          <div className="ml-auto text-[10px] text-slate-500">
            {summaryText}
          </div>
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          Hover over scores and tiers to see why a candidate was ranked where
          they are. Inline edits and bulk actions live on the per-job pipeline
          view.
        </p>
      </div>

      {/* Rows */}
      {hasRows ? (
        <>
          <ul className="divide-y divide-slate-100">
            {visibleApplications.map((app, idx) => {
              const score =
                typeof app.matchScore === "number" && !isNaN(app.matchScore)
                  ? Math.max(0, Math.min(100, Math.round(app.matchScore)))
                  : null;

              const scoreReason =
                app.scoreReason ||
                app.matchReason ||
                "Scored by semantic CV/JD engine.";

              const appliedDate = formatAppliedDate(app.appliedAt);

              const normalizedStatus = (app.status || "PENDING").toUpperCase();
              const isActive =
                normalizedStatus === "PENDING" ||
                normalizedStatus === "ACTIVE" ||
                normalizedStatus === "";
              const isOnHold = normalizedStatus === "ON_HOLD";
              const isRejected = normalizedStatus === "REJECTED";

              const maxSkillsToShow = 4;
              const visibleSkills = app.skillTags.slice(0, maxSkillsToShow);
              const extraSkills = app.skillTags.length - visibleSkills.length;

              const rowNumber = startIndex + idx + 1;

              return (
                <li
                  key={app.id}
                  className={`flex items-start gap-4 px-4 py-3 md:items-center ${
                    rowNumber % 2 === 0 ? "bg-slate-50/60" : "bg-white"
                  }`}
                >
                  {/* Number + checkbox (read-only for now) */}
                  <div className="flex w-10 flex-col items-center gap-1 pt-1 md:pt-0">
                    <span className="text-[10px] font-medium text-slate-400">
                      {rowNumber}
                    </span>
                    <input
                      type="checkbox"
                      disabled
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/60"
                    />
                  </div>

                  {/* Main content */}
                  <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-4">
                    {/* Candidate + job context */}
                    <div className="min-w-[220px] flex-1">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={
                            app.candidateId
                              ? `/ats/candidates/${app.candidateId}`
                              : "#"
                          }
                          className="inline-flex max-w-xs items-center gap-1 text-[12px] font-semibold text-slate-900 hover:text-indigo-700 hover:underline"
                        >
                          {app.fullName || "Unnamed candidate"}
                        </Link>

                        <p className="max-w-xs truncate text-[10px] text-slate-500">
                          {app.email || "No email on record"}
                        </p>

                        <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                          {app.currentTitle && (
                            <span className="truncate">{app.currentTitle}</span>
                          )}
                          {app.currentCompany && (
                            <span className="truncate">
                              {" · "}
                              {app.currentCompany}
                            </span>
                          )}
                          {app.location && (
                            <span className="truncate">
                              {" · "}
                              {app.location}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                          {app.jobId ? (
                            <Link
                              href={`/ats/jobs/${app.jobId}`}
                              className="inline-flex items-center gap-1 text-[10px] text-indigo-700 hover:underline"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                              <span className="truncate">{app.jobTitle}</span>
                              {app.clientName && (
                                <span className="truncate text-slate-400">
                                  {" · "}
                                  {app.clientName}
                                </span>
                              )}
                            </Link>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                              <span className="truncate">
                                {app.jobTitle || "Unmapped role"}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Match score + tier */}
                    <div className="flex w-[150px] flex-col items-center justify-center gap-1">
                      <MatchScoreDonut score={score} reason={scoreReason} />
                      <span className="text-[10px] text-slate-500">
                        Match score
                      </span>
                      {app.tier && (
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                            tierColour(app.tier),
                          ].join(" ")}
                          title={`Tier ${app.tier.toUpperCase()} · ${scoreReason}`}
                        >
                          {app.tier.toUpperCase() === "A" && <span>★</span>}
                          <span>Tier {app.tier.toUpperCase()}</span>
                        </span>
                      )}
                    </div>

                    {/* Stage (read-only pill) + status chips */}
                    <div className="flex w-[200px] flex-col gap-1">
                      <div className="w-full">
                        <div className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700">
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            {(app.stage || "APPLIED").toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Stage
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <StatusChip
                          label="Active"
                          dotClass="bg-emerald-500"
                          active={isActive && !isOnHold && !isRejected}
                          activeClass="bg-emerald-50 text-emerald-700 border-emerald-100"
                        />
                        <StatusChip
                          label="On hold"
                          dotClass="bg-amber-500"
                          active={isOnHold}
                          activeClass="bg-amber-50 text-amber-700 border-amber-100"
                        />
                        <StatusChip
                          label="Rejected"
                          dotClass="bg-rose-500"
                          active={isRejected}
                          activeClass="bg-rose-50 text-rose-700 border-rose-100"
                        />
                      </div>
                    </div>

                    {/* Applied date */}
                    <div className="w-[110px] text-right text-[11px] text-slate-600">
                      <div>{appliedDate}</div>
                      <div className="text-[10px] text-slate-400">Applied</div>
                    </div>

                    {/* Source / skills */}
                    <div className="min-w-[180px] flex-1">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-semibold text-slate-700">
                          {(app.source || "Unknown source").toUpperCase()}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {visibleSkills.length === 0 ? (
                            <span className="text-[10px] text-slate-400">
                              No skills tagged
                            </span>
                          ) : (
                            <>
                              {visibleSkills.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                                >
                                  {tag.label}
                                </span>
                              ))}
                              {extraSkills > 0 && (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                  +{extraSkills} more
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Pagination bar */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-600">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {from || 0}
              </span>{" "}
              –{" "}
              <span className="font-semibold text-slate-800">
                {to || 0}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {total}
              </span>{" "}
              applications
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPrevPage}
                disabled={currentPage <= 1 || total === 0}
                className="inline-flex h-7 items-center rounded-full border border-slate-300 bg-white px-3 text-[11px] font-medium text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                ‹ Prev
              </button>
              <span className="text-[11px] text-slate-500">
                Page{" "}
                <span className="font-semibold text-slate-800">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800">
                  {pageCount}
                </span>
              </span>
              <button
                type="button"
                onClick={goToNextPage}
                disabled={currentPage >= pageCount || total === 0}
                className="inline-flex h-7 items-center rounded-full border border-slate-300 bg-white px-3 text-[11px] font-medium text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Next ›
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-[11px] text-slate-500">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/90 text-xs font-semibold text-white shadow-sm">
            ATS
          </div>
          <p className="text-xs font-medium text-slate-900">
            No applications match your current filters.
          </p>
          <p className="max-w-sm text-[11px] text-slate-500">
            Try clearing filters on this page, or check individual job pipelines
            for more detailed views and inline actions.
          </p>
        </div>
      )}
    </div>
  );
}

/* Helpers */

function formatAppliedDate(iso: string | null | undefined) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function scoreRingClass(score: number | null) {
  if (score == null) return "text-slate-300";
  if (score >= 80) return "text-emerald-500";
  if (score >= 65) return "text-sky-500";
  if (score >= 50) return "text-amber-500";
  return "text-slate-500";
}

function tierColour(tier: string | null | undefined) {
  switch ((tier || "").toUpperCase()) {
    case "A":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "B":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "C":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}

function MatchScoreDonut({
  score,
  reason,
}: {
  score: number | null;
  reason?: string | null;
}) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const percentage = score == null ? 0 : score;
  const offset = circumference * (1 - percentage / 100);
  const ringClass = scoreRingClass(score);

  return (
    <div
      className="relative h-10 w-10"
      title={reason || "Scored by semantic CV/JD engine."}
    >
      <svg
        className="h-10 w-10 -rotate-90 text-slate-200"
        viewBox="0 0 40 40"
      >
        {/* track */}
        <circle
          className="text-slate-200"
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          r={radius}
          cx="20"
          cy="20"
        />
        {/* progress */}
        <circle
          className={ringClass}
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="20"
          cy="20"
          strokeDasharray={circumference}
          strokeDashoffset={score == null ? circumference : offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-semibold text-slate-900">
          {score == null ? "–" : score}
        </span>
      </div>
    </div>
  );
}

function StatusChip({
  label,
  dotClass,
  active,
  activeClass,
}: {
  label: string;
  dotClass: string;
  active: boolean;
  activeClass: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]",
        active
          ? activeClass
          : "border-slate-200 bg-slate-50 text-slate-500",
      ].join(" ")}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
