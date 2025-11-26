// lib/jobs.ts
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

/**
 * Internal ATS job list for a given tenant.
 * Used by /ats/jobs
 */
export async function listTenantJobs(tenantId: string) {
  return prisma.job.findMany({
    where: {
      tenantId,
      status: {
        not: "CLOSED",
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

/**
 * Public jobs for Resourcin careers page.
 * Filters by tenant + isPublished + isPublic + status = OPEN.
 * Used by /jobs
 */
export async function listPublicJobsForResourcin() {
  const tenant = await getResourcinTenant();

  return prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      isPublished: true,
      isPublic: true,
      status: "OPEN",
    },
    orderBy: {
      publishedAt: "desc",
    },
    include: {
      clientCompany: true,
    },
  });
}

/**
 * Single public job for careers detail page.
 * Allows lookup by ID or slug.
 * Used by /jobs/[jobIdOrSlug]
 */
export async function getPublicJobBySlugOrId(jobIdOrSlug: string) {
  const tenant = await getResourcinTenant();

  return prisma.job.findFirst({
    where: {
      tenantId: tenant.id,
      isPublished: true,
      isPublic: true,
      status: "OPEN",
      OR: [
        { id: jobIdOrSlug },
        { slug: jobIdOrSlug },
      ],
    },
    include: {
      clientCompany: true,
    },
  });
}
