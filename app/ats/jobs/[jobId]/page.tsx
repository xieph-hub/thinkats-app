// app/ats/jobs/[jobId]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getScoringConfigForJob } from "@/lib/scoring/server";
import { computeApplicationScore } from "@/lib/scoring/compute";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Job pipeline",
  description:
    "ATS pipeline view of applications, tiers and risk flags for a specific role.",
};

type PageProps = {
  params: {
    jobId: string;
  };
};

export default async function AtsJobPipelinePage({ params }: PageProps) {
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    include: {
      tenant: true,
      clientCompany: true,
      applications: {
        include: {
          candidate: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const { config } = await getScoringConfigForJob(job.id);

  const rows = job.applications.map((application) => {
    const scored = computeApplicationScore({
      application,
      candidate: application.candidate,
      job,
      config,
    });

    return {
      application,
      candidate: application.candidate,
      scored,
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      {/* Header / job summary */}
      <header className="space-y-3 border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Job pipeline
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-900">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              {job.clientCompany?.name && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                  {job.clientCompany.name}
                </span>
              )}
              {job.location && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
                  {job.location}
                </span>
              )}
              {job.workMode && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 capitalize">
                  {job.workMode.toLowerCase()}
                </span>
              )}
              {job.experienceLevel && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 capitalize">
                  {job.experienceLevel.toLowerCase()}
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                {job.status?.toUpperCase() || "OPEN"}
              </span>
            </div>
          </div>
          <div className="space-y-1 text-right text-[11px] text-slate-500">
            <p>
              Applications:{" "}
              <span className="font-semibold text-slate-900">
                {job.applications.length}
              </span>
            </p>
            <p>
              Hiring mode:{" "}
              <span className="font-semibold text-slate-900 capitalize">
                {config.hiringMode}
              </span>
            </p>
            <p className="text-[10px]">
              Tier thresholds: A ≥ {config.thresholds.tierA}, B ≥{" "}
              {config.thresholds.tierB}, C ≥ {config.thresholds.tierC}
            </p>
          </div>
        </div>
      </header>

      {/* Pipeline table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Pipeline · {job.applications.length}{" "}
              {job.applications.length === 1 ? "application" : "applications"}
            </h2>
            <p className="text-[11px] text-slate-500">
              Scored by the semantic CV/JD engine with bias-aware tiering.
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            No applications yet for this role.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-t border-slate-100 text-xs">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Candidate</th>
                  <th className="px-4 py-2 text-left">Profile</th>
                  <th className="px-4 py-2 text-left">Tier</th>
                  <th className="px-4 py-2 text-left">Score</th>
                  <th className="px-4 py-2 text-left">Risks / red flags</th>
                  <th className="px-4 py-2 text-left">Reason</th>
                  <th className="px-4 py-2 text-left">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(({ application, candidate, scored }) => (
                  <tr key={application.id} className="align-top">
                    {/* Candidate / email */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-900">
                          {application.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {application.email}
                        </p>
                        {application.location && (
                          <p className="text-[11px] text-slate-400">
                            {application.location}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Current role / company */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-900">
                        {candidate?.currentTitle || "—"}
                        {candidate?.currentCompany
                          ? ` · ${candidate.currentCompany}`
                          : ""}
                      </p>
                      {candidate?.location && (
                        <p className="text-[11px] text-slate-500">
                          {candidate.location}
                        </p>
                      )}
                    </td>

                    {/* Tier pill */}
                    <td className="px-4 py-3">
                      <TierBadge tier={scored.tier as Tier} />
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

                    {/* Risks / red flags */}
                    <td className="px-4 py-3">
                      <RiskBadges
                        risks={scored.risks}
                        redFlags={scored.redFlags}
                      />
                    </td>

                    {/* Reason / short explanation */}
                    <td className="px-4 py-3">
                      <p
                        className="max-w-xs text-[11px] text-slate-600 line-clamp-3"
                        title={scored.reason}
                      >
                        {scored.reason}
                      </p>
                    </td>

                    {/* Applied date */}
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
      classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
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
