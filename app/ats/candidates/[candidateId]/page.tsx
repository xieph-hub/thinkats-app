// app/ats/candidates/[candidateId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Candidate profile",
  description: "Full profile and pipeline view for this candidate.",
};

type PageProps = {
  params: { candidateId: string };
  searchParams?: {
    templateId?: string;
    jobId?: string;
    emailError?: string;
  };
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

function applyTemplateTokens(text: string, replacements: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    const token = `{{${key}}}`;
    result = result.split(token).join(value);
  }
  return result;
}

export default async function CandidateProfilePage({
  params,
  searchParams,
}: PageProps) {
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

  // Email templates for this tenant
  const emailTemplates = await prisma.emailTemplate.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
  });

  // Recent emails to this candidate
  const sentEmails = await prisma.sentEmail.findMany({
    where: {
      tenantId: tenant.id,
      candidateId: candidate.id,
    },
    include: {
      template: true,
      job: true,
    },
    orderBy: { sentAt: "desc" },
    take: 20,
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

  const templateIdFromQuery = searchParams?.templateId || "";
  const jobIdFromQuery = searchParams?.jobId || "";
  const emailError = searchParams?.emailError;

  const activeTemplate = emailTemplates.find(
    (t) => t.id === templateIdFromQuery,
  );

  const selectedApplication =
    candidate.applications.find((app) => app.jobId === jobIdFromQuery) ??
    candidate.applications[0] ??
    null;

  const activeJob = selectedApplication?.job ?? null;

  // Render template with tokens if one is active
  let defaultSubject = "";
  let defaultBody = "";

  if (activeTemplate) {
    const fullName = candidate.fullName || "";
    const firstName =
      fullName.trim().split(/\s+/)[0] || fullName || "there";

    const replacements: Record<string, string> = {
      candidate_name: fullName,
      candidate_first_name: firstName,
      candidate_email: candidate.email || "",
      job_title: activeJob?.title || "",
      client_name: activeJob?.clientCompany?.name || "",
      tenant_name: tenant.name,
      application_stage: selectedApplication?.stage || "",
      application_status: selectedApplication?.status || "",
    };

    defaultSubject = applyTemplateTokens(
      activeTemplate.subject,
      replacements,
    );
    defaultBody = applyTemplateTokens(activeTemplate.body, replacements);
  }

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
        <div className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
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

          {/* Right: notes / email */}
          <aside className="space-y-4">
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

            {/* Email & history */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Email &amp; history
                </h2>
                <span className="text-[11px] text-slate-400">
                  {sentEmails.length}{" "}
                  {sentEmails.length === 1 ? "email" : "emails"}
                </span>
              </div>

              {emailError && (
                <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-700">
                  {decodeURIComponent(emailError)}
                </div>
              )}

              {/* Templates pill row */}
              {emailTemplates.length > 0 ? (
                <div className="mb-3 space-y-1">
                  <p className="text-[11px] text-slate-500">Templates</p>
                  <div className="flex flex-wrap gap-1">
                    {emailTemplates.map((tpl) => {
                      const isActive = tpl.id === activeTemplate?.id;
                      const baseHref = new URL(
                        `/ats/candidates/${candidate.id}`,
                        "https://dummy",
                      );
                      baseHref.searchParams.set("templateId", tpl.id);
                      if (selectedApplication?.jobId) {
                        baseHref.searchParams.set(
                          "jobId",
                          selectedApplication.jobId,
                        );
                      }

                      return (
                        <Link
                          key={tpl.id}
                          href={baseHref.pathname + baseHref.search}
                          className={[
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]",
                            isActive
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
                          ].join(" ")}
                        >
                          {tpl.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="mb-3 text-[11px] text-slate-400">
                  No email templates yet. Create templates under ATS
                  settings.
                </p>
              )}

              {/* Compose form */}
              <form
                action="/api/ats/email/send"
                method="POST"
                className="space-y-2"
              >
                <input
                  type="hidden"
                  name="candidateId"
                  value={candidate.id}
                />
                <input
                  type="hidden"
                  name="applicationId"
                  value={selectedApplication?.id ?? ""}
                />
                <input
                  type="hidden"
                  name="templateId"
                  value={activeTemplate?.id ?? ""}
                />
                <input
                  type="hidden"
                  name="redirectTo"
                  value={`/ats/candidates/${candidate.id}${
                    activeTemplate
                      ? `?templateId=${activeTemplate.id}${
                          selectedApplication?.jobId
                            ? `&jobId=${selectedApplication.jobId}`
                            : ""
                        }`
                      : ""
                  }`}
                />

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    To
                  </label>
                  <input
                    type="email"
                    name="toEmail"
                    defaultValue={candidate.email || ""}
                    placeholder="candidate@example.com"
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                    required
                  />
                </div>

                {candidate.applications.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500">
                      Attach to job (optional)
                    </label>
                    <select
                      name="jobId"
                      defaultValue={selectedApplication?.jobId ?? ""}
                      className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                    >
                      <option value="">No specific job</option>
                      {candidate.applications.map((app) => (
                        <option key={app.id} value={app.jobId}>
                          {app.job?.title || "Untitled role"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    defaultValue={defaultSubject}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500">
                    Body
                  </label>
                  <textarea
                    name="body"
                    rows={4}
                    defaultValue={defaultBody}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-800"
                    placeholder="Write your email…"
                    required
                  />
                </div>

                <p className="text-[10px] text-slate-400">
                  In templates you can use tokens like{" "}
                  <code className="rounded bg-slate-100 px-1">
                    {"{{candidate_name}}"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-slate-100 px-1">
                    {"{{candidate_first_name}}"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-slate-100 px-1">
                    {"{{job_title}}"}
                  </code>
                  ,{" "}
                  <code className="rounded bg-slate-100 px-1">
                    {"{{client_name}}"}
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-slate-100 px-1">
                    {"{{tenant_name}}"}
                  </code>
                  .
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center rounded-full bg-slate-900 px-4 text-[11px] font-semibold text-white hover:bg-slate-800"
                  >
                    Send email
                  </button>
                </div>
              </form>

              {/* History */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Recent emails
                </h3>
                {sentEmails.length === 0 ? (
                  <p className="mt-2 text-[11px] text-slate-400">
                    No emails sent to this candidate yet via ThinkATS.
                  </p>
                ) : (
                  <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
                    {sentEmails.map((mail) => (
                      <li
                        key={mail.id}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-2.5"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="line-clamp-1 font-medium text-slate-800">
                            {mail.subject}
                          </span>
                          <span>{formatDate(mail.sentAt)}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
                          {mail.template?.name && (
                            <span>Template · {mail.template.name}</span>
                          )}
                          {mail.job && (
                            <span>{mail.job.title}</span>
                          )}
                          <span>
                            Status:{" "}
                            <span className="font-medium">
                              {mail.status}
                            </span>
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">
                          {mail.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
