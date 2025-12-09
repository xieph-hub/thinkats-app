// app/ats/applications/ApplicationsList.tsx
import { Mail, ChevronDown } from "lucide-react";

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
  const hasRows = applications.length > 0;

  return (
    <div className="flex h-full flex-1 flex-col rounded-2xl border border-slate-200 bg-white">
      {/* Bulk bar – UI only, no actions */}
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/60"
            />
            <span className="font-medium">Select all</span>
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
        </div>
        <p className="mt-1 text-[10px] text-slate-500">
          Hover over scores and tiers to see why a candidate was ranked where
          they are. Inline edits are disabled on this view.
        </p>
      </div>

      {/* Rows */}
      {hasRows ? (
        <ul className="divide-y divide-slate-100">
          {applications.map((app, idx) => {
            const score =
              typeof app.matchScore === "number" && !isNaN(app.matchScore)
                ? Math.max(0, Math.min(100, Math.round(app.matchScore)))
                : null;

            const appliedDate = app.appliedAt.slice(0, 10); // YYYY-MM-DD

            const normalizedStatus = (app.status || "PENDING").toUpperCase();
            const isActive =
              normalizedStatus === "PENDING" ||
              normalizedStatus === "ACTIVE" ||
              normalizedStatus === "";
            const isOnHold = normalizedStatus === "ON_HOLD";
            const isRejected = normalizedStatus === "REJECTED";

            return (
              <li
                key={app.id}
                className={`flex items-center gap-4 px-4 py-3 ${
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                }`}
              >
                {/* Checkbox */}
                <div className="flex w-8 justify-center">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/60"
                  />
                </div>

                {/* Candidate */}
                <div className="min-w-[220px] flex-1">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[12px] font-semibold text-slate-900">
                      {app.fullName || "Unnamed"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {app.email || "No email on record"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {app.location || "Location not set"}
                    </p>
                  </div>
                </div>

                {/* Match score donut */}
                <div className="flex w-[110px] flex-col items-center justify-center">
                  <MatchScoreDonut score={score} />
                  <span className="mt-1 text-[10px] text-slate-500">
                    Match score
                  </span>
                </div>

                {/* Stage pill (read-only) */}
                <div className="w-[140px]">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700"
                  >
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      {(app.stage || "APPLIED").toUpperCase()}
                    </span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </button>
                </div>

                {/* Status chips */}
                <div className="flex w-[170px] items-center gap-1.5">
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

                {/* Applied date */}
                <div className="w-[110px] text-right text-[11px] text-slate-600">
                  {appliedDate}
                </div>

                {/* Source / skills */}
                <div className="min-w-[160px] flex-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-slate-700">
                      {(app.source || "Unknown source").toUpperCase()}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {app.skillTags.length === 0 ? (
                        <span className="text-[10px] text-slate-400">
                          No skills tagged
                        </span>
                      ) : (
                        app.skillTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
                          >
                            {tag.label}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Email button */}
                <div className="flex w-10 justify-end">
                  {app.email ? (
                    <a
                      href={`mailto:${app.email}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <div className="h-8 w-8 rounded-full border border-dashed border-slate-200" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-[11px] text-slate-500">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/90 text-xs font-semibold text-white shadow-sm">
            ATS
          </div>
          <p className="text-xs font-medium text-slate-900">
            No applications match your current filters.
          </p>
          <p className="max-w-sm text-[11px] text-slate-500">
            Try clearing filters or check back after publishing roles and
            collecting candidates.
          </p>
        </div>
      )}
    </div>
  );
}

/* Helpers */

function MatchScoreDonut({ score }: { score: number | null }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const percentage = score == null ? 0 : score;
  const offset = circumference * (1 - percentage / 100);

  return (
    <div className="relative h-10 w-10">
      <svg
        className="h-10 w-10 -rotate-90 text-slate-200"
        viewBox="0 0 40 40"
      >
        <circle
          className="text-slate-200"
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          r={radius}
          cx="20"
          cy="20"
        />
        <circle
          className="text-amber-400"
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
