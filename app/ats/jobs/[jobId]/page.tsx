// app/ats/jobs/[jobId]/JobPipelineBoard.tsx
import Link from "next/link";
import { StageSelect } from "./StageSelect";

type SkillTag = {
  id: string;
  label: string;
  color?: string | null;
};

type PipelineApp = {
  id: string;
  candidateId: string | null;

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
  skillTags: SkillTag[];
  experienceLabel: string | null;
};

type StageInfo = {
  id: string;
  name: string;
};

type JobPipelineBoardProps = {
  jobId: string;
  stages: StageInfo[];
  applications: PipelineApp[];
};

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

function scoreColour(score: number | null | undefined) {
  if (score == null) return "text-slate-500";
  if (score >= 80) return "text-emerald-700";
  if (score >= 65) return "text-sky-700";
  if (score >= 50) return "text-amber-700";
  return "text-slate-600";
}

function statusChipClasses(status: string | null | undefined) {
  const v = (status || "PENDING").toUpperCase();
  if (v === "ON_HOLD") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  if (v === "REJECTED") {
    return "bg-rose-50 text-rose-700 border border-rose-200";
  }
  // PENDING / default
  return "bg-emerald-50 text-emerald-700 border border-emerald-200";
}

function statusLabel(status: string | null | undefined) {
  const v = (status || "PENDING").toUpperCase();
  if (v === "ON_HOLD") return "On hold";
  if (v === "REJECTED") return "Rejected";
  return "Active";
}

function formatDateFromIso(iso: string | null | undefined) {
  if (!iso) return "";
  // yyyy-mm-dd
  return iso.slice(0, 10);
}

