// app/ats/candidates/[candidateId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import CandidateTagsEditor from "@/components/ats/candidates/CandidateTagsEditor";
import QuickSendEmailPanel from "@/components/ats/emails/QuickSendEmailPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Candidate profile",
  description: "Full profile and pipeline view for this candidate.",
};

type PageProps = {
  params: { candidateId: string };
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
  // Simple ISO-style date for consistency between server/client
  return d.toISOString().slice(0, 10);
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

export default async function CandidateProfilePage({ params }: PageProps) {
  const tenant = await getResourcinTenant();
  if (!tenant) notFound();

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

  const tagList = uniqueTags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
  }));

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/ats/candidates" className="hover:underline">
            Candidates
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">
            {candidate.fullName}
          </span>
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
            {/* Profile */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Profile
                </h2>
              </div>

              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] text-slate-500">
                    Current role
                  </dt>
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
                  <dt className="text-[11px] text-slate-500">
                    Source
                  </dt>
                  <dd className="text-xs text-slate-800">
                    {candidate.source || "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-slate-500">
                    CV
                  </dt>
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
                                href={`/ats/jobs/${app.jobId}`}
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
                        </div>

                        {reason && (
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">
                            {reason}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right: tags / contact summary / quick email / notes */}
          <aside className="space-y-4">
            {/* Contact & links */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">
                Profile summary
              </h2>
              <div className="space-y-2">
                {candidate.email && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      Email
                    </span>
                    <a
                      href={`mailto:${candidate.email}`}
                      className="truncate text-[11px] font-medium text-slate-900 hover:underline"
                    >
                      {candidate.email}
                    </a>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      Phone
                    </span>
                    <a
                      href={`tel:${candidate.phone}`}
                      className="truncate text-[11px] font-medium text-slate-900 hover:underline"
                    >
                      {candidate.phone}
                    </a>
                  </div>
                )}
                {candidate.linkedinUrl && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      LinkedIn
                    </span>
                    <a
                      href={candidate.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-[11px] font-medium text-slate-900 hover:underline"
                    >
                      View profile
                    </a>
                  </div>
                )}
                {candidate.cvUrl && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      CV
                    </span>
                    <a
                      href={candidate.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-[11px] font-medium text-slate-900 hover:underline"
                    >
                      Download CV
                    </a>
                  </div>
                )}
                {candidate.source && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      Source
                    </span>
                    <span className="truncate text-[11px] font-medium text-slate-900">
                      {candidate.source}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Tags editor */}
            <CandidateTagsEditor
              candidateId={candidate.id}
              initialTags={tagList}
            />

            {/* Quick email to candidate */}
            {candidate.email && (
              <QuickSendEmailPanel
                candidateId={candidate.id}
                candidateName={candidate.fullName}
                candidateEmail={candidate.email}
              />
            )}

            {/* Notes / comments */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Notes &amp; comments
                </h2>
                <span className="text-[11px] text-slate-400">
                  {candidate.notes.length}{" "}
                  {candidate.notes.length === 1 ? "note" : "notes"}
                </span>
              </div>

              {candidate.notes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500">
                  No internal notes yet. Use the box below to add context from
                  calls, interviews or client feedback.
                  <br />
                  Notes are only visible to your internal team.
                </div>
              ) : (
                <div className="mb-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {candidate.notes.map((note) => (
                    <article
                      key={note.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-2.5"
                    >
                      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-medium">
                          Internal note
                          {note.noteType && note.noteType !== "general"
                            ? ` · ${note.noteType}`
                            : ""}
                        </span>
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-[11px] text-slate-700">
                        {note.body}
                      </p>
                    </article>
                  ))}
                </div>
              )}

              <form
                action={`/api/ats/candidates/${candidate.id}/notes`}
                method="POST"
                className="mt-3 space-y-2"
              >
                <label className="text-[11px] text-slate-500">
                  Add internal note
                </label>
                <textarea
                  name="noteBody"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-800"
                  placeholder="Interview impressions, client feedback, red flags, next steps…"
                  required
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800"
                  >
                    Save note
                  </button>
                </div>
              </form>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
