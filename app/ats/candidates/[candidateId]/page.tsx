// app/ats/candidates/[candidateId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

interface CandidateProfilePageProps {
  params: {
    candidateId: string;
  };
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function titleCaseFromEnum(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStageName(value: string) {
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

export default async function CandidateProfilePage({
  params,
}: CandidateProfilePageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-xl font-semibold text-slate-900">
          Candidate profile not available
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

  // Tenant-scoped candidate + applications
  const candidate = await prisma.candidate.findFirst({
    where: {
      id: params.candidateId,
      applications: {
        some: {
          job: {
            tenantId: tenant.id,
          },
        },
      },
    },
    include: {
      applications: {
        where: {
          job: {
            tenantId: tenant.id,
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          job: {
            include: {
              clientCompany: true,
            },
          },
        },
      },
    },
  });

  if (!candidate) {
    notFound();
  }

  const applications = candidate.applications || [];
  const totalApplications = applications.length;

  const primaryApplication = applications[0] || null;
  const primaryStage = primaryApplication?.stage || "APPLIED";
  const primaryStatus = primaryApplication?.status || "PENDING";
  const primaryStageLabel = formatStageName(primaryStage);
  const primaryStatusLabel = titleCaseFromEnum(primaryStatus);

  const hiredCount = applications.filter(
    (app) => (app.status || "").toUpperCase() === "HIRED",
  ).length;

  const rejectedCount = applications.filter((app) =>
    ["REJECTED", "ARCHIVED"].includes((app.status || "").toUpperCase()),
  ).length;

  const inProcessCount = applications.filter((app) =>
    ["IN_PROGRESS", "ON_HOLD"].includes((app.status || "").toUpperCase()),
  ).length;

  const lastAppliedAt = primaryApplication?.createdAt || null;

  const cvUrl =
    (candidate as any).cvUrl || primaryApplication?.cvUrl || null;

  const sourcesSet = new Set<string>();
  for (const app of applications) {
    if (app.source) sourcesSet.add(app.source);
  }
  const sources = Array.from(sourcesSet);

  const name = candidate.fullName || "Unnamed candidate";
  const email = candidate.email || "";
  const location = candidate.location || "Location not set";

  const phone =
    (candidate as any).phone ||
    (candidate as any).phoneNumber ||
    "";
  const linkedin =
    (candidate as any).linkedinUrl ||
    (candidate as any).linkedin ||
    "";
  const currentCompany =
    (candidate as any).currentCompany ||
    (candidate as any).employer ||
    "";
  const currentTitle =
    (candidate as any).currentTitle ||
    (candidate as any).jobTitle ||
    "";
  const yearsExperience =
    (candidate as any).yearsExperience ||
    (candidate as any).totalExperienceYears ||
    null;
  const summary =
    (candidate as any).summary || (candidate as any).about || "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/ats/candidates"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <span className="mr-1.5">←</span>
            Back to ATS candidates
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
              {name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("") || "C"}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {name}
              </h1>
              <p className="mt-0.5 text-xs text-slate-600">
                {location}
                {currentTitle && (
                  <>
                    {" · "}
                    {currentTitle}
                  </>
                )}
                {currentCompany && (
                  <>
                    {" @ "}
                    {currentCompany}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Primary status */}
          <div className="flex flex-wrap justify-end gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">
              {primaryStageLabel}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium ${applicationStatusBadgeClass(
                primaryStatus,
              )}`}
            >
              {primaryStatusLabel}
            </span>
          </div>

          {/* Summary metrics */}
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
        </div>
      </div>

      {/* Profile + history */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)] md:gap-6">
        {/* Left column: profile */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Candidate profile
          </h2>

          <dl className="grid grid-cols-1 gap-y-3 text-xs text-slate-700">
            <div>
              <dt className="text-[11px] font-medium text-slate-500">
                Email
              </dt>
              <dd className="mt-0.5">
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="text-[#172965] hover:underline"
                  >
                    {email}
                  </a>
                ) : (
                  <span className="text-slate-400">Not set</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium text-slate-500">
                Phone
              </dt>
              <dd className="mt-0.5">
                {phone ? (
                  <span>{phone}</span>
                ) : (
                  <span className="text-slate-400">Not set</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium text-slate-500">
                Location
              </dt>
              <dd className="mt-0.5">
                {location || (
                  <span className="text-slate-400">Not set</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium text-slate-500">
                Current role
              </dt>
              <dd className="mt-0.5">
                {currentTitle || currentCompany ? (
                  <span>
                    {currentTitle}
                    {currentCompany && (
                      <>
                        {" · "}
                        {currentCompany}
                      </>
                    )}
                  </span>
                ) : (
                  <span className="text-slate-400">Not specified</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium text-slate-500">
                Experience
              </dt>
              <dd className="mt-0.5">
                {yearsExperience != null ? (
                  <span>{yearsExperience} years</span>
                ) : (
                  <span className="text-slate-400">Not specified</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium text-slate-500">
                LinkedIn
              </dt>
              <dd className="mt-0.5">
                {linkedin ? (
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#172965] hover:underline"
                  >
                    View profile ↗
                  </a>
                ) : (
                  <span className="text-slate-400">Not provided</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-[11px] font-medium text-slate-500">
                CV / Resume
              </dt>
              <dd className="mt-0.5">
                {cvUrl ? (
                  <a
                    href={cvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#172965] hover:underline"
                  >
                    View CV ↗
                  </a>
                ) : (
                  <span className="text-slate-400">No CV on file</span>
                )}
              </dd>
            </div>

            {sources.length > 0 && (
              <div>
                <dt className="text-[11px] font-medium text-slate-500">
                  Sources
                </dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {sources.map((src) => (
                    <span
                      key={src}
                      className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                    >
                      {src}
                    </span>
                  ))}
                </dd>
              </div>
            )}

            {lastAppliedAt && (
              <div>
                <dt className="text-[11px] font-medium text-slate-500">
                  Last applied
                </dt>
                <dd className="mt-0.5">
                  {formatDate(lastAppliedAt)}
                </dd>
              </div>
            )}
          </dl>

          {summary && (
            <div className="pt-2">
              <h3 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Summary / notes
              </h3>
              <p className="mt-1 whitespace-pre-line text-xs text-slate-800">
                {summary}
              </p>
            </div>
          )}
        </section>

        {/* Right column: application history */}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Application history
            </h2>
            <p className="text-[11px] text-slate-500">
              {totalApplications === 0
                ? "No applications recorded yet."
                : `${totalApplications} ${
                    totalApplications === 1
                      ? "application"
                      : "applications"
                  }`}
            </p>
          </div>

          {totalApplications === 0 ? (
            <p className="text-[11px] text-slate-500">
              Once this candidate applies or is added to roles, each
              application will appear here with stage, status and timestamps.
            </p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const job = app.job;
                const clientName =
                  job?.clientCompany?.name || "Resourcin client";
                const stageLabel = formatStageName(
                  app.stage || "APPLIED",
                );
                const statusLabel = titleCaseFromEnum(
                  app.status || "PENDING",
                );
                const createdLabel = formatDate(app.createdAt);
                const sourceLabel = app.source || "—";

                const compLabel =
                  app.currentGrossAnnual && app.grossAnnualExpectation
                    ? `${app.currentGrossAnnual} → ${app.grossAnnualExpectation}`
                    : app.currentGrossAnnual ||
                      app.grossAnnualExpectation ||
                      "—";

                const noticeLabel = app.noticePeriod || "—";

                return (
                  <div
                    key={app.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-700"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <Link
                            href={`/ats/jobs/${job?.id}`}
                            className="truncate text-xs font-semibold text-slate-900 hover:text-[#172965] hover:underline"
                          >
                            {job?.title || "Untitled role"}
                          </Link>
                          <span className="text-slate-400">·</span>
                          <span className="text-[11px] text-slate-600">
                            {clientName}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                          <span>Applied {createdLabel}</span>
                          <span className="text-slate-300">•</span>
                          <span>Source: {sourceLabel}</span>
                          {compLabel !== "—" && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>
                                Comp (current / expected): {compLabel}
                              </span>
                            </>
                          )}
                          {noticeLabel !== "—" && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>Notice: {noticeLabel}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="flex flex-wrap justify-end gap-1">
                          <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-slate-700">
                            {stageLabel}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${applicationStatusBadgeClass(
                              app.status,
                            )}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        {job?.id && (
                          <Link
                            href={`/ats/jobs/${job.id}`}
                            className="text-[10px] font-medium text-[#172965] hover:underline"
                          >
                            View job pipeline
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
