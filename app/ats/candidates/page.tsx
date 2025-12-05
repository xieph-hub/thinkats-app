// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getScoringConfigForJob } from "@/lib/scoring/server";
import { computeApplicationScore } from "@/lib/scoring/compute";
import CandidatesTable from "@/components/ats/candidates/CandidatesTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Candidates",
  description:
    "Cross-job view of candidates, scoring tiers, risks and interview focus across your ATS.",
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
    take: 300,
  });

  const jobIds = Array.from(new Set(applications.map((app) => app.jobId)));
  const configByJobId = new Map<string, any>();

  for (const jobId of jobIds) {
    const { config } = await getScoringConfigForJob(jobId);
    configByJobId.set(jobId, config);
  }

  const rows = applications.map((app) => {
    const config = configByJobId.get(app.jobId);
    const scoredRaw: any = computeApplicationScore({
      application: app,
      candidate: app.candidate,
      job: app.job,
      config,
    });

    const cvUrl = app.cvUrl || app.candidate?.cvUrl || null;

    return {
      application: {
        id: app.id,
        fullName: app.fullName,
        email: app.email,
        stage: app.stage,
        status: app.status,
        createdAt: app.createdAt.toISOString(),
      },
      candidate: app.candidate,
      job: {
        id: app.job.id,
        title: app.job.title,
        location: app.job.location,
        workMode: (app.job as any).workMode ?? null,
        clientName: app.job.clientCompany?.name ?? null,
      },
      scored: {
        score:
          typeof scoredRaw.score === "number" ? scoredRaw.score : 0,
        tier: (scoredRaw.tier ?? "D") as string,
        reason: scoredRaw.reason ?? "",
        risks: (scoredRaw.risks ?? []) as string[],
        redFlags: (scoredRaw.redFlags ?? []) as string[],
        interviewFocus: (scoredRaw.interviewFocus ?? []) as string[],
      },
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

      <CandidatesTable rows={rows} />
    </div>
  );
}
