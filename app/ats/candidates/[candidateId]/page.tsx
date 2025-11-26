// app/ats/candidates/[candidateId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidate profile | ThinkATS",
  description:
    "Single candidate view across roles, stages and applications in ThinkATS.",
};

// ───────────────────────────────
// Utilities
// ───────────────────────────────

function looksLikeUuid(value: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value,
  );
}

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

function humanLabel(value: string | null | undefined, fallback: string) {
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
    return "rounded-full bg-[#FFC000]/10 px-2 py-0.5 text-[10px] font-medium text-[#7A5600]";
  }
  if (v === "HIRED") {
    return "rounded-full bg-[#64C247]/10 px-2 py-0.5 text-[10px] font-medium text-[#306B34]";
  }
  if (v === "REJECTED") {
    return "rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700";
  }
  if (v === "SCREENING" || v === "INTERVIEW" || v === "INTERVIEWING") {
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
  return "rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600";
}

// ───────────────────────────────
// Data loader with safe lookups
// ───────────────────────────────

async function getCandidateRecord(candidateKey: string) {
  const tenant = await getResourcinTenant();
  if (!tenant) return null;

  if (!candidateKey || candidateKey === "null") {
    return null;
  }

  // 1) Try Candidate by (id if UUID) OR email, scoped to tenant
  const candidateWhere: any = {
    tenantId: tenant.id,
  };
  const orClauses: any[] = [];

  if (looksLikeUuid(candidateKey)) {
    orClauses.push({ id: candidateKey });
  }
  // Always allow email-based lookup – this matches your `/ats/candidates/[email]` case
  orClauses.push({ email: candidateKey });

  if (orClauses.length > 0) {
    candidateWhere.OR = orClauses;
  }

  let candidate: any = await prisma.candidate.findFirst({
    where: candidateWhere,
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

  if (candidate) {
    return { tenant, candidate };
  }

  // 2) Fallback: legacy data where we may only have JobApplication rows
  //    (e.g. key is an email string, but no Candidate exists yet).

  const appWhere: any = {
    job: { tenantId: tenant.id },
  };

  const appOr: any[] = [];

  // If the key is a UUID, it might actually be a JobApplication.id
  if (looksLikeUuid(candidateKey)) {
    appOr.push({ id: candidateKey });
  }

  // If it looks like an email, search by application email
  if (candidateKey.includes("@")) {
    appOr.push({ email: candidateKey });
  }

  if (appOr.length > 0) {
    appWhere.OR = appOr;
  } else {
    // Last-ditch: treat it as a name match
    appWhere.fullName = candidateKey;
  }

  const apps = await prisma.jobApplication.findMany({
    where: appWhere,
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        include: {
          clientCompany: true,
        },
      },
    },
  });

  if (!apps.length) return null;

  const first = apps[0];

  const syntheticCandidate: any = {
    // Make sure we always have some stable ID for the UI
    id: `legacy:${candidateKey}`,
    tenantId: tenant.id,
    fullName: (first as any).fullName ?? null,
    email: (first as any).email ?? null,
    linkedinUrl: (first as any).linkedinUrl ?? null,
    cvUrl: (first as any).cvUrl ?? null,
    createdAt: first.createdAt,
    applications: apps,
  };

  return { tenant, candidate: syntheticCandidate };
}

// ───────────────────────────────
// Page
// ───────────────────────────────

