// app/ats/jobs/[jobId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import ApplicationStageStatusControls from "@/components/ats/ApplicationStageStatusControls";
import { defaultScoringConfigForPlan } from "@/lib/scoring";

export const dynamic = "force-dynamic";

const STAGE_ORDER = [
  "APPLIED",
  "SCREEN",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "INTERVIEWING",
  "OFFER",
  "OFFERED",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
];

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function titleCaseFromEnum(value?: string | null) {
  if (!value) return "";
  return value
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStageName(value: string | null | undefined) {
  if (!value) return "";
  const key = value.toUpperCase();
  const map: Record<string, string> = {
    APPLIED: "Applied",
    SCREEN: "Screen",
    SCREENING: "Screening",
    SHORTLISTED: "Shortlisted",
    INTERVIEW: "Interview",
    INTERVIEWING: "Interviewing",
    OFFER: "Offer",
    OFFERED: "Offered",
    HIRED: "Hired",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
  };
  if (map[key]) return map[key];
  return titleCaseFromEnum(value);
}

function applicationStatusBadgeClass(value?: string | null) {
  const key = (value || "").toUpperCase();
  if (key === "PENDING") {
    return "bg-slate-50 text-slate-700 border-slate-200";
  }
  if (key === "IN_PROGRESS") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }
  if (key === "ON_HOLD") {
    return "bg-amber-50 text-amber-800 border-amber-100";
  }
  if (key === "HIRED") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (key === "REJECTED" || key === "ARCHIVED") {
    return "bg-rose-50 text-rose-700 border-rose-100";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function normaliseJobStatus(status: string | null | undefined) {
  return (status || "").toLowerCase();
}

type Tier = "A" | "B" | "C" | "D";

function tierFromScore(
  score: number,
  thresholds: { A: number; B: number; C: number },
): Tier {
  if (score >= thresholds.A) return "A";
  if (score >= thresholds.B) return "B";
  if (score >= thresholds.C) return "C";
  return "D";
}

function tierBadgeClass(tier: Tier) {
  switch (tier) {
    case "A":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "B":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "C":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "D":
    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

interface AtsJobPageProps {
  params: { jobId: string };
}

export default async function AtsJobPage({ params }: AtsJobPageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-xl font-semibold text-slate-900">
          Job pipeline not available
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default tenant configured. Check{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_ID
          </code>{" "}
          or{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_SLUG
          </code>{" "}
          in your environment.
        </p>
      </div>
    );
  }

  const plan = (tenant as any).plan || "free";
  const scoringConfig = defaultScoringConfigForPlan(plan);
  const thresholds = scoringConfig.tierThresholds;
  const engineLabel = scoringConfig.enableNlpBoost
    ? "Scored with Pro/Enterprise engine"
    : "Scored with Free engine";

  const job = await prisma.job.findFirst({
    where: {
      id: params.jobId,
      tenantId: tenant.id,
    },
    include: {
      clientCompany: true,
      applications: {
        include: {
          candidate: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const applications = job.applications || [];
  const totalApplications = applications.length;

  const inProcessCount = applications.filter((app) =>
    ["IN_PROGRESS", "ON_HOLD"].includes((app.status || "").toUpperCase()),
  ).length;

  const hiredCount = applications.filter(
    (app) => (app.status || "").toUpperCase() === "HIRED",
  ).length;

  const rejectedCount = applications.filter((app) =>
    ["REJECTED", "ARCHIVED"].includes((app.status || "").toUpperCase()),
  ).length;

  // Group applications into stages
  const buckets = new Map<string, typeof applications>();
  for (const app of applications) {
    const key = (app.stage || "APPLIED").toUpperCase();
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key)!.push(app);
  }

  const knownStages = STAGE_ORDER.filter((s) => buckets.has(s));
  const unknownStages = Array.from(buckets.keys()).filter(
    (s) => !STAGE_ORDER.includes(s),
  );

  const orderedStages = [...knownStages, ...unknownStages];

  const jobStatusLabel = titleCaseFromEnum(job.status as any);
  const jobLocation = job.location || "Location not specified";
  const clientName = job.clientCompany?.name || null;

  const publicJobPath = job.slug
    ? `/jobs/${encodeURIComponent(job.slug)}`
    : `/jobs/${encodeURIComponent(job.id)}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/ats/jobs"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <span className="mr-1.5">←</span>
            Back to ATS jobs
          </Link>

          <div className="mt-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              ATS · Job pipeline
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              {job.title || "Untitled role"}
            </h1>
            <p className="text-xs text-slate-600">
              {clientName && (
                <>
                  <span className="font-medium">{clientName}</span>
                  <span className="mx-1 text-slate-300">•</span>
                </>
              )}
              {jobLocation}
              {job.employmentType && (
                <>
                  <span className="mx-1 text-slate-300">•</span>
                  <span>{titleCaseFromEnum(job.employmentType)}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            {job.status && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
                  normaliseJobStatus(job.status) === "open"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-slate-50 text-slate-700 border border-slate-200"
                }`}
              >
                {jobStatusLabel || "Status not set"}
              </span>
            )}
            {job.visibility && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">
                {titleCaseFromEnum(job.visibility)} visibility
              </span>
            )}
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700">
              Plan:{" "}
              <span className="ml-1 capitalize">
                {(plan || "free").toLowerCase()}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap justify-end gap-2 text-[11px] text-slate-600">
            <span>
              {totalApplications}{" "}
              {totalApplications === 1 ? "application" : "applications"}
            </span>
            <span className="text-slate-300">•</span>
            <span>{inProcessCount} in process</span>
            <span className="text-slate-300">•</span>
            <span>{hiredCount} hired</span>
            <span className="text-slate-300">•</span>
            <span>{rejectedCount} rejected / archived</span>
          </div>

          <div className="flex flex-wrap justify-end gap-2 text-[11px]">
            <span className="text-[10px] text-slate-500">
              {engineLabel}
            </span>
            <Link
              href={publicJobPath}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-[#172965] hover:bg-slate-50"
            >
              View public job page ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Stage summary pills */}
      {totalApplications > 0 && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-[11px] text-slate-600 shadow-sm">
          {orderedStages.map((stageKey) => {
            const stageApps = buckets.get(stageKey) || [];
            if (stageApps.length === 0) return null;
            return (
              <div
                key={stageKey}
                className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1"
              >
                <span className="font-medium text-slate-800">
                  {formatStageName(stageKey)}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{stageApps.length}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pipeline list */}
      {totalApplications === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No applications have been received for this role yet. Once candidates
          apply, they will appear here grouped by stage.
        </div>
      ) : (
        <div className="space-y-4">
          {orderedStages.map((stageKey) => {
            const stageApps = buckets.get(stageKey) || [];
            if (stageApps.length === 0) return null;

            const stageLabel = formatStageName(stageKey);

            return (
              <section
                key={stageKey}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {stageLabel}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {stageApps.length}{" "}
                      {stageApps.length === 1
                        ? "candidate in this stage"
                        : "candidates in this stage"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {stageApps.map((app) => {
                    const candidate = app.candidate;
                    const name =
                      candidate?.fullName ||
                      app.fullName ||
                      "Unnamed candidate";
                    const email =
                      candidate?.email || (app as any).email || "";
                    const location =
                      candidate?.location ||
                      app.location ||
                      "Location not set";
                    const appliedAt = formatDate(app.createdAt);
                    const sourceLabel = app.source || "—";
                    const stageLabelInner = formatStageName(
                      app.stage || "APPLIED",
                    );
                    const statusLabel = titleCaseFromEnum(
                      app.status || "PENDING",
                    );

                    const candidateId = candidate?.id;
                    const cvUrl =
                      (app as any).cvUrl || (candidate as any)?.cvUrl || null;

                    const matchScore =
                      (app as any).matchScore ??
                      null; // Int? from Prisma, may be null
                    const matchReason = (app as any).matchReason || "";

                    let tier: Tier | null = null;
                    if (typeof matchScore === "number") {
                      tier = tierFromScore(matchScore, thresholds);
                    }

                    return (
                      <div
                        key={app.id}
                        className="flex items-stretch justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                      >
                        {/* Left: candidate meta */}
                        <div className="flex min-w-0 flex-1 gap-3">
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                            {name
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join("") || "C"}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-semibold text-slate-900">
                                {name}
                              </span>
                              {email && (
                                <span className="truncate text-[11px] text-slate-500">
                                  {email}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                              <span className="font-medium text-slate-800">
                                {location}
                              </span>
                              {appliedAt && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>Applied {appliedAt}</span>
                                </>
                              )}
                              {sourceLabel !== "—" && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>
                                    Source:{" "}
                                    <span className="font-medium">
                                      {sourceLabel}
                                    </span>
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              {cvUrl && (
                                <a
                                  href={cvUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#172965] hover:underline"
                                >
                                  View CV ↗
                                </a>
                              )}
                              {candidateId && (
                                <>
                                  {cvUrl && (
                                    <span className="text-slate-300">•</span>
                                  )}
                                  <Link
                                    href={`/ats/candidates/${candidateId}`}
                                    className="text-[#172965] hover:underline"
                                  >
                                    View candidate profile
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: stage/status + scoring */}
                        <div className="flex shrink-0 flex-col items-end justify-between gap-2 text-right text-[11px] text-slate-600">
                          <div className="flex flex-col items-end gap-1">
                            {/* Current state badges */}
                            <div className="flex flex-wrap justify-end gap-2">
                              <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-slate-700">
                                {stageLabelInner}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${applicationStatusBadgeClass(
                                  app.status,
                                )}`}
                              >
                                {statusLabel}
                              </span>
                            </div>

                            {/* Scoring row */}
                            {typeof matchScore === "number" && tier && (
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${tierBadgeClass(
                                    tier,
                                  )}`}
                                >
                                  Tier {tier} · {matchScore}/100
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {engineLabel}
                                </span>
                                {matchReason && (
                                  <button
                                    type="button"
                                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50"
                                    title={matchReason}
                                  >
                                    Score breakdown
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Editable controls */}
                          <ApplicationStageStatusControls
                            applicationId={app.id}
                            initialStage={app.stage || "APPLIED"}
                            initialStatus={app.status || "PENDING"}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
