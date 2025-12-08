// app/ats/candidates/[candidateId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { requireTenantMembership } from "@/lib/requireTenantMembership";
import ApplicationInterviewDrawer from "@/components/ats/candidates/ApplicationInterviewDrawer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Candidate profile",
  description: "Full profile and pipeline view for this candidate.",
};

type PageProps = {
  params: { candidateId: string };
  searchParams?: { tenantId?: string };
};

function scoreChipColor(score?: number | null) {
  if (score == null) return "bg-slate-100 text-slate-600";
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 65) return "bg-sky-100 text-sky-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function tierChipColor(tier?: string | null) {
  if (!tier) return "bg-slate-100 text-slate-600";
  const upper = tier.toUpperCase();
  if (upper === "A") return "bg-emerald-100 text-emerald-700";
  if (upper === "B") return "bg-sky-100 text-sky-700";
  if (upper === "C") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function formatDateTime(d: Date | null | undefined) {
  if (!d) return "";
  const iso = d.toISOString();
  return iso.slice(0, 16).replace("T", " ");
}

function formatInterviewStatus(status: string | null | undefined) {
  if (!status) return "";
  return status
    .toLowerCase()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function derivePrimaryTier(apps: any[]): string | null {
  const tiers = new Set<string>();
  for (const app of apps) {
    const latest = app.scoringEvents?.[0];
    const tier = (latest?.tier as string | null | undefined) ?? null;
    if (tier) tiers.add(tier.toUpperCase());
  }
  if (!tiers.size) return null;

  const ordered = ["A", "B", "C", "D"];
  for (const t of ordered) {
    if (tiers.has(t)) return t;
  }
  return Array.from(tiers)[0];
}

export default async function CandidateProfilePage({
  params,
  searchParams,
}: PageProps) {
  const tenantIdFromUrl =
    typeof searchParams?.tenantId === "string" ? searchParams.tenantId : undefined;

  // 1) Resolve tenant (host + ?tenantId logic lives in getResourcinTenant)
  const tenant = await getResourcinTenant(tenantIdFromUrl);
  if (!tenant) {
    notFound();
  }

  // 2) Enforce membership for this tenant BEFORE touching tenant data
  await requireTenantMembership(tenant.id);
  // If you later want role-based gates for some pages:
  // await requireTenantMembership(tenant.id, { allowedRoles: ["owner", "admin", "recruiter"] });

  const candidate = await prisma.candidate.findFirst({
    where: {
      id: params.candidateId,
      tenantId: tenant.id,
    },
    include: {
      tags: {
        include: { tag: true },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          job: {
            include: {
              clientCompany: true,
            },
          },
          scoringEvents: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          interviews: {
            orderBy: { scheduledAt: "asc" },
            include: {
              participants: true,
              competencies: true,
            },
          },
        },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!candidate) {
    notFound();
  }

  // Email history for this candidate in this tenant
  const emails = await prisma.sentEmail.findMany({
    where: {
      tenantId: tenant.id,
      candidateId: candidate.id,
    },
    orderBy: {
      sentAt: "desc",
    },
    include: {
      job: {
        include: {
          clientCompany: true,
        },
      },
    },
  });

  const primaryTier = derivePrimaryTier(candidate.applications);

  const firstSeenAt =
    candidate.applications.length > 0
      ? candidate.applications[candidate.applications.length - 1]?.createdAt
      : candidate.createdAt;

  const lastSeenAt =
    candidate.applications.length > 0
      ? candidate.applications[0]?.createdAt
      : candidate.createdAt;

  const uniqueTags =
    candidate.tags
      ?.map((ct) => ct.tag)
      .filter((t): t is NonNullable<typeof t> => Boolean(t)) ?? [];

  // Competencies highlighted across all interviews for this candidate
  const competencyFrequency = new Map<string, number>();
  for (const app of candidate.applications) {
    for (const iv of app.interviews ?? []) {
      for (const comp of iv.competencies ?? []) {
        const label = (comp.label || "").trim();
        if (!label) continue;
        competencyFrequency.set(label, (competencyFrequency.get(label) ?? 0) + 1);
      }
    }
  }

  const competencyTags = Array.from(competencyFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([label]) => label);

  const tenantQuery = `tenantId=${encodeURIComponent(tenant.id)}`;

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        {/* Breadcrumb + Back button */}
        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Link
              href={`/ats/candidates?${tenantQuery}`}
              className="hover:underline"
            >
              Candidates
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-700">
              {candidate.fullName}
            </span>
          </div>

          <Link
            href={`/ats/candidates?${tenantQuery}`}
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] text-slate-600 hover:bg-slate-50"
          >
            ← Back to all candidates
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-slate-900">
              {candidate.fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              {candidate.email && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {candidate.email}
                </span>
              )}
              {candidate.phone && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
                  {candidate.phone}
                </span>
              )}
              {candidate.location && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
                  {candidate.location}
                </span>
              )}
              {candidate.linkedinUrl && (
                <a
                  href={candidate.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 hover:bg-slate-200"
                >
                  LinkedIn profile
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-right text-[11px] text-slate-500">
            {primaryTier && (
              <span
                className={[
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  tierChipColor(primaryTier),
                ].join(" ")}
              >
                Primary tier: Tier {primaryTier}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
              First seen: {formatDate(firstSeenAt)}
              {lastSeenAt && lastSeenAt !== firstSeenAt && (
                <>
                  <span className="mx-1 text-slate-400">•</span>
                  Last activity: {formatDate(lastSeenAt)}
                </>
              )}
            </span>
            <span className="text-[10px] text-slate-400">
              {candidate.applications.length}{" "}
              {candidate.applications.length === 1
                ? "pipeline"
                : "pipelines"}{" "}
              in this workspace
            </span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex flex-1 flex-col bg-slate-50">
        <div className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          {/* Left: profile + pipelines */}
          <div className="space-y-4">
            {/* Profile + tags */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Profile
                </h2>
              </div>

              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] text-slate-500">Current role</dt>
                  <dd className="text-xs font-medium text-slate-800">
                    {candidate.currentTitle || "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-500">
                    Current company
                  </dt>
                  <dd className="text-xs font-medium text-slate-800">
                    {candidate.currentCompany || "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-500">Source</dt>
                  <dd className="text-xs text-slate-800">
                    {candidate.source || "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-500">CV</dt>
                  <dd className="text-xs text-slate-800">
                    {candidate.cvUrl ? (
                      <a
                        href={candidate.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-sky-700 hover:underline"
                      >
                        View CV
                      </a>
                    ) : (
                      "Not uploaded"
                    )}
                  </dd>
                </div>
              </dl>

              {/* Tags */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {uniqueTags.length > 0 ? (
                    uniqueTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
                      >
                        {tag.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      No tags yet. Use the field below to add some.
                    </span>
                  )}
                </div>

                <form
                  action={`/api/ats/candidates/${candidate.id}/tags`}
                  method="POST"
                  className="mt-2 flex flex-wrap gap-2"
                >
                  <input
                    type="text"
                    name="tagName"
                    placeholder="Add tag…"
                    className="h-8 min-w-[140px] flex-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] text-slate-800"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center rounded-full bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
                  >
                    Add tag
                  </button>
                </form>

                {/* Competencies from interviews */}
                {competencyTags.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600">
                        Competencies highlighted in interviews
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {competencyTags.map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Pipelines / applications */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Pipelines
                </h2>
                <span className="text-[11px] text-slate-400">
                  {candidate.applications.length}{" "}
                  {candidate.applications.length === 1
                    ? "application"
                    : "applications"}
                </span>
              </div>

              {candidate.applications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500">
                  This candidate is not yet attached to any job pipelines in
                  this tenant.
                </div>
              ) : (
                <div className="space-y-2">
                  {candidate.applications.map((app) => {
                    const latest = app.scoringEvents?.[0];
                    const score =
                      (latest?.score as number | null | undefined) ??
                      (app.matchScore as number | null | undefined) ??
                      null;
                    const tier =
                      (latest?.tier as string | null | undefined) ?? null;
                    const reason =
                      (latest?.reason as string | null | undefined) ??
                      (app.matchReason as string | null | undefined) ??
                      null;

                    return (
                      <article
                        key={app.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/ats/jobs/${app.jobId}?${tenantQuery}`}
                                className="text-[13px] font-semibold text-slate-900 hover:underline"
                              >
                                {app.job?.title || "Untitled role"}
                              </Link>
                              {app.job?.clientCompany && (
                                <span className="text-[10px] text-slate-500">
                                  · {app.job.clientCompany.name}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              Applied: {formatDate(app.createdAt)} · Stage:{" "}
                              <span className="font-medium">
                                {app.stage || "APPLIED"}
                              </span>{" "}
                              · Status:{" "}
                              <span className="font-medium">
                                {app.status || "PENDING"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex flex-wrap items-center gap-1">
                              {tier && (
                                <span
                                  className={[
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                    tierChipColor(tier),
                                  ].join(" ")}
                                >
                                  Tier {tier}
                                </span>
                              )}
                              {score != null && (
                                <span
                                  className={[
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                                    scoreChipColor(score),
                                  ].join(" ")}
                                >
                                  Score {score}
                                </span>
                              )}
                            </div>

                            <ApplicationInterviewDrawer
                              candidateId={candidate.id}
                              application={{
                                id: app.id,
                                jobId: app.jobId,
                                jobTitle: app.job?.title || "Untitled role",
                                clientName:
                                  app.job?.clientCompany?.name ?? null,
                                candidateName: candidate.fullName,
                                candidateEmail: candidate.email,
                                inviterOrgName:
                                  app.job?.clientCompany?.name || tenant.name,
                              }}
                            />
                          </div>
                        </div>

                        {reason && (
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">
                            {reason}
                          </p>
                        )}

                        {/* Interviews for this application */}
                        {app.interviews.length > 0 && (
                          <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-600">
                                Interviews
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {app.interviews.length} scheduled / logged
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {app.interviews.map((iv) => {
                                const participants = iv.participants || [];
                                const interviewerNames = participants
                                  .filter(
                                    (p) =>
                                      (p.role || "")
                                        .toLowerCase()
                                        .trim() !== "candidate",
                                  )
                                  .map((p) => p.name)
                                  .filter(Boolean);
                                const interviewerLabel =
                                  interviewerNames.length > 0
                                    ? interviewerNames.join(", ")
                                    : null;
                                const ratingScaleMax =
                                  iv.ratingScaleMax || 5;

                                return (
                                  <div
                                    key={iv.id}
                                    className="flex flex-col rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-[11px]"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-1">
                                      <div className="flex flex-wrap items-center gap-1">
                                        <span className="font-medium text-slate-800">
                                          {iv.type || "Interview"}
                                        </span>
                                        <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700">
                                          {formatInterviewStatus(iv.status)}
                                        </span>
                                        {iv.rating != null && (
                                          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                            Rating: {iv.rating}/{ratingScaleMax}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-500">
                                        {formatDateTime(iv.scheduledAt)}
                                        {iv.durationMins
                                          ? ` · ${iv.durationMins} mins`
                                          : ""}
                                      </span>
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                      {iv.location && (
                                        <span>Location: {iv.location}</span>
                                      )}
                                      {iv.videoUrl && (
                                        <a
                                          href={iv.videoUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-sky-700 hover:underline"
                                        >
                                          Join link
                                        </a>
                                      )}
                                      {interviewerLabel && (
                                        <span>With: {interviewerLabel}</span>
                                      )}
                                      {iv.outcome && (
                                        <span>Outcome: {iv.outcome}</span>
                                      )}
                                    </div>
                                    {iv.feedbackNotes && (
                                      <p className="mt-0.5 text-[10px] text-slate-600">
                                        {iv.feedbackNotes}
                                      </p>
                                    )}

                                    {iv.competencies &&
                                      iv.competencies.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                          {iv.competencies.map((comp) => (
                                            <span
                                              key={comp.id}
                                              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
                                            >
                                              {comp.label}
                                              {comp.rating != null && (
                                                <span className="ml-1 text-[9px] opacity-75">
                                                  {comp.rating}/
                                                  {ratingScaleMax}
                                                </span>
                                              )}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right: notes / comments + email history */}
          <aside className="space-y-4">
            {/* Notes */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Notes &amp; comments
                </h2>
                <span className="text-[11px] text-slate-400">
                  {candidate.notes.length} notes
                </span>
              </div>

              <form
                action={`/api/ats/candidates/${candidate.id}/notes`}
                method="POST"
                className="mb-3 space-y-2"
              >
                <textarea
                  name="body"
                  rows={3}
                  placeholder="Drop a quick note for your team..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Notes are visible to your internal team only.
                  </span>
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center rounded-full bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
                  >
                    Add note
                  </button>
                </div>
              </form>

              {candidate.notes.length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  No notes yet. Leave the first one.
                </p>
              ) : (
                <div className="space-y-2">
                  {candidate.notes.map((note) => (
                    <article
                      key={note.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-2"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-700">
                          {note.authorName || "Someone on your team"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-[11px] text-slate-700">
                        {note.body}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Email history */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Email history
                </h2>
                <span className="text-[11px] text-slate-400">
                  {emails.length} sent
                </span>
              </div>

              {emails.length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  No tracked emails yet for this candidate in this tenant.
                </p>
              ) : (
                <div className="space-y-2">
                  {emails.map((mail) => (
                    <article
                      key={mail.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-2"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium text-slate-700">
                            {mail.subject || "(no subject)"}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            To: {mail.toEmail}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(mail.sentAt)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                        {mail.templateName && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5">
                            Template: {mail.templateName}
                          </span>
                        )}
                        {mail.job && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5">
                            Related role: {mail.job.title}
                            {mail.job.clientCompany &&
                              ` · ${mail.job.clientCompany.name}`}
                          </span>
                        )}
                        {mail.providerMessageId && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5">
                            Provider ID: {mail.providerMessageId.slice(0, 10)}
                            …
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
