// lib/jobs.ts
import { prisma } from "@/lib/prisma";

export async function listTenantJobs(tenantId: string) {
  return prisma.job.findMany({
    where: {
      tenantId,
      status: {
        not: "CLOSED", // adjust if your enum name differs
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
