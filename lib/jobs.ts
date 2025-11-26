// lib/jobs.ts
import { prisma } from "@/lib/prisma";

/**
 * Internal ATS job list for a given tenant.
 * Used by /ats/jobs
 */
export async function listTenantJobs(tenantId: string) {
  return prisma.job.findMany({
    where: {
      tenantId,
      status: {
        not: "CLOSED", // adjust if your enum value is different
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      clientCompany: true,
    },
  });
}

/**
 * Single job + its pipeline (applications, candidates, stages) for ATS.
 * Used by /ats/jobs/[jobId]
 */
export async function getJobWithPipeline(jobId: string, tenantId: string) {
  return prisma.job.findFirst({
    where: {
      id: jobId,
      tenantId,
    },
    include: {
      clientCompany: true,
      applications: {
        orderBy: { submittedAt: "desc" },
        include: {
          candidate: true,
          pipelineStage: true,
        },
      },
    },
  });
}
