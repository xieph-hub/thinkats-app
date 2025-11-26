// app/ats/candidates/[candidateId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Candidate | Resourcin",
  description:
    "Single-candidate profile view showing contact details, history and applications across ThinkATS.",
};

type PageParams = {
  candidateId: string;
};

function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: Date | null | undefined) {
  if (!date) return "";
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ✅ Only treat the param as a UUID if it actually looks like one
function looksLikeUuid(value: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value,
  );
}

// Simple stage config to mirror the rest of ThinkATS
const STAGES = [
  {
    key: "APPLIED",
    label: "Applied",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  },
  {
    key: "SCREENING",
    label: "Screening",
    badgeClass:
      "bg-[#FFC000]/10 text-[#8a6000] border-[#FFC000]/30",
  },
  {
    key: "INTERVIEW",
    label: "Interviewing",
    badgeClass:
      "bg-[#172965]/10 text-[#172965] border-[#172965]/30",
  },
  {
    key: "OFFER",
    label: "Offer",
    badgeClass:
      "bg-[#64C247]/10 text-[#306B34] border-[#64C247]/40",
  },
  {
    key: "HIRED",
    label: "Hired",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    key: "REJECTED",
    label: "Rejected",
    badgeClass: "bg-red-50 text-red-700 border-red-100",
  },
];

const STAGE_MAP = new Map<string, (typeof STAGES)[number]>(
  STAGES.map((s) => [s.key, s]),
);

