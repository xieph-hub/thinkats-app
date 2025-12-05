// app/ats/jobs/[jobId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getScoringConfigForJob } from "@/lib/scoring/server";
import { computeApplicationScore } from "@/lib/scoring/compute";
import JobPipelineTable, {
  JobPipelineRow,
  TierLetter,
} from "@/components/ats/jobs/JobPipelineTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Job pipeline",
  description:
    "ATS job detail and candidate pipeline view with scoring tiers and CV access.",
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

  const rows: JobPipelineRow[] = job.applications.map((app) => {
    const scored = computeApplicationScore({
      application: app,
      candidate: app.candidate,
      job,
      config,
    });

    const tier: TierLetter =
      scored.tier === "A" ||
      scored.tier === "B" ||
      scored.tier === "C" ||
      scored.tier === "D"
        ? (scored.tier as TierLetter)
        : "D";

    const cvUrl = app.cvUrl || app.candidate?.cvUrl || null;

    return {
      applicationId: app.id,
      candidateId: app.candidate?.id ?? null,
      fullName: app.fullName,
      email: app.email,
      currentTitle: app.candidate?.currentTitle ?? null,
      currentCompany: app.candidate?.currentCompany ?? null,
      stage: (app.stage as string | null) ?? null,
      status: (app.status as string | null) ?? null,
      tier,
      score: scored.score ?? 0,
      reason: scored.reason ?? "",
      risks: Array.isArray(scored.risks) ? scored.risks : [],
      redFlags: Array.isArray(scored.redFlags)
        ? scored.redFlags
        : [],
      interviewFocus: Array.isArray(scored.interviewFocus)
        ? scored.interviewFocus
        : [],
      cvUrl,
      appliedAt: app.createdAt.toISOString(),
    };
  });

  const tierCounts: Record<TierLetter, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };
  for (const row of rows) {
    tierCounts[row.tier] += 1;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
      {/* Page header */}
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Job pipeline
        </p>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-900">
              {job.title}
            </h1>
            <p className="text-xs text-slate-600">
              {job.clientCompany?.name
                ? `${job.clientCompany.name} · `
                : ""}
              {job.location || job.workMode || "Location not set"}
            </p>
            <p className="text-[11px] text-slate-500">
              Pipeline view with scoring tiers, quick access to CVs
              and deep candidate profiles. Click a candidate name to
              open the full profile.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-[11px] text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                Applications:{" "}
                <span className="ml-1 font-semibold text-slate-800">
                  {rows.length}
                </span>
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                A:{" "}
                <span className="ml-1 font-semibold">
                  {tierCounts.A}
                </span>
              </span>
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1">
                B:{" "}
                <span className="ml-1 font-semibold">
                  {tierCounts.B}
                </span>
              </span>
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
                C:{" "}
                <span className="ml-1 font-semibold">
                  {tierCounts.C}
                </span>
              </span>
              <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1">
                D:{" "}
                <span className="ml-1 font-semibold">
                  {tierCounts.D}
                </span>
              </span>
            </div>

            <Link
              href={
                job.slug ? `/jobs/${job.slug}` : `/jobs/${job.id}`
              }
              className="text-[11px] font-medium text-[#172965] hover:underline"
            >
              View public job
            </Link>
          </div>
        </div>
      </header>

      {/* Pipeline table (client) */}
      <JobPipelineTable rows={rows} tierCounts={tierCounts} />
    </div>
  );
}
