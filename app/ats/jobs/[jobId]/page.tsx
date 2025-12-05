// app/ats/jobs/[jobId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getScoringConfigForJob } from "@/lib/scoring/server";
import { computeApplicationScore } from "@/lib/scoring/compute";
import JobPipelineTable from "@/components/ats/jobs/JobPipelineTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Job pipeline",
  description:
    "ATS job detail and candidate pipeline view with scoring tiers and CV access.",
};

type Tier = "A" | "B" | "C" | "D";

type PipelineRow = {
  application: {
    id: string;
    fullName: string;
    email: string;
    stage: string | null;
    status: string | null;
    createdAt: string; // ISO string
  };
  candidate: {
    id: string;
    currentTitle: string | null;
    currentCompany: string | null;
  } | null;
  scored: {
    score: number;
    tier: Tier | string;
    reason: string;
    risks: string[];
    redFlags: string[];
    interviewFocus: string[];
    engine?: string;
    engineVersion?: string;
  };
  cvUrl: string | null;
};

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

  const rows: PipelineRow[] = job.applications.map((app) => {
    const scored = computeApplicationScore({
      application: app,
      candidate: app.candidate,
      job,
      config,
    });

    const cvUrl = app.cvUrl || app.candidate?.cvUrl || null;

    return {
      application: {
        id: app.id,
        fullName: app.fullName,
        email: app.email,
        stage: app.stage ?? null,
        status: app.status ?? null,
        createdAt: app.createdAt.toISOString(),
      },
      candidate: app.candidate
        ? {
            id: app.candidate.id,
            currentTitle: app.candidate.currentTitle,
            currentCompany: app.candidate.currentCompany,
          }
        : null,
      scored: {
        score: scored.score,
        tier: scored.tier,
        reason: scored.reason,
        risks: scored.risks ?? [],
        redFlags: scored.redFlags ?? [],
        interviewFocus: scored.interviewFocus ?? [],
        engine: scored.engine,
        engineVersion: scored.engineVersion,
      },
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
    const t = String(row.scored.tier || "D").toUpperCase() as Tier | string;
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
            <h1 className="text-xl font-semibold text-[#172965]">
              {job.title}
            </h1>
            <p className="text-xs text-slate-600">
              {job.clientCompany?.name ? `${job.clientCompany.name} · ` : ""}
              {job.location || job.workMode || "Location not set"}
            </p>
            {job.slug && (
              <p className="mt-1 text-[11px] text-slate-500">
                Public link:{" "}
                <Link
                  href={job.slug ? `/jobs/${job.slug}` : `/jobs/${job.id}`}
                  className="text-[#172965] underline underline-offset-4"
                >
                  View public job
                </Link>
              </p>
            )}
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
          Filter by tier, stage and risk. Update stage and status inline as you
          move candidates through this mandate.
        </p>
      </header>

      <JobPipelineTable rows={rows} />
    </div>
  );
}
