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
      // keep CLOSED jobs out of the main ATS jobs list
      status: {
        not: "closed",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      clientCompany: true,
      _count: {
        select: {
          applications: true,
        },
      },
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
 * Filters by tenant + isPublished + isPublic + status = open.
 * Used by /jobs
 */
export async function listPublicJobsForResourcin() {
  const tenant = await getResourcinTenant();

  return prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      isPublished: true,
      isPublic: true,
      status: "open",
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
      status: "open",
      OR: [{ id: jobIdOrSlug }, { slug: jobIdOrSlug }],
    },
    include: {
      clientCompany: true,
    },
  });
}
