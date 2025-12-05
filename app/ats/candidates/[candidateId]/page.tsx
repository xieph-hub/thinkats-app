// app/ats/candidates/[candidateId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getScoringConfigForJob } from "@/lib/scoring/server";
import { computeApplicationScore } from "@/lib/scoring/compute";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Candidate profile",
  description:
    "Detailed candidate profile with application history and scoring details.",
};

type Tier = "A" | "B" | "C" | "D";

export default async function CandidateProfilePage({
  params,
}: {
  params: { candidateId: string };
}) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: params.candidateId },
    include: {
      applications: {
        include: {
          job: {
            include: {
              clientCompany: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!candidate) {
    notFound();
  }

  const applicationViews = [];
  for (const app of candidate.applications) {
    const { config } = await getScoringConfigForJob(app.jobId);
    const scored = computeApplicationScore({
      application: app,
      candidate,
      job: app.job,
      config,
    });

    const cvUrl = app.cvUrl || candidate.cvUrl || null;

    applicationViews.push({
      application: app,
      job: app.job,
      scored,
      cvUrl,
    });
  }

  const latestCvUrl =
    candidate.cvUrl ||
    applicationViews.find((v) => v.cvUrl)?.cvUrl ||
    null;

  const latestApp = applicationViews[0] || null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS · Candidate
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            {candidate.fullName}
          </h1>
          <p className="text-xs text-slate-600">
            {candidate.currentTitle || "Role not set"}
            {candidate.currentCompany
              ? ` · ${candidate.currentCompany}`
              : ""}
          </p>
          <p className="text-[11px] text-slate-500">
            {candidate.location || "Location not set"}
          </p>
        </div>

        <div className="space-y-2 text-right text-[11px] text-slate-600">
          {latestCvUrl && (
            <a
              href={latestCvUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#111c4a]"
            >
              View latest CV
            </a>
          )}
          {!latestCvUrl && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-500">
              No CV on file
            </span>
          )}
          <div className="space-y-0.5">
            <p>{candidate.email}</p>
            {candidate.phone && <p>{candidate.phone}</p>}
            {candidate.linkedinUrl && (
              <p>
                <a
                  href={candidate.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#172965] hover:underline"
                >
                  LinkedIn profile
                </a>
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Latest match summary */}
      {latestApp && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-900">
                Latest application snapshot
              </h2>
              <p className="text-xs text-slate-600">
                {latestApp.job.title} ·{" "}
                {latestApp.job.clientCompany?.name || "No client set"}
              </p>
              <p className="text-[11px] text-slate-500">
                Applied{" "}
                {latestApp.application.createdAt.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
              <TierBadge tier={latestApp.scored.tier} />
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold text-slate-900">
                  {latestApp.scored.score}
                </span>
                <span className="text-[10px] text-slate-500">
                  / 100 match score
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Match summary
            </p>
            <p className="mt-1 text-xs text-slate-700">
              {latestApp.scored.reason}
            </p>
          </div>
        </section>
      )}

      {/* Application history */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Application history
            </h2>
            <p className="text-[11px] text-slate-500">
              {applicationViews.length} application
              {applicationViews.length === 1 ? "" : "s"} recorded.
            </p>
          </div>
        </div>

        {applicationViews.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            No applications recorded for this candidate.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-t border-slate-100 text-xs">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Stage / status</th>
                  <th className="px-4 py-2 text-left">Tier</th>
                  <th className="px-4 py-2 text-left">Score</th>
                  <th className="px-4 py-2 text-left">Match summary</th>
                  <th className="px-4 py-2 text-left">CV</th>
                  <th className="px-4 py-2 text-left">Applied</th>
                  <th className="px-4 py-2 text-left">Open job</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicationViews.map(({ application, job, scored, cvUrl }) => (
                  <tr key={application.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-900">
                        {job.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {job.location || job.workMode || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-800">
                        {job.clientCompany?.name || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-900">
                        {application.stage || "APPLIED"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {application.status || "PENDING"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge tier={scored.tier} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {scored.score}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          / 100
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p
                        className="max-w-xs text-[11px] text-slate-600 line-clamp-3"
                        title={scored.reason}
                      >
                        {scored.reason}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {cvUrl ? (
                        <a
                          href={cvUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          View CV
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          No CV
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {application.createdAt.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/ats/jobs/${job.id}`}
                        className="text-[11px] font-medium text-[#172965] hover:underline"
                      >
                        View pipeline
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const map: Record<Tier, { label: string; classes: string }> = {
    A: {
      label: "Tier A · Priority",
      classes:
        "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    B: {
      label: "Tier B · Strong",
      classes: "border-sky-200 bg-sky-50 text-sky-800",
    },
    C: {
      label: "Tier C · Consider",
      classes: "border-amber-200 bg-amber-50 text-amber-800",
    },
    D: {
      label: "Tier D · Below threshold",
      classes: "border-rose-200 bg-rose-50 text-rose-800",
    },
  };

  const { label, classes } = map[tier];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