export default async function AtsCandidateDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const { candidateId } = params;

  // -----------------------------
  // 1. Load candidate by ID (UUID) or fallback
  // -----------------------------
  let candidate =
    looksLikeUuid(candidateId)
      ? await prisma.candidate.findUnique({
          where: { id: candidateId },
        })
      : await prisma.candidate.findFirst({
          where: {
            // Fallback: let non-UUID URLs resolve via email (or other string fields later)
            email: candidateId,
          },
        });

  if (!candidate) {
    notFound();
  }

  // Use `any` locally so we can gracefully read optional / non-typed fields
  const c = candidate as any;

  const primaryLabel: string =
    (c.fullName as string | undefined) ||
    (c.name as string | undefined) ||
    (c.firstName && c.lastName
      ? `${c.firstName} ${c.lastName}`
      : undefined) ||
    (c.email as string | undefined) ||
    candidate.id;

  const email: string | null =
    (c.email as string | undefined) || null;
  const phone: string | null =
    (c.phone as string | undefined) || null;
  const location: string | null =
    (c.location as string | undefined) || null;
  const headline: string | null =
    (c.headline as string | undefined) || null;
  const linkedinUrl: string | null =
    (c.linkedinUrl as string | undefined) || null;
  const currentCompany: string | null =
    (c.currentCompany as string | undefined) || null;

  const createdAt: Date | null =
    (c.createdAt as Date | undefined) ?? null;
  const updatedAt: Date | null =
    (c.updatedAt as Date | undefined) ?? null;

  // -----------------------------
  // 2. Load all applications for this candidate
  // -----------------------------
  const applications = await prisma.jobApplication.findMany({
    where: { candidateId: candidate.id },
    select: {
      id: true,
      jobId: true,
      createdAt: true,
      stage: true,
      source: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const jobIds = Array.from(
    new Set(applications.map((a) => a.jobId)),
  );

  const jobs =
    jobIds.length === 0
      ? []
      : await prisma.job.findMany({
          where: { id: { in: jobIds } },
          select: {
            id: true,
            title: true,
            status: true,
            slug: true,
            createdAt: true,
            location: true,
            employmentType: true,
          },
        });

  const jobsById = new Map<string, (typeof jobs)[number]>();
  jobs.forEach((job) => jobsById.set(job.id, job));

  const hasApplications = applications.length > 0;

  // Simple heuristics for first/last touch
  const lastActivity =
    applications.length > 0
      ? applications[0].createdAt
      : createdAt;
  const firstSeen =
    applications.length > 0
      ? applications[applications.length - 1].createdAt
      : createdAt;

  // Concise list of sources for sidebar
  const uniqueSources = Array.from(
    new Set(
      applications
        .map((a) => (a.source || "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-0">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/ats/candidates"
            className="inline-flex items-center text-[11px] font-medium text-slate-500 hover:text-slate-800"
          >
            <span className="mr-1.5">←</span>
            Back to candidate inbox
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
            {primaryLabel}
          </h1>

          {headline && (
            <p className="mt-1 text-xs text-slate-600">
              {headline}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 hover:border-[#172965] hover:text-[#172965]"
              >
                ✉ {email}
              </a>
            )}
            {phone && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                ☎ {phone}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                📍 {location}
              </span>
            )}
            {currentCompany && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                💼 {currentCompany}
              </span>
            )}
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 hover:border-[#172965] hover:text-[#172965]"
              >
                in LinkedIn profile
              </a>
            )}
          </div>
        </div>

        {/* Quick meta */}
        <div className="flex flex-col items-end gap-1 text-[11px] text-slate-500">
          <span className="inline-flex items-center rounded-full bg-[#172965]/5 px-2 py-1 font-medium text-[#172965]">
            ThinkATS · Candidate
          </span>
          {createdAt && (
            <p>
              Added:{" "}
              <span className="font-medium text-slate-800">
                {formatDate(createdAt)}
              </span>
            </p>
          )}
          {lastActivity && (
            <p>
              Last activity:{" "}
              <span className="font-medium text-slate-800">
                {formatDateTime(lastActivity)}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Main layout: left profile, right application history */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
        {/* Candidate profile sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Profile snapshot
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              High-level view of who this person is and how they
              entered your funnel.
            </p>

            <dl className="mt-3 space-y-2 text-[11px] text-slate-600">
              <div className="flex items-start justify-between gap-2">
                <dt className="text-slate-500">
                  Candidate ID
                </dt>
                <dd className="max-w-[220px] truncate text-right font-mono text-[10px] text-slate-700">
                  {candidate.id}
                </dd>
              </div>

              {email && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="max-w-[220px] truncate text-right">
                    {email}
                  </dd>
                </div>
              )}

              {phone && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="max-w-[220px] truncate text-right">
                    {phone}
                  </dd>
                </div>
              )}

              {location && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500">
                    Location
                  </dt>
                  <dd className="max-w-[220px] truncate text-right">
                    {location}
                  </dd>
                </div>
              )}

              {currentCompany && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500">
                    Current company
                  </dt>
                  <dd className="max-w-[220px] truncate text-right">
                    {currentCompany}
                  </dd>
                </div>
              )}

              {firstSeen && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500">
                    First seen in ATS
                  </dt>
                  <dd className="max-w-[220px] truncate text-right">
                    {formatDate(firstSeen)}
                  </dd>
                </div>
              )}

              {updatedAt && (
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-slate-500">
                    Last updated
                  </dt>
                  <dd className="max-w-[220px] truncate text-right">
                    {formatDate(updatedAt)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-[11px] text-slate-600 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-900">
              Sources & signals
            </h3>
            {uniqueSources.length === 0 ? (
              <p className="mt-2 text-[11px] text-slate-500">
                No explicit sources logged yet for this candidate. As
                you capture source on apply flows, they’ll show up
                here.
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {uniqueSources.map((s) => (
                  <li
                    key={s}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px]"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-[10px] text-slate-400">
              Future iterations can add AI-parsed skills, seniority,
              salary bands and notes here. For now this keeps the
              candidate context tight and readable.
            </p>
          </div>
        </aside>

        {/* Application history */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Application history
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                All roles this person has engaged with, plus current
                stage and source.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-[#64C247]/10 px-2 py-1 text-[10px] font-medium text-[#306B34]">
              {applications.length}{" "}
              {applications.length === 1
                ? "application"
                : "applications"}
            </span>
          </div>

          {!hasApplications ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
              No applications yet linked to this candidate. Once they
              apply to a role via ThinkATS or are added manually,
              their history will appear here.
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
                      Stage
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Source
                    </th>
                    <th className="bg-slate-50 px-3 py-2 text-left font-medium">
                      Applied
                    </th>
                    <th className="rounded-r-lg bg-slate-50 px-3 py-2 text-right font-medium">
                      Links
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const job = jobsById.get(app.jobId);
                    const stageKey = (app.stage || "").toString();
                    const stageConfig =
                      STAGE_MAP.get(stageKey) ?? null;

                    const stageLabel =
                      stageConfig?.label || stageKey || "Unknown";

                    const stageClass =
                      stageConfig?.badgeClass ||
                      "bg-slate-50 text-slate-700 border-slate-200";

                    const sourceLabel =
                      (app.source || "").trim() || "—";

                    const appliedDate = formatDate(app.createdAt);

                    return (
                      <tr
                        key={app.id}
                        className="rounded-lg bg-white text-slate-700 shadow-sm"
                      >
                        <td className="rounded-l-lg px-3 py-2 align-top">
                          <div className="flex flex-col">
                            <Link
                              href={
                                job
                                  ? `/ats/jobs/${job.id}`
                                  : "#"
                              }
                              className="max-w-xs truncate text-[11px] font-medium text-slate-900 hover:text-[#172965] hover:underline"
                            >
                              {job?.title ??
                                "Job no longer available"}
                            </Link>
                            <div className="mt-0.5 flex flex-wrap gap-1 text-[10px] text-slate-500">
                              {job?.location && (
                                <span>{job.location}</span>
                              )}
                              {job?.employmentType && (
                                <>
                                  {job.location && (
                                    <span className="text-slate-300">
                                      ·
                                    </span>
                                  )}
                                  <span>
                                    {job.employmentType}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${stageClass}`}
                          >
                            {stageLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top text-[11px] text-slate-600">
                          {sourceLabel}
                        </td>
                        <td className="px-3 py-2 align-top text-[11px] text-slate-600">
                          {appliedDate || "—"}
                        </td>
                        <td className="rounded-r-lg px-3 py-2 align-top text-right text-[10px]">
                          <div className="flex flex-col items-end gap-1">
                            {job && (
                              <Link
                                href={`/ats/jobs/${job.id}`}
                                className="text-[#172965] hover:underline"
                              >
                                Open pipeline
                              </Link>
                            )}
                            {job?.slug && (
                              <Link
                                href={`/jobs/${job.slug}`}
                                className="text-slate-500 hover:underline"
                                target="_blank"
                              >
                                Public role
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
