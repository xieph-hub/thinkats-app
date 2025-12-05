// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getScoringConfigForJob } from "@/lib/scoring/server";
import { computeApplicationScore, type Tier } from "@/lib/scoring/compute";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Candidates",
  description:
    "Cross-job view of candidates, scoring tiers and risk flags across your ATS.",
};

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

  const scoredRows = [];

  for (const app of applications) {
    const { config } = await getScoringConfigForJob(app.jobId);

    const scored = computeApplicationScore({
      application: app,
      candidate: app.candidate,
      job: app.job,
      config,
    });

    scoredRows.push({
      application: app,
      candidate: app.candidate,
      job: app.job,
      scored,
    });
  }

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
          A cross-job view of candidates, their tiers, risks and interview
          focus areas across your mandates.
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
                  <th className="px-4 py-2 text-left">Company</th>
                  <th className="px-4 py-2 text-left">Tier</th>
                  <th className="px-4 py-2 text-left">Score</th>
                  <th className="px-4 py-2 text-left">Risks / red flags</th>
                  <th className="px-4 py-2 text-left">Interview focus</th>
                  <th className="px-4 py-2 text-left">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scoredRows.map(({ application, candidate, job, scored }) => (
                  <tr key={application.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-900">
                          {application.fullName}
                        </p>
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
                      <RiskBadges risks={scored.risks} redFlags={scored.redFlags} />
                    </td>

                    <td className="px-4 py-3">
                      {scored.interviewFocus.length === 0 ? (
                        <span className="text-[11px] text-slate-400">—</span>
                      ) : (
                        <ul className="space-y-1 text-[11px] text-slate-600">
                          {scored.interviewFocus.slice(0, 2).map((item, idx) => (
                            <li key={idx} className="line-clamp-2" title={item}>
                              • {item}
                            </li>
                          ))}
                          {scored.interviewFocus.length > 2 && (
                            <li className="text-[10px] text-slate-400">
                              +{scored.interviewFocus.length - 2} more focus
                              points
                            </li>
                          )}
                        </ul>
                      )}
                    </td>

                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      {application.createdAt.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
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

type Tier = "A" | "B" | "C" | "D";

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
