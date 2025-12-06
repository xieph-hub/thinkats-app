// app/ats/jobs/[jobId]/JobPipelineBoard.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type JobPipelineBoardProps = {
  jobId: string;
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

// Shape of a JobApplication as used in this board (candidate + tags + skills + scoringEvents)
type ApplicationWithExtras = Prisma.JobApplicationGetPayload<{
  include: {
    candidate: {
      include: {
        skills: {
          include: {
            skill: true;
          };
        };
        tags: {
          include: {
            tag: true;
          };
        };
      };
    };
    scoringEvents: true;
  };
}>;

export default async function JobPipelineBoard({
  jobId,
}: JobPipelineBoardProps) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      stages: {
        orderBy: { position: "asc" },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          candidate: {
            include: {
              skills: {
                include: { skill: true },
                orderBy: { createdAt: "desc" },
              },
              tags: {
                include: { tag: true },
              },
            },
          },
          scoringEvents: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const stages = [...job.stages].sort((a, b) => a.position - b.position);

  type Column = {
    id: string;
    name: string;
    applications: ApplicationWithExtras[];
  };

  const columns: Column[] = stages.map((s) => ({
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

  for (const app of job.applications as ApplicationWithExtras[]) {
    const stageKey = (app.stage || "").toUpperCase();
    const col =
      columnByStageName.get(stageKey) ?? fallbackColumn;
    if (col) {
      col.applications.push(app);
    }
  }

  const totalApplications = job.applications.length;

  const exportCsvHref = `/api/ats/jobs/${jobId}/pipeline/export?format=csv`;
  const exportXlsHref = `/api/ats/jobs/${jobId}/pipeline/export?format=xls`;

  return (
    <section className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Pipeline
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
                <PipelineCard key={app.id} application={app} />
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

function getSourceLabel(app: ApplicationWithExtras): string | null {
  const sourceTag = app.candidate?.tags
    ?.map((ct) => ct.tag)
    .find((t) => (t as any)?.kind === "SOURCE");

  if (sourceTag) return sourceTag.name;

  if (app.source) return app.source;

  if (app.howHeard) return app.howHeard;

  return null;
}

function PipelineCard({
  application,
}: {
  application: ApplicationWithExtras;
}) {
  const candidate = application.candidate;
  const latestScoring = application.scoringEvents[0] ?? null;

  const score =
    typeof application.matchScore === "number"
      ? application.matchScore
      : latestScoring?.score ?? null;

  const tier =
    (latestScoring?.tier as string | null | undefined) ?? null;

  const scoreReason =
    latestScoring?.reason ??
    application.matchReason ??
    "Scored by semantic CV/JD engine.";

  const sourceLabel = getSourceLabel(application);

  const skills =
    candidate?.skills?.map((cs) => cs.skill).filter(Boolean) ?? [];

  const topSkills = skills.slice(0, 6);

  return (
    <article className="rounded-lg border border-slate-100 bg-white/80 p-3 text-xs shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="truncate text-[13px] font-medium text-slate-900">
              {candidate?.fullName || application.fullName}
            </div>
            {sourceLabel && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {sourceLabel}
              </span>
            )}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
            {candidate?.currentTitle && (
              <span className="truncate">{candidate.currentTitle}</span>
            )}
            {candidate?.currentCompany && (
              <span className="truncate">
                {" · "}
                {candidate.currentCompany}
              </span>
            )}
            {candidate?.location && (
              <span className="truncate">
                {" · "}
                {candidate.location}
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
            <span className={scoreColour(score)}>
              {score != null ? `${score}` : "–"}
            </span>
            {tier && (
              <span className="text-[10px] uppercase text-slate-500">
                · {tier}
              </span>
            )}
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
              {skill.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500">
        <div className="flex flex-wrap items-center gap-1">
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
            {application.stage}
          </span>

          {application.status && (
            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
              {application.status}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {candidate?.email && (
            <a
              href={`mailto:${candidate.email}`}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <span>✉</span>
              <span>Email</span>
            </a>
          )}

          {candidate?.id && (
            <Link
              href={`/ats/candidates/${candidate.id}`}
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
