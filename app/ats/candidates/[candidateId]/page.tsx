// app/ats/candidates/[candidateId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidate profile | ThinkATS | Resourcin",
  description:
    "Unified view of a candidate across all job applications in ThinkATS.",
};

// -----------------------------
// Utilities
// -----------------------------
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

function formatLabel(value: string | null | undefined, fallback: string) {
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
  // Default
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

// -----------------------------
// Page loader
// -----------------------------
export default async function CandidateDetailPage({
  params,
}: {
  params: { candidateId: string };
}) {
  const rawId = params.candidateId;
  const isUuid = looksLikeUuid(rawId);

  const tenant = await getResourcinTenant();
  if (!tenant) {
    throw new Error("No default tenant configured for candidate view.");
  }

  // 1) Try to resolve a Candidate row (by UUID or email)
  let candidate =
    (isUuid
      ? await prisma.candidate.findFirst({
          where: {
            tenantId: tenant.id,
            id: rawId,
          },
        })
      : await prisma.candidate.findFirst({
          where: {
            tenantId: tenant.id,
            email: rawId,
          },
        })) || null;

  // 2) Load all applications within this tenant that belong to this candidate
  //    or match the identifier (UUID/email) if the Candidate row is missing.
  const appWhere: any = {
    job: {
      tenantId: tenant.id,
    },
  };

  if (candidate) {
    appWhere.candidateId = candidate.id;
  } else {
    if (isUuid) {
      // Legacy case: candidateId stored directly on JobApplication
      appWhere.candidateId = rawId;
    } else {
      // Email-based fallback
      appWhere.email = rawId;
    }
  }

  const applications = await prisma.jobApplication.findMany({
    where: appWhere,
    orderBy: { createdAt: "desc" },
    include: {
      job: true,
      candidate: true,
    },
  });

  // If we truly have nothing, treat as 404
  if (!candidate && applications.length === 0) {
    notFound();
  }

  const firstApp = applications[0] || null;

  const displayName =
    candidate?.fullName ||
    firstApp?.candidate?.fullName ||
    firstApp?.fullName ||
    firstApp?.email ||
    "Unknown candidate";

  const email =
    candidate?.email ||
    firstApp?.candidate?.email ||
    firstApp?.email ||
    "";

  const location =
    (firstApp as any)?.location ||
    (firstApp?.candidate as any)?.location ||
    null;

  const linkedinUrl =
    (candidate as any)?.linkedinUrl ||
    (firstApp as any)?.linkedinUrl ||
    (firstApp?.candidate as any)?.linkedinUrl ||
    null;

  const cvUrl =
    (candidate as any)?.cvUrl ||
    (firstApp as any)?.cvUrl ||
    (firstApp?.candidate as any)?.cvUrl ||
    null;

  const firstSeen =
    candidate?.createdAt || firstApp?.createdAt || null;
  const lastActivity =
    applications.length > 0 ? applications[0].createdAt : firstSeen;

  const uniqueJobIds = new Set(
    applications.map((app) => app.jobId).filter(Boolean),
  );
  const totalApplications = applications.length;
  const totalRoles = uniqueJobIds.size;

  // Stage breakdown (per candidate across all apps)
  const stageCounts = applications.reduce<Record<string, number>>(
    (acc, app) => {
      const key = (app.stage || "APPLIED").toString().toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-0">
      {/* Back + header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/ats/candidates"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <span className="mr-1.5">←</span>
            Back to candidates
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-slate-900">
            {displayName}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 font-medium text-[#172965] hover:bg-slate-100"
              >
                {email}
              </a>
            )}
            {location && (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
                {location}
              </span>
            )}
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[#172965] hover:bg-slate-100"
              >
                LinkedIn profile
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {cvUrl && (
            <a
              href={cvUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[#172965] px-3 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-[#111d4f]"
            >
              View latest CV
            </a>
          )}
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
            Tenant:{" "}
            <span className="font-medium">
              {tenant.slug || tenant.name || "resourcin"}
            </span>
          </div>
        </div>
      </div>

      {/* Top stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Total applications
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#172965]">
            {totalApplications}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Unique roles
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {totalRoles}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            First seen
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {firstSeen ? formatDate(firstSeen) : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Last activity
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {lastActivity ? formatDate(lastActivity) : "—"}
          </p>
        </div>
      </div>

      {/* Main layout: Applications + side summary */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        {/* Applications table */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Applications
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                All roles this candidate has engaged with under this tenant.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
              {totalApplications} application
              {totalApplications === 1 ? "" : "s"}
            </span>
          </div>

          {applications.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
              No applications recorded for this candidate yet.
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
                      Stage / Status
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Source
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Applied
                    </th>
                    <th className="rounded-r-lg bg-slate-50 px-3 py-2 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const stage = app.stage as string | null | undefined;
                    const status = (app as any).status as
                      | string
                      | null
                      | undefined;

                    const stageLabel = formatLabel(stage, "Applied");
                    const statusLabel = formatLabel(status, "Pending");

                    return (
                      <tr
                        key={app.id}
                        className="rounded-lg bg-white text-slate-700 shadow-sm"
                      >
                        <td className="rounded-l-lg px-3 py-2">
                          <div className="flex flex-col">
                            <Link
                              href={`/ats/jobs/${app.jobId}`}
                              className="text-xs font-medium text-slate-900 hover:text-[#172965]"
                            >
                              {app.job?.title || "Unknown role"}
                            </Link>
                            {app.job?.location && (
                              <span className="text-[10px] text-slate-400">
                                {app.job.location}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={stageBadgeClass(stage)}>
                              {stageLabel}
                            </span>
                            <span className={statusBadgeClass(status)}>
                              {statusLabel}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <span className="text-[11px] text-slate-600">
                            {app.source || "Unknown"}
                          </span>
                        </td>

                        <td className="px-3 py-2">
                          <span className="text-[11px] text-slate-600">
                            {formatDate(app.createdAt)}
                          </span>
                        </td>

                        <td className="rounded-r-lg px-3 py-2 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {app.cvUrl && (
                              <a
                                href={app.cvUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-[#172965] hover:bg-slate-100"
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side summary: stage breakdown + notes on how to use */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-900">
              Stage footprint
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Where this candidate currently sits across all tracked roles.
            </p>

            {totalApplications === 0 ? (
              <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-[11px] text-slate-500">
                No stage data yet. Once this candidate applies for roles, their
                stage mix will show here.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {Object.entries(stageCounts).map(
                  ([stageKey, count]) => {
                    const label = formatLabel(stageKey, "Applied");
                    return (
                      <div
                        key={stageKey}
                        className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-[11px]"
                      >
                        <span className="text-slate-700">
                          {label}
                        </span>
                        <span className="text-xs font-semibold text-slate-900">
                          {count}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-[11px] text-slate-600 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-900">
              How to use this view
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>
                Scan all{" "}
                <span className="font-medium">
                  roles and stages
                </span>{" "}
                this person has touched before nudging a client.
              </li>
              <li>
                Use{" "}
                <span className="font-medium">stage footprint</span>{" "}
                to see if they’re mostly in late-stage or early-stage
                funnels.
              </li>
              <li>
                Jump straight into{" "}
                <span className="font-medium">
                  job pipelines
                </span>{" "}
                from the actions column to move them forward.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
