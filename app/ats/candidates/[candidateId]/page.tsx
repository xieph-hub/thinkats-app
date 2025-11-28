// app/ats/candidates/[candidateId]/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type PageProps = {
  params: {
    candidateId: string;
  };
};

function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalize(value: string | null | undefined) {
  if (!value) return "";
  return String(value).toUpperCase();
}

function stageBadgeClass(stage: string | null | undefined) {
  const v = normalize(stage);
  if (v === "OFFER" || v === "OFFERED") {
    return "rounded-full bg-[#FFC000]/10 px-2 py-0.5 text-[10px] font-medium text-[#7A5600]";
  }
  if (v === "HIRED") {
    return "rounded-full bg-[#64C247]/10 px-2 py-0.5 text-[10px] font-medium text-[#306B34]";
  }
  if (v === "REJECTED" || v === "WITHDRAWN") {
    return "rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700";
  }
  if (
    v === "INTERVIEW" ||
    v === "INTERVIEWING" ||
    v === "SCREENING" ||
    v === "SHORTLISTED"
  ) {
    return "rounded-full bg-[#172965]/10 px-2 py-0.5 text-[10px] font-medium text-[#172965]";
  }
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
  if (v === "HIRED") {
    return "rounded-full bg-[#64C247]/10 px-2 py-0.5 text-[10px] font-medium text-[#306B34]";
  }
  return "rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600";
}

// Very loose UUID check – enough to avoid Prisma UUID parse errors
function looksLikeUuid(value: string) {
  // 36 chars / hex + dashes
  return /^[0-9a-fA-F-]{36}$/.test(value);
}

/**
 * Load candidate view by either:
 * - UUID candidate id, or
 * - email key (when the param is an email)
 */
