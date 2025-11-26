// app/ats/jobs/[jobId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getResourcinTenant } from "@/lib/tenant";
import { getJobWithPipeline } from "@/lib/jobs";

export const dynamic = "force-dynamic";

type PipelineColumn = {
  id: string;
  name: string;
};

export default async function AtsJobDetailPage({
  params,
}: {
  params: { jobId: string };
}) {
  const tenant = await getResourcinTenant();
  const job = await getJobWithPipeline(params.jobId, tenant.id);

  if (!job) {
    notFound();
  }

  // Build stage columns from applications’ pipelineStage
  const stageMap = new Map<string, PipelineColumn>();

  for (const app of job.applications) {
    const stageId = app.pipelineStage?.id ?? "unassigned";
    const stageName = app.pipelineStage?.name ?? "New / Unassigned";

    if (!stageMap.has(stageId)) {
      stageMap.set(stageId, { id: stageId, name: stageName });
    }
  }

  // Ensure at least one column exists
  if (stageMap.size === 0) {
    stageMap.set("unassigned", {
      id: "unassigned",
      name: "New / Unassigned",
    });
  }

  const stages = Array.from(stageMap.values());

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/ats/jobs"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to ATS jobs
          </Link>

          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {job.title}
          </h1>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>
              {job.clientCompany
                ? job.clientCompany.name
                : "Resourcin-branded"}
            </span>

            {job.location && (
              <>
                <span className="text-slate-300">•</span>
                <span>{job.location}</span>
              </>
            )}

            <span className="text-slate-300">•</span>
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {job.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-500">
          <span>
            Job ID: <span className="font-mono">{job.id}</span>
          </span>
          {job.slug && (
            <span>
              Slug: <span className="font-mono">{job.slug}</span>
            </span>
          )}
          <span>
            Applications:{" "}
            <span className="font-semibold text-slate-800">
              {job.applications.length}
            </span>
          </span>
        </div>
      </div>

      {/* Pipeline board */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage) => {
          const appsInStage = job.applications.filter((app) => {
            const stageId = app.pipelineStage?.id ?? "unassigned";
            return stageId === stage.id;
          });

          return (
            <div
              key={stage.id}
              className="flex min-h-[260px] flex-col rounded-lg border border-slate-200 bg-slate-50"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {stage.name}
                </h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                  {appsInStage.length}
                </span>
              </div>

              {appsInStage.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-3 py-4 text-center text-xs text-slate-400">
                  No candidates in this stage yet.
                </div>
              ) : (
                <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
                  {appsInStage.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-md bg-white p-3 text-xs shadow-sm ring-1 ring-slate-200"
                    >
                      {/* Candidate basics */}
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {app.candidate.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {app.candidate.currentTitle || "Candidate"}
                            {app.candidate.currentCompany
                              ? ` • ${app.candidate.currentCompany}`
                              : ""}
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                        <div className="truncate">
                          <span className="font-medium">Email: </span>
                          <a
                            href={`mailto:${app.candidate.email}`}
                            className="text-resourcin-blue hover:underline"
                          >
                            {app.candidate.email}
                          </a>
                        </div>

                        {app.candidate.location && (
                          <div className="truncate">
                            <span className="font-medium">Location: </span>
                            {app.candidate.location}
                          </div>
                        )}
                      </div>

                      {/* Footer: submitted date + CV link */}
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          Submitted:{" "}
                          {app.submittedAt
                            ? new Date(app.submittedAt).toLocaleDateString()
                            : "—"}
                        </span>

                        {app.cvUrl && (
                          <a
                            href={app.cvUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-medium text-resourcin-blue hover:underline"
                          >
                            View CV
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
