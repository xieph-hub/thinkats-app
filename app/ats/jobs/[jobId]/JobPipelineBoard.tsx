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

function scoreRingColour(score: number | null | undefined) {
  if (score == null) return "stroke-slate-200";
  if (score >= 80) return "stroke-emerald-500";
  if (score >= 65) return "stroke-sky-500";
  if (score >= 50) return "stroke-amber-500";
  return "stroke-slate-400";
}

function scoreTextColour(score: number | null | undefined) {
  if (score == null) return "text-slate-500";
  if (score >= 80) return "text-emerald-700";
  if (score >= 65) return "text-sky-700";
  if (score >= 50) return "text-amber-700";
  return "text-slate-600";
}

function statusPillClasses(status: string | null | undefined) {
  const value = (status || "PENDING").toUpperCase();
  if (value === "REJECTED") {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }
  if (value === "ON_HOLD") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  // Default = active / pending
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

function formatAppliedDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ScoreRing({ score }: { score: number | null }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const clamped = score == null ? 0 : Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex items-center gap-2">
      <svg
        className="h-11 w-11"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <circle
          className="stroke-slate-200"
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          strokeWidth={4}
        />
        <circle
          className={scoreRingColour(score)}
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{ strokeDashoffset: offset }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className={`text-[11px] font-semibold ${scoreTextColour(score)}`}
        >
          {score != null ? score : "–"}
        </text>
      </svg>
      <div className="flex flex-col text-[10px] leading-tight text-slate-500">
        <span className="font-semibold text-slate-700">Match score</span>
        <span>Semantic CV/JD fit</span>
      </div>
    </div>
  );
}

export default function JobPipelineBoard({
  jobId,
  stages,
  applications,
}: JobPipelineBoardProps) {
  // If no stages in DB for this job, fall back to sane defaults
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

  type Column = {
    id: string;
    name: string;
    applications: PipelineApp[];
  };

  const columns: Column[] = effectiveStages.map((s) => ({
    id: s.id,
    name: s.name,
    applications: [],
  }));

  const columnByStageName = new Map<string, Column>();
  for (const col of columns) {
    columnByStageName.set(col.name.toUpperCase(), col);
  }

  const fallbackColumn =
    columnByStageName.get("APPLIED") ?? columns[0] ?? null;

  for (const app of applications) {
    const stageKey = (app.stage || "APPLIED").toUpperCase();
    const col = columnByStageName.get(stageKey) ?? fallbackColumn;
    if (col) {
      col.applications.push(app);
    }
  }

  const totalApplications = applications.length;

  const exportCsvHref = `/api/ats/jobs/${jobId}/pipeline/export?format=csv`;
  const exportXlsHref = `/api/ats/jobs/${jobId}/pipeline/export?format=xls`;

  return (
    <section className="mt-6 space-y-4">
      {/* Header row: legend + exports */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Pipeline (Board)
          </h2>
          <p className="text-xs text-slate-500">
            {totalApplications} application
            {totalApplications === 1 ? "" : "s"} across{" "}
            {columns.length} stage
            {columns.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
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
          </div>

          <div className="flex items-center gap-1">
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

      {/* Kanban columns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                  {column.name}
                </h3>
                <span className="text-[10px] font-medium text-slate-400">
                  {column.applications.length}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {column.applications.map((app) => (
                <PipelineCard key={app.id} jobId={jobId} application={app} />
              ))}

              {column.applications.length === 0 && (
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  No candidates here yet.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PipelineCard({
  application,
  jobId,
}: {
  application: PipelineApp;
  jobId: string;
}) {
  const score = application.matchScore;
  const tier = application.tier;
  const scoreReason =
    application.scoreReason ||
    application.matchReason ||
    "Scored by semantic CV/JD engine.";

  const sourceLabel = application.source;
  const topSkills = application.skillTags.slice(0, 5);
  const appliedDate = formatAppliedDate(application.appliedAt);

  const statusLabel = (application.status || "Active").toUpperCase();

  return (
    <article className="rounded-xl border border-slate-100 bg-white/90 p-3 text-xs shadow-sm">
      {/* Candidate header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Link
              href={
                application.candidateId
                  ? `/ats/candidates/${application.candidateId}`
                  : "#"
              }
              className="truncate text-[13px] font-semibold text-slate-900 hover:text-indigo-700 hover:underline"
            >
              {application.fullName}
            </Link>
            {sourceLabel && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {sourceLabel}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
            {application.currentTitle && (
              <span className="truncate">{application.currentTitle}</span>
            )}
            {application.currentCompany && (
              <span className="truncate">
                {" · "}
                {application.currentCompany}
              </span>
            )}
            {application.location && (
              <span className="truncate">
                {" · "}
                {application.location}
              </span>
            )}
          </div>

          {appliedDate && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span>Applied</span>
              <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
              <span>{appliedDate}</span>
            </div>
          )}
        </div>

        {/* Match score + tier */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <ScoreRing score={score} />
          </div>
          {tier && (
            <div
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${tierColour(
                tier,
              )}`}
            >
              <span className="text-[9px]">★</span>
              <span>Tier {tier.toUpperCase()}</span>
            </div>
          )}
          <span
            className="cursor-help text-[9px] text-slate-400"
            title={scoreReason}
          >
            Why this score?
          </span>
        </div>
      </div>

      {/* Skills */}
      {topSkills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {topSkills.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
            >
              {skill.label}
            </span>
          ))}
        </div>
      )}

      {/* Stage / status / actions inline */}
      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-500">
        <div className="flex flex-wrap items-center gap-2">
          <StageSelect
            jobId={jobId}
            applicationId={application.id}
            currentStage={application.stage}
          />
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${statusPillClasses(
              application.status,
            )}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            <span>
              {statusLabel === "ON_HOLD"
                ? "On hold"
                : statusLabel === "REJECTED"
                ? "Rejected"
                : "Active"}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {application.email && (
            <a
              href={`mailto:${application.email}`}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] text-slate-600 shadow-sm hover:bg-slate-50"
              title="Email candidate"
            >
              ✉
            </a>
          )}

          {application.candidateId && (
            <Link
              href={`/ats/candidates/${application.candidateId}`}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-[12px] text-slate-600 shadow-sm hover:bg-slate-50"
              title="Open candidate profile"
            >
              👁
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