async function loadCandidateView(paramsKey: string, tenantId: string) {
  // Next already decodes `%40`, but this is safe either way
  const rawKey = decodeURIComponent(paramsKey);

  let candidate: any = null;
  let applications: any[] = [];
  let mode: "id" | "email" = "email";
  let emailKey: string | null = null;

  if (looksLikeUuid(rawKey)) {
    mode = "id";

    // Try candidate by UUID scoped to tenant
    candidate = await prisma.candidate.findFirst({
      where: {
        id: rawKey,
        tenantId,
      },
    });

    // If we have the candidate, prefer their email when loading apps
    if (candidate?.email) {
      emailKey = candidate.email as string;
    }

    // Applications for this candidateId OR (if known) their email
    applications = await prisma.jobApplication.findMany({
      where: {
        job: {
          tenantId,
        },
        OR: [
          { candidateId: rawKey },
          ...(emailKey ? [{ email: emailKey }] : []),
        ],
      },
      include: {
        job: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } else {
    // Treat as email key
    mode = "email";
    emailKey = rawKey;

    candidate = await prisma.candidate.findFirst({
      where: {
        tenantId,
        email: emailKey,
      },
    });

    applications = await prisma.jobApplication.findMany({
      where: {
        job: {
          tenantId,
        },
        email: emailKey,
      },
      include: {
        job: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  return {
    mode,
    rawKey,
    emailKey,
    candidate,
    applications,
  };
}

// 🔹 Canonical stage & status options used in candidate inline controls
const STAGE_OPTIONS = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEWING",
  "OFFER",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
];

const STATUS_OPTIONS = [
  "PENDING",
  "IN_PROGRESS",
  "ON_HOLD",
  "HIRED",
  "REJECTED",
  "ARCHIVED",
];

function formatStageLabel(value: string | null | undefined) {
  const v = (value || "").toUpperCase();
  switch (v) {
    case "APPLIED":
      return "Applied";
    case "SCREENING":
      return "Screening";
    case "SHORTLISTED":
      return "Shortlisted";
    case "INTERVIEW":
    case "INTERVIEWING":
      return "Interviewing";
    case "OFFER":
    case "OFFERED":
      return "Offer";
    case "HIRED":
      return "Hired";
    case "REJECTED":
      return "Rejected";
    case "WITHDRAWN":
      return "Withdrawn";
    default:
      return value || "Applied";
  }
}

function formatStatusLabel(value: string | null | undefined) {
  const v = (value || "").toUpperCase();
  switch (v) {
    case "PENDING":
      return "Pending";
    case "IN_PROGRESS":
      return "In progress";
    case "ON_HOLD":
      return "On hold";
    case "HIRED":
      return "Hired";
    case "REJECTED":
      return "Rejected";
    case "ARCHIVED":
      return "Archived";
    default:
      return value || "Pending";
  }
}

export default async function CandidateDetailPage({ params }: PageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-xl font-semibold text-slate-900">Candidate</h1>
        <p className="mt-2 text-sm text-slate-600">
          No default tenant configured. Please set{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_ID
          </code>{" "}
          or{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_SLUG
          </code>
          .
        </p>
      </div>
    );
  }

  const { candidateId } = params;

  const { candidate, applications, emailKey, rawKey, mode } =
    await loadCandidateView(candidateId, tenant.id);

  const displayName: string =
    (candidate?.fullName as string | undefined) ||
    (applications[0]?.fullName as string | undefined) ||
    emailKey ||
    rawKey;

  const primaryEmail: string | null =
    (candidate?.email as string | undefined) ||
    (applications[0]?.email as string | undefined) ||
    emailKey ||
    null;

  const location: string | null =
    (candidate?.location as string | undefined) ||
    (applications[0]?.location as string | undefined) ||
    null;

  const linkedinUrl: string | null =
    (candidate?.linkedinUrl as string | undefined) ||
    (applications[0]?.linkedinUrl as string | undefined) ||
    null;

  // 🔹 Primary CV: candidate.cvUrl first, then latest application.cvUrl
  const primaryCvUrl: string | null =
    (candidate?.cvUrl as string | undefined) ||
    (applications[0]?.cvUrl as string | undefined) ||
    null;

  const latestApplication = applications[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-0">
      {/* Back + header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2">
            <Link
              href="/ats/candidates"
              className="inline-flex items-center text-[11px] text-slate-500 hover:text-[#172965]"
            >
              ← Back to candidate inbox
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {displayName}
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Candidate view keyed by{" "}
            <span className="font-medium">
              {mode === "id" ? "ID" : "email"}
            </span>{" "}
            · Tenant{" "}
            <span className="font-medium">
              {tenant.slug || tenant.name || tenant.id}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {primaryEmail && (
            <a
              href={`mailto:${primaryEmail}`}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
            >
              ✉ Email {primaryEmail}
            </a>
          )}
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-[#172965] hover:border-[#172965]"
            >
              in View LinkedIn profile
            </a>
          )}
        </div>
      </div>

      {/* Top summary (now includes CV card) */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Email
          </p>
          <p className="mt-2 break-all text-sm font-medium text-slate-900">
            {primaryEmail || "—"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Location
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {location || "Not specified"}
          </p>
        </div>

        {/* 🔹 CV / Resume card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            CV / Resume
          </p>
          {primaryCvUrl ? (
            <>
              <a
                href={primaryCvUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center rounded-full bg-[#172965] px-3 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-[#0f1c45]"
              >
                View CV file
                <span className="ml-1.5 text-[10px] opacity-80">↗</span>
              </a>
              <p className="mt-1 text-[11px] text-slate-500">
                Pulled from candidate profile or most recent application.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm font-medium text-slate-900">
              No CV file on record.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Applications
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#172965]">
            {applications.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Across this tenant (by{" "}
            {mode === "id" ? "candidate id / email" : "email"})
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Latest activity
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {latestApplication
              ? formatDate(latestApplication.createdAt as any)
              : "No activity"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {latestApplication?.job?.title
              ? `Applied for ${latestApplication.job.title}`
              : ""}
          </p>
        </div>
      </div>

      {/* Application timeline / list */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Applications for this candidate
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Combined applications matched by{" "}
              {mode === "id" ? "candidate id and email" : "email"}. Use the
              inline controls to move stages and update statuses.
            </p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
            No applications found for this candidate yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((app) => {
              const stage = (app as any).stage as string | null | undefined;
              const status = (app as any).status as string | null | undefined;
              const appCvUrl = (app as any).cvUrl as
                | string
                | null
                | undefined;

              const stageLabel = formatStageLabel(stage);
              const statusLabel = formatStatusLabel(status);

              return (
                <div
                  key={app.id}
                  className="flex flex-col gap-2 py-3 text-xs text-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {app.job?.title || "Unknown role"}
                          </span>
                          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                            {app.source || "Source unknown"}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Applied on {formatDate(app.createdAt as any)} ·{" "}
                          {app.job?.location
                            ? app.job.location
                            : "Location n/a"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: controls + badges + CV + job link */}
                  <div className="flex flex-col items-stretch gap-1 sm:items-end">
                    {/* Badges + CV + job pipeline */}
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span className={stageBadgeClass(stage)}>
                        {stageLabel}
                      </span>
                      <span className={statusBadgeClass(status)}>
                        {statusLabel}
                      </span>

                      {appCvUrl && (
                        <a
                          href={appCvUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 hover:border-[#172965] hover:text-[#172965]"
                        >
                          View CV
                        </a>
                      )}

                      <Link
                        href={`/ats/jobs/${app.jobId}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 hover:border-[#172965] hover:text-[#172965]"
                      >
                        Open job pipeline
                      </Link>
                    </div>

                    {/* Inline controls for stage + status (same endpoints as /ats/jobs/[jobId]) */}
                    <div className="mt-1 flex flex-wrap items-center gap-2 sm:justify-end">
                      {/* Stage change form */}
                      <form
                        method="POST"
                        action="/ats/applications/actions"
                        className="inline-flex items-center gap-1"
                      >
                        <input
                          type="hidden"
                          name="jobId"
                          value={app.jobId}
                        />
                        <input
                          type="hidden"
                          name="applicationId"
                          value={app.id}
                        />
                        <label className="flex items-center gap-1 text-[10px] text-slate-500">
                          <span>Stage</span>
                          <select
                            name="newStage"
                            defaultValue={stage || "APPLIED"}
                            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                          >
                            {STAGE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {formatStageLabel(opt)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="submit"
                          className="text-[10px] font-medium text-[#172965] hover:underline"
                        >
                          Move
                        </button>
                      </form>

                      {/* Status change form */}
                      <form
                        method="POST"
                        action="/ats/applications/status"
                        className="inline-flex items-center gap-1"
                      >
                        <input
                          type="hidden"
                          name="jobId"
                          value={app.jobId}
                        />
                        <input
                          type="hidden"
                          name="applicationId"
                          value={app.id}
                        />
                        <label className="flex items-center gap-1 text-[10px] text-slate-500">
                          <span>Status</span>
                          <select
                            name="newStatus"
                            defaultValue={status || "PENDING"}
                            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {formatStatusLabel(opt)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="submit"
                          className="text-[10px] font-medium text-[#172965] hover:underline"
                        >
                          Set
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
