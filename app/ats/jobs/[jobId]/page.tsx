// app/ats/jobs/[jobId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_TENANT_SLUG =
  process.env.RESOURCIN_TENANT_SLUG || "resourcin";

async function getDefaultTenant() {
  // If you ever set RESOURCIN_TENANT_ID, we respect it
  if (process.env.RESOURCIN_TENANT_ID) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: process.env.RESOURCIN_TENANT_ID },
    });
    return tenant;
  }

  return prisma.tenant.findFirst({
    where: { slug: DEFAULT_TENANT_SLUG },
  });
}

type PipelineColumn = {
  id: string;
  name: string;
  applications: {
    id: string;
    fullName: string;
    email: string;
    stage: string;
    status: string;
  }[];
};

async function getJobWithPipeline(jobId: string) {
  const tenant = await getDefaultTenant();
  if (!tenant) return null;

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      tenantId: tenant.id,
    },
    include: {
      clientCompany: true,
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          candidate: true,
        },
      },
      stages: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!job) return null;

  // Build pipeline columns from stages + applications
  const columns = new Map<string, PipelineColumn>();

  // Base columns from JobStage definitions
  for (const stage of job.stages) {
    columns.set(stage.id, {
      id: stage.id,
      name: stage.name,
      applications: [],
    });
  }

  const UNASSIGNED_KEY = "unassigned";

  // Fallback column for anything without a mapped stage
  if (!columns.has(UNASSIGNED_KEY)) {
    columns.set(UNASSIGNED_KEY, {
      id: UNASSIGNED_KEY,
      name: "New / Unassigned",
      applications: [],
    });
  }

  // Drop each application into a column based on its `stage` string
  for (const app of job.applications) {
    // Prefer a stage mapping by name → JobStage.id if possible
    let targetKey = UNASSIGNED_KEY;

    if (app.stage) {
      const matchingStage = job.stages.find(
        (s) => s.name.toLowerCase() === app.stage.toLowerCase(),
      );

      if (matchingStage) {
        targetKey = matchingStage.id;
      } else {
        // Dynamic stage bucket for free-form stage names
        const dynamicKey = `stage:${app.stage}`;
        if (!columns.has(dynamicKey)) {
          columns.set(dynamicKey, {
            id: dynamicKey,
            name: app.stage,
            applications: [],
          });
        }
        targetKey = dynamicKey;
      }
    }

    const col = columns.get(targetKey)!;
    col.applications.push({
      id: app.id,
      fullName: app.fullName,
      email: app.email,
      stage: app.stage,
      status: app.status,
    });
  }

  const pipelineColumns = Array.from(columns.values());

  return { job, pipelineColumns };
}

export default async function AtsJobPage({
  params,
}: {
  params: { jobId: string };
}) {
  const { jobId } = params;

  const data = await getJobWithPipeline(jobId);

  if (!data) {
    notFound();
  }

  const { job, pipelineColumns } = data;

  return (
    <div className="space-y-8">
      {/* Header: job summary */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            ATS / Jobs / {job.id.slice(0, 8)}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {job.title}
          </h1>

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
            {job.clientCompany && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                {job.clientCompany.name}
              </span>
            )}
            {job.location && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                {job.location}
              </span>
            )}
            {job.employmentType && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                {job.employmentType}
              </span>
            )}
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 capitalize">
              {job.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/jobs/${job.slug ?? job.id}`}
            className="rounded-md bg-[#0B1320] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#111827]"
          >
            View public posting
          </Link>
        </div>
      </div>

      {/* Pipeline board */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Pipeline overview
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Candidates grouped by stage. (Drag & drop to move stages can come
              later; this is a read-only snapshot for now.)
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Total candidates:{" "}
            <span className="font-semibold">
              {job.applications.length}
            </span>
          </p>
        </div>

        <div className="mt-4 grid auto-cols-[minmax(220px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2">
          {pipelineColumns.map((column) => (
            <div
              key={column.id}
              className="flex h-full min-h-[220px] flex-col rounded-lg border border-slate-200 bg-white"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    {column.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {column.applications.length} candidate
                    {column.applications.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
                {column.applications.length === 0 ? (
                  <p className="text-[11px] italic text-slate-400">
                    No candidates in this stage yet.
                  </p>
                ) : (
                  column.applications.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs"
                    >
                      <p className="font-medium text-slate-900">
                        {app.fullName}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {app.email}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                        {(app.stage || "APPLIED").toUpperCase()} ·{" "}
                        {app.status.toUpperCase()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
