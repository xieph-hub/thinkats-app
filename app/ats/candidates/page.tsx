// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getScoringConfigForJob } from "@/lib/scoring/server";
import { computeApplicationScore } from "@/lib/scoring/compute";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Candidates",
  description:
    "Cross-job view of candidates, scoring tiers, risks and interview focus across your ATS.",
};

type Tier = "A" | "B" | "C" | "D";

export default async function AtsCandidatesPage() {
  const applications = await prisma.jobApplication.findMany({
    include: {
      candidate: true,
      job: {
        include: {
          clientCompany: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Cache scoring config per job to avoid N+1
  const jobIds = Array.from(new Set(applications.map((app) => app.jobId)));
  const configByJobId = new Map<string, any>();

  for (const jobId of jobIds) {
    const { config } = await getScoringConfigForJob(jobId);
    configByJobId.set(jobId, config);
  }

  const scoredRows = applications.map((app) => {
    const config = configByJobId.get(app.jobId);

    const scored = computeApplicationScore({
      application: app,
      candidate: app.candidate,
      job: app.job,
      config,
    });

    const cvUrl = app.cvUrl || app.candidate?.cvUrl || null;

    return {
      application: app,
      candidate: app.candidate,
      job: app.job,
      scored,
      cvUrl,
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Candidates
        </p>
        <h1 className="text-xl font-semibold text-slate-900">
          Candidate universe
        </h1>
        <p className="text-xs text-slate-600">
          A cross-job view of candidates, their tiers, match scores and
          interview focus areas across your mandates.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Latest applications
            </h2>
            <p className="text-[11px] text-slate-500">
              Showing up to 100 most recent applications.
            </p>
          </div>
        </div>

        {scoredRows.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            No candidates yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-t border-slate-100 text-xs">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Candidate</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Client</th>
                  <th className="px-4 py-2 text-left">Tier</th>
                  <th className="px-4 py-2 text-left">Score</th>
                  <th className="px-4 py-2 text-left">CV</th>
                  <th className="px-4 py-2 text-left">Risks / red flags</th>
                  <th className="px-4 py-2 text-left">Interview focus</th>
                  <th className="px-4 py-2 text-left">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scoredRows.map(
                  ({ application, candidate, job, scored, cvUrl }) => (
                    <tr key={application.id} className="align-top">
                      {/* Candidate */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {candidate?.id ? (
                            <Link
                              href={`/ats/candidates/${candidate.id}`}
                              className="text-xs font-medium text-[#172965] hover:underline"
                            >
                              {application.fullName}
                            </Link>
                          ) : (
                            <span className="text-xs font-medium text-slate-900">
                              {application.fullName}
                            </span>
                          )}
                          <p className="text-[11px] text-slate-500">
                            {candidate?.currentTitle || "—"}
                            {candidate?.currentCompany
                              ? ` · ${candidate.currentCompany}`
                              : ""}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {application.email}
                          </p>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-slate-900">
                          {job.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {job.location || job.workMode || "—"}
                        </p>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-800">
                          {job.clientCompany?.name || "—"}
                        </p>
                      </td>

                      {/* Tier */}
                      <td className="px-4 py-3">
                        <TierBadge tier={scored.tier} />
                      </td>

                      {/* Score */}
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

                      {/* CV */}
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
                            No CV on file
                          </span>
                        )}
                      </td>

                      {/* Risks / red flags */}
                      <td className="px-4 py-3">
                        <RiskBadges
                          risks={scored.risks}
                          redFlags={scored.redFlags}
                        />
                      </td>

                      {/* Interview focus */}
                      <td className="px-4 py-3">
                        {scored.interviewFocus.length === 0 ? (
                          <span className="text-[11px] text-slate-400">—</span>
                        ) : (
                          <ul className="space-y-1 text-[11px] text-slate-600">
                            {scored.interviewFocus
                              .slice(0, 2)
                              .map((item, idx) => (
                                <li
                                  key={idx}
                                  className="line-clamp-2"
                                  title={item}
                                >
                                  • {item}
                                </li>
                              ))}
                            {scored.interviewFocus.length > 2 && (
                              <li className="text-[10px] text-slate-400">
                                +
                                {scored.interviewFocus.length - 2} more focus
                                points
                              </li>
                            )}
                          </ul>
                        )}
                      </td>

                      {/* Applied */}
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {application.createdAt.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function TierBadge({ tier }: { tier: Tier | string }) {
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

  const safeTier: Tier =
    tier === "A" || tier === "B" || tier === "C" || tier === "D"
      ? tier
      : "D";

  const { label, classes } = map[safeTier];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

function RiskBadges({
  risks,
  redFlags,
}: {
  risks: string[];
  redFlags: string[];
}) {
  if (!risks.length && !redFlags.length) {
    return <span className="text-[11px] text-slate-400">No obvious risks</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {redFlags.map((flag, idx) => (
        <span
          key={`rf-${idx}`}
          className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700"
          title={flag}
        >
          ● Red flag
        </span>
      ))}
      {risks.map((risk, idx) => (
        <span
          key={`rk-${idx}`}
          className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800"
          title={risk}
        >
          ● Risk
        </span>
      ))}
    </div>
  );
}
