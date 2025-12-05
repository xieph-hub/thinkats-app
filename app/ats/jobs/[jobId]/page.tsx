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
    // Don’t trust the shape too much – treat as any and normalise
    const scoredRaw: any = computeApplicationScore({
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
        stage: app.stage,
        status: app.status,
        // Pass ISO string to the client component
        createdAt: app.createdAt.toISOString(),
      },
      candidate: app.candidate,
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

  const tierCounts = rows.reduce(
    (acc, row) => {
      const t = String(row.scored.tier || "D").toUpperCase() as Tier;
      if (t === "A" || t === "B" || t === "C" || t === "D") {
        acc[t] += 1;
      } else {
        acc.D += 1;
      }
      return acc;
    },
    { A: 0, B: 0, C: 0, D: 0 } as Record<Tier, number>,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Job pipeline
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/ats/jobs"
                className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
              >
                ← Back to all jobs
              </Link>
            </div>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">
              {job.title}
            </h1>
            <p className="text-xs text-slate-600">
              {job.clientCompany?.name ? `${job.clientCompany.name} · ` : ""}
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

      {/* Pipeline table with inline stage / status + filters */}
      <JobPipelineTable rows={rows} />
    </div>
  );
}