export default function JobPipelineBoard({
  jobId,
  stages,
  applications,
}: JobPipelineBoardProps) {
  const totalApplications = applications.length;

  // Stage distribution (using job stages if present)
  const effectiveStages: StageInfo[] =
    stages && stages.length > 0
      ? stages
      : [
          { id: "v-APPLIED", name: "APPLIED" },
          { id: "v-SCREENING", name: "SCREENING" },
          { id: "v-SHORTLISTED", name: "SHORTLISTED" },
          { id: "v-INTERVIEW", name: "INTERVIEW" },
          { id: "v-OFFER", name: "OFFER" },
          { id: "v-HIRED", name: "HIRED" },
          { id: "v-REJECTED", name: "REJECTED" },
        ];

  const stageCounts = new Map<string, number>();
  for (const s of effectiveStages) {
    stageCounts.set(s.name.toUpperCase(), 0);
  }
  for (const app of applications) {
    const key = (app.stage || "APPLIED").toUpperCase();
    stageCounts.set(key, (stageCounts.get(key) ?? 0) + 1);
  }

  const scores = applications
    .map((a) => a.matchScore)
    .filter((s): s is number => typeof s === "number");

  const avgScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((sum, v) => sum + v, 0) / Math.max(scores.length, 1),
        )
      : null;

  const exportCsvHref = `/api/ats/jobs/${jobId}/pipeline/export?format=csv`;
  const exportXlsHref = `/api/ats/jobs/${jobId}/pipeline/export?format=xls`;

  return (
    <section className="mt-6 space-y-4">
      {/* Header + legend + exports */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Pipeline
          </h2>
          <p className="text-xs text-slate-500">
            {totalApplications} application
            {totalApplications === 1 ? "" : "s"} in the current view, shown as a
            sortable list instead of columns.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Tier A
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              Tier B
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Tier C
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Tier D / unscored
            </span>
            {avgScore != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700">
                Avg score: {avgScore}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-[11px] text-slate-500">
          {/* Stage summary */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {effectiveStages.slice(0, 4).map((s) => {
              const count = stageCounts.get(s.name.toUpperCase()) ?? 0;
              return (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {s.name}
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-800">{count}</span>
                </span>
              );
            })}
            {effectiveStages.length > 4 && (
              <span className="text-[10px] text-slate-400">
                +{effectiveStages.length - 4} more stages
              </span>
            )}
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <a
              href={exportCsvHref}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <span>⬇</span>
              <span>Export CSV</span>
            </a>
            <a
              href={exportXlsHref}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <span>⬇</span>
              <span>Export XLS</span>
            </a>
          </div>
        </div>
      </div>

      {/* List / table view */}
      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-[11px] text-slate-500">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white shadow-sm">
            ATS
          </div>
          <p className="mb-1 text-[12px] font-medium text-slate-800">
            No candidates in this view.
          </p>
          <p className="max-w-sm mx-auto text-[11px] text-slate-500">
            Adjust the filters above, or expand the search to see more of the
            pipeline.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full border-separate border-spacing-y-1 text-[11px]">
            <thead>
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2">Candidate</th>
                <th className="px-4 py-2">Stage</th>
                <th className="px-4 py-2">Decision</th>
                <th className="px-4 py-2 text-right">Tier / score</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2 text-right">Applied</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const topSkills = app.skillTags.slice(0, 3);
                const extraSkillCount =
                  app.skillTags.length > 3
                    ? app.skillTags.length - 3
                    : 0;

                const appliedDate = formatDateFromIso(app.appliedAt);

                const tier = app.tier;
                const score = app.matchScore;
                const scoreReason =
                  app.scoreReason ||
                  app.matchReason ||
                  "Scored by semantic CV/JD engine.";

                return (
                  <tr key={app.id}>
                    {/* Candidate */}
                    <td className="align-top px-4 py-2">
                      <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={
                                  app.candidateId
                                    ? `/ats/candidates/${app.candidateId}`
                                    : "#"
                                }
                                className="truncate text-[11px] font-semibold text-slate-900 hover:underline"
                              >
                                {app.fullName}
                              </Link>
                              {app.source && (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600">
                                  {app.source}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                              {app.email && <span>{app.email}</span>}
                              {app.location && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>{app.location}</span>
                                </>
                              )}
                              {app.currentCompany && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>{app.currentCompany}</span>
                                </>
                              )}
                              {app.currentTitle && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>{app.currentTitle}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end text-[10px] text-slate-500">
                            <span>Applied {appliedDate}</span>
                          </div>
                        </div>

                        {topSkills.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {topSkills.map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-700"
                              >
                                {tag.label}
                              </span>
                            ))}
                            {extraSkillCount > 0 && (
                              <span className="text-[9px] text-slate-400">
                                +{extraSkillCount} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Stage (inline StageSelect + label) */}
                    <td className="align-top px-4 py-2 text-[10px] text-slate-600">
                      <div className="flex flex-col gap-1">
                        <StageSelect
                          jobId={jobId}
                          applicationId={app.id}
                          currentStage={app.stage}
                        />
                        <span className="text-[10px] text-slate-400">
                          Current: {(app.stage || "APPLIED").toUpperCase()}
                        </span>
                      </div>
                    </td>

                    {/* Status / decision */}
                    <td className="align-top px-4 py-2 text-[10px] text-slate-600">
                      <span
                        className={[
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          statusChipClasses(app.status),
                        ].join(" ")}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {statusLabel(app.status)}
                      </span>
                    </td>

                    {/* Tier / score */}
                    <td className="align-top px-4 py-2 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {tier && (
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                              tierColour(tier),
                            ].join(" ")}
                          >
                            Tier {tier.toUpperCase()}
                          </span>
                        )}
                        {score != null && (
                          <span
                            className={[
                              "inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium",
                              scoreColour(score),
                            ].join(" ")}
                            title={scoreReason}
                          >
                            Score {score}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="align-top px-4 py-2 text-[10px] text-slate-600">
                      {app.source || "—"}
                    </td>

                    {/* Applied / quick actions */}
                    <td className="align-top px-4 py-2 text-right text-[10px] text-slate-600">
                      <div className="flex flex-col items-end gap-1">
                        <span>{appliedDate}</span>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {app.email && (
                            <a
                              href={`mailto:${app.email}`}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <span>✉</span>
                              <span>Email</span>
                            </a>
                          )}
                          {app.candidateId && (
                            <Link
                              href={`/ats/candidates/${app.candidateId}`}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <span>👤</span>
                              <span>Profile</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
