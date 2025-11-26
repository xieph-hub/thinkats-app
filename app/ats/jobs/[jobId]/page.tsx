// app/ats/jobs/[jobId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getResourcinTenant } from "@/lib/tenant";
import { getJobWithPipeline } from "@/lib/jobs";
import StageSelect from "./StageSelect";

export const dynamic = "force-dynamic";

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalize(value: string | null | undefined) {
  if (!value) return "";
  return String(value).toUpperCase();
}

function prettyLabel(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  const clean = value.toString().trim().replace(/\s+/g, " ");
  return clean
    .toLowerCase()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stageBadgeClass(stage: string | null | undefined) {
  const v = normalize(stage);
  if (v === "OFFER") {
    // Offer – Resourcin Yellow
    return "rounded-full bg-[#FFC000]/10 px-2 py-0.5 text-[10px] font-medium text-[#7A5600]";
  }
  if (v === "HIRED") {
    // Hired – Resourcin Greens
    return "rounded-full bg-[#64C247]/10 px-2 py-0.5 text-[10px] font-medium text-[#306B34]";
  }
  if (v === "REJECTED") {
    return "rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700";
  }
  if (v === "INTERVIEW" || v === "INTERVIEWING" || v === "SCREENING") {
    // In process – Resourcin Blue
    return "rounded-full bg-[#172965]/10 px-2 py-0.5 text-[10px] font-medium text-[#172965]";
  }
  // Default (Applied or undefined)
  return "rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600";
}

function statusBadgeClass(status: string | null | undefined) {
  const v = normalize(status);
  if (v === "PENDING" || v === "OPEN") {
    return "rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600";
  }
  if (v === "ACTIVE" || v === "IN_PROGRESS") {
    return "rounded-full bg-[#172965]/10 px-2 py-0.5 text-[10px] font-medium text-[#172965]";
  }
  if (v === "ON_HOLD") {
    return "rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700";
  }
  if (v === "REJECTED" || v === "ARCHIVED") {
    return "rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700";
  }
  // Fallback
  return "rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600";
}

const STAGE_COLUMNS = [
  { id: "APPLIED", label: "Applied" },
  { id: "SCREENING", label: "Screening" },
  { id: "INTERVIEWING", label: "Interviewing" },
  { id: "OFFER", label: "Offer" },
  { id: "HIRED", label: "Hired" },
  { id: "REJECTED", label: "Rejected" },
];

export default async function JobPipelinePage({
  params,
}: {
  params: { jobId: string };
}) {
  const { jobId } = params;

  const tenant = await getResourcinTenant();
  if (!tenant) {
    notFound();
  }

  const job = await getJobWithPipeline(jobId, tenant.id);
  if (!job) {
    notFound();
  }

  const totalApplications = job.applications.length;

  const columns = STAGE_COLUMNS.map((col) => {
    const apps = job.applications.filter((app: any) => {
      const stage = app.stage as string | null | undefined;
      if (!stage && col.id === "APPLIED") return true;
      return stage === col.id;
    });

    return {
      ...col,
      count: apps.length,
      applications: apps,
    };
  });

  const openDate = formatDate(job.createdAt as any);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Top header: job meta + quick links */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/ats/jobs"
            className="inline-flex items-center text-[11px] font-medium text-slate-500 hover:text-slate-800"
          >
            <span className="mr-1.5">←</span>
            Back to jobs
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            {job.clientCompany && (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700">
                {job.clientCompany.name}
              </span>
            )}
            {job.location && (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700">
                {job.location}
              </span>
            )}
            {job.employmentType && (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700">
                {prettyLabel(job.employmentType, "")}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-[#172965]/5 px-2 py-1 text-[10px] font-medium text-[#172965]">
              {prettyLabel(job.status as any, "Open")}
            </span>
            {openDate && (
              <span className="text-[11px] text-slate-500">
                Opened {openDate}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700">
              Total candidates:{" "}
              <span className="font-semibold text-slate-900">
                {totalApplications}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href={`/jobs/${job.slug ?? job.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
            >
              View public role
            </Link>

            <Link
              href={`/ats/jobs/${job.id}/edit`}
              className="inline-flex items-center rounded-md bg-[#172965] px-3 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-[#111d4f]"
            >
              Edit job
            </Link>
          </div>
        </div>
      </div>

      {/* Small stat strip */}
      <div className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-sm sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              Job status
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {prettyLabel(job.status as any, "Open")}
            </p>
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#172965]/10 text-[11px] font-semibold text-[#172965]">
            ATS
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              Total candidates
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {totalApplications}
            </p>
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#306B34]/10 text-[11px] font-semibold text-[#306B34]">
            CRM
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              Tenant
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {tenant.name || tenant.slug || "Resourcin"}
            </p>
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FFC000]/10 text-[11px] font-semibold text-[#7A5600]">
            Org
          </span>
        </div>
      </div>

      {/* Pipeline board */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex max-h-[70vh] flex-col rounded-xl border border-slate-200 bg-slate-50"
          >
            {/* Column header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {column.label}
                </span>
                <span className="text-[11px] text-slate-400">
                  {column.count}{" "}
                  {column.count === 1 ? "candidate" : "candidates"}
                </span>
              </div>
            </div>

            {/* Column body */}
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {column.applications.length === 0 ? (
                <div className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-[11px] text-slate-400">
                  No candidates in this stage yet.
                </div>
              ) : (
                column.applications.map((app: any) => {
                  const candidateName =
                    app.fullName ||
                    app.candidate?.fullName ||
                    app.email;

                  const stage = app.stage as
                    | string
                    | null
                    | undefined;
                  const status = app.status as
                    | string
                    | null
                    | undefined;

                  const stageLabel = prettyLabel(
                    stage,
                    "Applied",
                  );
                  const statusLabel = prettyLabel(
                    status,
                    "Pending",
                  );

                  return (
                    <div
                      key={app.id}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-[11px] text-slate-700 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/ats/candidates/${app.candidateId}`}
                            className="block truncate text-[12px] font-semibold text-slate-900 hover:text-[#172965]"
                          >
                            {candidateName}
                          </Link>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {app.email}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className={stageBadgeClass(stage)}>
                            {stageLabel}
                          </span>
                          <span className={statusBadgeClass(status)}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                        <span>
                          Applied {formatDate(app.createdAt as any)}
                        </span>
                        {app.source && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>Source: {app.source}</span>
                          </>
                        )}
                        {app.location && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>{app.location}</span>
                          </>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        {/* 🔹 Inline stage selector (calls bulk endpoint with one applicationId) */}
                        <StageSelect
                          applicationId={app.id}
                          currentStage={stage}
                        />

                        <div className="ml-auto flex items-center gap-2">
                          {app.cvUrl && (
                            <a
                              href={app.cvUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-[#172965] hover:bg-slate-100"
                            >
                              View CV
                            </a>
                          )}

                          <Link
                            href={`/ats/candidates/${app.candidateId}`}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 hover:border-[#172965] hover:text-[#172965]"
                          >
                            Open profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
