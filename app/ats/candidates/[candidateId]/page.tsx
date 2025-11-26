// app/ats/candidates/[candidateId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

function normalize(value: string | null | undefined) {
  if (!value) return "";
  return String(value).toUpperCase();
}

function stageBadgeClass(stage: string | null | undefined) {
  const v = normalize(stage);
  if (v === "OFFER") {
    return "rounded-full bg-[#FFC000]/10 px-2 py-0.5 text-[10px] font-medium text-[#7A5600]";
  }
  if (v === "HIRED") {
    return "rounded-full bg-[#64C247]/10 px-2 py-0.5 text-[10px] font-medium text-[#306B34]";
  }
  if (v === "REJECTED") {
    return "rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700";
  }
  if (v === "INTERVIEW" || v === "INTERVIEWING" || v === "SCREENING") {
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

async function getCandidateWithApplications(candidateId: string) {
  return prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      applications: {
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
}

export default async function CandidateDetailPage({
  params,
}: {
  params: { candidateId: string };
}) {
  const { candidateId } = params;

  const candidate = await getCandidateWithApplications(candidateId);
  if (!candidate) {
    notFound();
  }

  const totalApplications = candidate.applications.length;
  const firstSeen =
    candidate.applications.length > 0
      ? formatDate(
          candidate.applications[
            candidate.applications.length - 1
          ].createdAt as any,
        )
      : formatDate(candidate.createdAt as any);

  const lastActive =
    candidate.applications.length > 0
      ? formatDate(candidate.applications[0].createdAt as any)
      : formatDate(candidate.createdAt as any);

  const primaryEmail = candidate.email;
  const primaryPhone = candidate.phone;
  const location = candidate.location;
  const currentTitle = candidate.currentTitle;
  const currentCompany = candidate.currentCompany;
  const source = candidate.source;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header: back link + identity + quick actions */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/ats/candidates"
            className="inline-flex items-center text-[11px] font-medium text-slate-500 hover:text-slate-800"
          >
            <span className="mr-1.5">←</span>
            Back to candidate inbox
          </Link>

          <div className="mt-1 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#172965]/10 text-xs font-semibold text-[#172965]">
              {candidate.fullName
                ?.split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "CA"}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {candidate.fullName || "Unnamed candidate"}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                {primaryEmail && (
                  <a
                    href={`mailto:${primaryEmail}`}
                    className="hover:text-[#172965]"
                  >
                    {primaryEmail}
                  </a>
                )}
                {primaryPhone && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{primaryPhone}</span>
                  </>
                )}
                {location && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{location}</span>
                  </>
                )}
              </div>
              {(currentTitle || currentCompany) && (
                <p className="mt-1 text-[11px] text-slate-500">
                  {currentTitle && <span>{currentTitle}</span>}
                  {currentTitle && currentCompany && (
                    <span className="mx-1">•</span>
                  )}
                  {currentCompany && (
                    <span className="font-medium text-slate-700">
                      {currentCompany}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {candidate.cvUrl && (
              <a
                href={candidate.cvUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
              >
                View CV
              </a>
            )}

            {primaryEmail && (
              <a
                href={`mailto:${primaryEmail}`}
                className="inline-flex items-center rounded-md bg-[#172965] px-3 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-[#111d4f]"
              >
                Email candidate
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {candidate.linkedinUrl && (
              <a
                href={candidate.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
              >
                LinkedIn profile
              </a>
            )}
            {source && (
              <span className="inline-flex items-center rounded-full bg-[#FFC000]/10 px-3 py-1.5 text-[10px] font-medium text-[#7A5600]">
                Source: {source}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-sm sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              Total applications
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {totalApplications}
            </p>
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#172965]/10 text-[11px] font-semibold text-[#172965]">
            ATS
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              First seen
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {firstSeen || "—"}
            </p>
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#64C247]/10 text-[11px] font-semibold text-[#306B34]">
            CRM
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <div>
            <p className="text-[11px] font-medium text-slate-500">
              Last activity
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {lastActive || "—"}
            </p>
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FFC000]/10 text-[11px] font-semibold text-[#7A5600]">
            Activity
          </span>
        </div>
      </div>

      {/* Layout: left – profile & notes (future), right – application history */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
        {/* Left column – basic profile (room to grow into notes, tags, etc.) */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Candidate profile
            </h2>

            <dl className="mt-3 space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-[11px] text-slate-500">Name</dt>
                <dd className="text-[11px] font-medium text-slate-900">
                  {candidate.fullName || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[11px] text-slate-500">Email</dt>
                <dd className="text-[11px] text-slate-900">
                  {primaryEmail || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[11px] text-slate-500">Phone</dt>
                <dd className="text-[11px] text-slate-900">
                  {primaryPhone || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[11px] text-slate-500">Location</dt>
                <dd className="text-[11px] text-slate-900">
                  {location || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[11px] text-slate-500">
                  Current role
                </dt>
                <dd className="text-[11px] text-slate-900">
                  {currentTitle || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[11px] text-slate-500">
                  Current company
                </dt>
                <dd className="text-[11px] text-slate-900">
                  {currentCompany || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[11px] text-slate-500">Source</dt>
                <dd className="text-[11px] text-slate-900">
                  {source || "—"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Placeholder for future notes / tags / activity log */}
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-[11px] text-slate-500">
            This area can grow into{" "}
            <span className="font-medium text-slate-700">
              notes, tags, and activity log
            </span>{" "}
            for ThinkATS — including @mentions, internal comments, and
            email history.
          </div>
        </div>

        {/* Right column – applications timeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Applications
            </h2>
            {totalApplications > 0 && (
              <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600">
                {totalApplications}{" "}
                {totalApplications === 1 ? "application" : "applications"}
              </span>
            )}
          </div>

          {candidate.applications.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[11px] text-slate-400">
              No applications on record yet for this candidate.
            </div>
          ) : (
            <div className="space-y-3">
              {candidate.applications.map((app) => {
                const job = app.job as any | null;
                const jobTitle = job?.title || "Untitled role";
                const clientName =
                  job?.clientCompany?.name || "Resourcin client";
                const stage = app.stage as string | null | undefined;
                const status = app.status as string | null | undefined;

                const stageLabel = prettyLabel(stage, "Applied");
                const statusLabel = prettyLabel(status, "Pending");

                const appliedDate = formatDate(app.createdAt as any);
                const publicJobHref = job
                  ? `/jobs/${job.slug ?? job.id}`
                  : null;

                return (
                  <div
                    key={app.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/ats/jobs/${app.jobId}`}
                          className="block truncate text-[13px] font-semibold text-slate-900 hover:text-[#172965]"
                        >
                          {jobTitle}
                        </Link>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {clientName}
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
                      {appliedDate && (
                        <span>Applied {appliedDate}</span>
                      )}
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

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {app.cvUrl && (
                        <a
                          href={app.cvUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-[#172965] shadow-sm hover:bg-slate-50"
                        >
                          View CV
                        </a>
                      )}

                      <Link
                        href={`/ats/jobs/${app.jobId}`}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:border-[#172965] hover:text-[#172965]"
                      >
                        Open job pipeline
                      </Link>

                      {publicJobHref && (
                        <Link
                          href={publicJobHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:border-[#172965] hover:text-[#172965]"
                        >
                          View public role
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