export default async function CandidateDetailPage({
  params,
}: {
  params: { candidateId: string };
}) {
  const { candidateId } = params;

  const data = await getCandidateRecord(decodeURIComponent(candidateId));

  if (!data) {
    notFound();
  }

  const { tenant, candidate } = data as any;

  const displayName =
    candidate.fullName || candidate.email || candidate.id;

  const primaryEmail = candidate.email || "";
  const createdAtLabel = formatDate(candidate.createdAt as Date);

  const applications = (candidate.applications ?? []) as any[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-0">
      {/* Header / breadcrumb */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/ats/candidates"
            className="inline-flex items-center text-[11px] font-medium text-slate-500 hover:text-[#172965]"
          >
            <span className="mr-1.5">←</span>
            Back to candidates
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            {displayName}
          </h1>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            {primaryEmail && (
              <>
                <a
                  href={`mailto:${primaryEmail}`}
                  className="text-[#172965] hover:underline"
                >
                  {primaryEmail}
                </a>
                <span className="text-slate-300">•</span>
              </>
            )}
            <span>
              Candidate in{" "}
              <span className="font-medium">
                {tenant.name || tenant.slug || "Resourcin"}
              </span>
            </span>
            {createdAtLabel && (
              <>
                <span className="text-slate-300">•</span>
                <span>Added {createdAtLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Quick meta */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-right text-[11px] text-slate-600">
          <div className="font-mono text-[10px] text-slate-400">
            ID: {candidate.id}
          </div>
          <div className="mt-1 text-[11px]">
            {applications.length}{" "}
            {applications.length === 1
              ? "application"
              : "applications"}
          </div>
        </div>
      </div>

      {/* Layout: left = profile summary, right = applications */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
        {/* Left: basic profile */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Profile
            </h2>
            <dl className="mt-3 space-y-2 text-[11px] text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Name</dt>
                <dd className="text-right font-medium text-slate-900">
                  {candidate.fullName || "Not captured"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Email</dt>
                <dd className="text-right">
                  {primaryEmail ? (
                    <a
                      href={`mailto:${primaryEmail}`}
                      className="font-medium text-[#172965] hover:underline"
                    >
                      {primaryEmail}
                    </a>
                  ) : (
                    <span className="text-slate-400">
                      Not captured
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            {candidate.linkedinUrl && (
              <div className="mt-3">
                <a
                  href={candidate.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-[#172965] hover:bg-slate-100"
                >
                  View LinkedIn profile
                </a>
              </div>
            )}

            {candidate.cvUrl && (
              <div className="mt-2">
                <a
                  href={candidate.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-[#172965] hover:text-[#172965]"
                >
                  View uploaded CV
                </a>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-[11px] text-slate-600 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-900">
              How this view works
            </h3>
            <p className="mt-2">
              This page aggregates all applications linked to this
              candidate across roles in{" "}
              <span className="font-medium">
                {tenant.name || tenant.slug || "Resourcin"}
              </span>
              . It falls back gracefully for older records that only
              exist as job applications.
            </p>
          </div>
        </div>

        {/* Right: applications table */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Applications
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Most recent first. Stages and statuses reflect your
                ThinkATS configuration.
              </p>
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
              No applications are linked to this candidate yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-1 text-[11px]">
                <thead className="text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="rounded-l-lg bg-slate-50 px-3 py-2 text-left font-medium">
                      Role
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Client
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Stage
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Status
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Source
                    </th>
                    <th className="rounded-r-lg bg-slate-50 px-3 py-2 text-right font-medium">
                      Applied
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const stage = (app as any).stage as
                      | string
                      | null
                      | undefined;
                    const status = (app as any).status as
                      | string
                      | null
                      | undefined;
                    const stageLabel = humanLabel(stage, "Applied");
                    const statusLabel = humanLabel(
                      status,
                      "Pending",
                    );

                    return (
                      <tr
                        key={app.id}
                        className="rounded-lg bg-white text-slate-700 shadow-sm"
                      >
                        <td className="rounded-l-lg px-3 py-2">
                          <div className="flex flex-col">
                            <Link
                              href={`/ats/jobs/${app.jobId}`}
                              className="text-[11px] font-medium text-slate-900 hover:text-[#172965]"
                            >
                              {app.job?.title || "Unknown role"}
                            </Link>
                            <span className="text-[10px] text-slate-400">
                              Application ID: {app.id}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {app.job?.clientCompany?.name ? (
                            <span className="text-[11px] text-slate-800">
                              {app.job.clientCompany.name}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Resourcin client
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className={stageBadgeClass(stage)}>
                            {stageLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={statusBadgeClass(status)}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {app.source || (
                            <span className="text-slate-400">
                              Unknown
                            </span>
                          )}
                        </td>
                        <td className="rounded-r-lg px-3 py-2 text-right text-slate-500">
                          {formatDate(app.createdAt as Date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
