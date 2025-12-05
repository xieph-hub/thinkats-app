// app/ats/jobs/[jobId]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getScoringConfigForJob } from "@/lib/scoring/server";
import { computeApplicationScore, type Tier } from "@/lib/scoring/compute";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Job pipeline",
  description:
    "Pipeline view of candidates, scoring and risk flags for a specific mandate.",
};

type PageProps = {
  params: { jobId: string };
};

export default async function AtsJobPipelinePage({ params }: PageProps) {
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    include: {
      clientCompany: true,
    },
  });

  if (!job) {
    notFound();
  }

  const applications = await prisma.jobApplication.findMany({
    where: { jobId: job.id },
    include: {
      candidate: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const { config } = await getScoringConfigForJob(job.id);

  const scoredApplications = applications.map((app) => {
    const scored = computeApplicationScore({
      application: app,
      candidate: app.candidate,
      job,
      config,
    });

    return {
      application: app,
      candidate: app.candidate,
      scored,
    };
  });

  const totalCandidates = applications.length;
  const tierCounts = scoredApplications.reduce(
    (acc, row) => {
      acc[row.scored.tier] += 1;
      return acc;
    },
    { A: 0, B: 0, C: 0, D: 0 } as Record<Tier, number>,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      {/* Header / job summary */}
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Pipeline
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {job.title}
            </h1>
            <p className="text-xs text-slate-500">
              {job.clientCompany?.name && (
                <span className="font-medium text-slate-700">
                  {job.clientCompany.name}
                </span>
              )}
              {job.clientCompany?.name && (job.location || job.workMode) && (
                <span className="mx-1.5 text-slate-300">·</span>
              )}
              {(job.location || job.workMode) && (
                <span>
                  {job.location}
                  {job.workMode ? ` · ${job.workMode}` : ""}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-slate-700">
                {job.status === "open" ? "Open" : job.status}
              </span>
            </div>
            <div className="rounded-full bg-slate-50 px-3 py-1 text-slate-600">
              {totalCandidates}{" "}
              {totalCandidates === 1 ? "candidate" : "candidates"}
            </div>
          </div>
        </div>
      </header>

      {/* Tier summary */}
      <section className="grid gap-3 md:grid-cols-4">
        <TierSummaryCard
          label="Tier A"
          description="Priority interviews"
          count={tierCounts.A}
          tone="emerald"
        />
        <TierSummaryCard
          label="Tier B"
          description="Strong consideration"
          count={tierCounts.B}
          tone="sky"
        />
        <TierSummaryCard
          label="Tier C"
          description="Consider / backup pool"
          count={tierCounts.C}
          tone="amber"
        />
        <TierSummaryCard
          label="Tier D"
          description="Below threshold"
          count={tierCounts.D}
          tone="rose"
        />
      </section>

      {/* Pipeline table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Candidates & scoring
            </h2>
            <p className="text-[11px] text-slate-500">
              Tiers and flags are driven by your scoring settings.
            </p>
          </div>
        </div>

        {scoredApplications.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            No applications yet. Once candidates apply, they&apos;ll appear
            here with tiers, risks and interview focus areas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-t border-slate-100 text-xs">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Candidate</th>
                  <th className="px-4 py-2 text-left">Tier</th>
                  <th className="px-4 py-2 text-left">Score</th>
                  <th className="px-4 py-2 text-left">Risks / red flags</th>
                  <th className="px-4 py-2 text-left">Interview focus</th>
                  <th className="px-4 py-2 text-left">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scoredApplications.map(({ application, candidate, scored }) => (
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

function TierSummaryCard({
  label,
  description,
  count,
  tone,
}: {
  label: string;
  description: string;
  count: number;
  tone: "emerald" | "sky" | "amber" | "rose";
}) {
  const toneMap: Record<
    typeof tone,
    { bg: string; text: string; badgeBg: string; badgeDot: string }
  > = {
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-900",
      badgeBg: "bg-emerald-100",
      badgeDot: "bg-emerald-500",
    },
    sky: {
      bg: "bg-sky-50",
      text: "text-sky-900",
      badgeBg: "bg-sky-100",
      badgeDot: "bg-sky-500",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-900",
      badgeBg: "bg-amber-100",
      badgeDot: "bg-amber-500",
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-900",
      badgeBg: "bg-rose-100",
      badgeDot: "bg-rose-500",
    },
  };

  const toneClasses = toneMap[tone];

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border border-slate-100 ${toneClasses.bg} px-3 py-3`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className={`text-xs font-semibold ${toneClasses.text}`}>
            {label}
          </p>
          <p className="text-[11px] text-slate-500">{description}</p>
        </div>
        <div
          className={`flex h-7 min-w-[2.5rem] items-center justify-center rounded-full px-2 text-[11px] font-semibold ${toneClasses.badgeBg} ${toneClasses.text}`}
        >
          <span className={`mr-1 h-1.5 w-1.5 rounded-full ${toneClasses.badgeDot}`} />
          {count}
        </div>
      </div>
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
