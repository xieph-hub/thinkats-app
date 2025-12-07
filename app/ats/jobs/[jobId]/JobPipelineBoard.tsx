// app/ats/jobs/[jobId]/JobPipelineBoard.tsx
import Link from "next/link";
import { StageSelect } from "./StageSelect";

export type SkillTag = {
  id: string;
  label: string;
  color?: string | null;
};

export type PipelineApp = {
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

export type StageInfo = {
  id: string;
  name: string;
};

export type JobPipelineBoardProps = {
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex flex-col rounded-xl border border-slate-200 bg-white/70 p-3 shadow-sm backdrop-blur"
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
  const topSkills = application.skillTags.slice(0, 6);

  return (
    <article className="rounded-lg border border-slate-100 bg-white/80 p-3 text-xs shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="truncate text-[13px] font-medium text-slate-900">
              {application.fullName}
            </div>
            {sourceLabel && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {sourceLabel}
              </span>
            )}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
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
        </div>

        <div className="flex flex-col items-end gap-1">
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tierColour(
              tier,
            )}`}
          >
            {tier && (
              <span className="text-[10px] uppercase text-slate-700">
                {tier}
              </span>
            )}
            <span className={scoreColour(score)}>
              {score != null ? `${score}` : "–"}
            </span>
          </div>
          <span
            className="cursor-help text-[10px] text-slate-400"
            title={scoreReason}
          >
            Why this score?
          </span>
        </div>
      </div>

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

      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500">
        <div className="flex flex-wrap items-center gap-2">
          <StageSelect
            jobId={jobId}
            applicationId={application.id}
            currentStage={application.stage}
          />

          {application.status && (
            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
              {application.status}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {application.email && (
            <a
              href={`mailto:${application.email}`}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <span>✉</span>
              <span>Email</span>
            </a>
          )}

          {application.candidateId && (
            <Link
              href={`/ats/candidates/${application.candidateId}`}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <span>👤</span>
              <span>Profile</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
