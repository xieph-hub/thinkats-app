// app/ats/jobs/[jobId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getScoringConfigForJob } from "@/lib/scoring/server";
import { computeApplicationScore } from "@/lib/scoring/compute";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Job pipeline",
  description:
    "ATS job detail and candidate pipeline view with scoring tiers and CV access.",
};

type Tier = "A" | "B" | "C" | "D";

export default async function AtsJobDetailPage({
  params,
}: {
  params: { jobId: string };
}) {
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    include: {
      clientCompany: true,
      applications: {
        include: {
          candidate: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const { config } = await getScoringConfigForJob(job.id);

  const rows = job.applications.map((app) => {
    const scored = computeApplicationScore({
      application: app,
      candidate: app.candidate,
      job,
      config,
    });

    const cvUrl = app.cvUrl || app.candidate?.cvUrl || null;

    return {
      application: app,
      candidate: app.candidate,
      scored,
      cvUrl,
    };
  });

  const tierCounts: Record<Tier, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };

  for (const row of rows) {
    const t = row.scored.tier;
    if (t === "A" || t === "B" || t === "C" || t === "D") {
      tierCounts[t] += 1;
    } else {
      tierCounts.D += 1;
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Job pipeline
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {job.title}
            </h1>
            <p className="text-xs text-slate-600">
              {job.clientCompany?.name
                ? `${job.clientCompany.name} · `
                : ""}
              {job.location || job.workMode || "Location not set"}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
              Applications:{" "}
              <span className="ml-1 font-semibold text-slate-800">
                {rows.length}
              </span>
            </span>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
              A: <span className="ml-1 font-semibold">{tierCounts.A}</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1">
              B: <span className="ml-1 font-semibold">{tierCounts.B}</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
              C: <span className="ml-1 font-semibold">{tierCounts.C}</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1">
              D: <span className="ml-1 font-semibold">{tierCounts.D}</span>
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          Pipeline view with scoring tiers, quick access to CVs and deep
          candidate profiles. Click a candidate name to open the full profile.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Applications ({rows.length})
            </h2>
            <p className="text-[11px] text-slate-500">
              Newest applications appear first. Scores are driven by your
              semantic engine.
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
                  <th className="px-4 py-2 text-left">Stage / status</th>
                  <th className="px-4 py-2 text-left">Tier</th>
                  <th className="px-4 py-2 text-left">Score</th>
                  <th className="px-4 py-2 text-left">Match summary</th>
                  <th className="px-4 py-2 text-left">Risks / red flags</th>
                  <th className="px-4 py-2 text-left">Interview focus</th>
                  <th className="px-4 py-2 text-left">CV</th>
                  <th className="px-4 py-2 text-left">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(({ application, candidate, scored, cvUrl }) => (
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

                    {/* Stage / status */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-900">
                        {application.stage || "APPLIED"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {application.status || "PENDING"}
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

                    {/* Match summary */}
                    <td className="px-4 py-3">
                      <p
                        className="max-w-xs text-[11px] text-slate-600 line-clamp-3"
                        title={scored.reason}
                      >
                        {scored.reason}
                      </p>
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

                    {/* Applied at */}
                    <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">
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
