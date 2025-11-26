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
      // Show everything that is not explicitly closed
      status: {
        not: "closed",
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
 * Single job + its pipeline (applications, candidates) for ATS.
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
        // Use a field that actually exists on JobApplication
        orderBy: { createdAt: "desc" },
        include: {
          candidate: true,
          // ⬇️ removed pipelineStage because Prisma model doesn't have it
          // pipelineStage: true,
        },
      },
    },
  });
}

/**
 * Public jobs for Resourcin careers page.
 * Filters by tenant + visibility + status + internalOnly=false.
 * Used by /jobs
 */
export async function listPublicJobsForResourcin() {
  const tenant = await getResourcinTenant();

  return prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      visibility: "public",
      status: "open",
      internalOnly: false,
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
 * Single public job for careers detail page.
 * Allows lookup by ID or slug.
 * Used by /jobs/[jobIdOrSlug]
 */
export async function getPublicJobBySlugOrId(jobIdOrSlug: string) {
  const tenant = await getResourcinTenant();

  return prisma.job.findFirst({
    where: {
      tenantId: tenant.id,
      visibility: "public",
      status: "open",
      internalOnly: false,
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
