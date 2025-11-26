// lib/jobs.ts
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

/**
 * Quick check to decide if a string looks like a UUID.
 * Prevents Prisma from trying to parse slugs as UUIDs.
 */
function looksLikeUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value,
  );
}

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
 * Filters by tenant + status + internalOnly.
 * Used by /jobs
 */
export async function listPublicJobsForResourcin() {
  const tenant = await getResourcinTenant();

  return prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      status: "OPEN",      // only open roles
      internalOnly: false, // exclude internal-only roles
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
 * Allows lookup by ID (UUID) or slug.
 * Used by /jobs/[jobIdOrSlug]
 */
export async function getPublicJobBySlugOrId(jobIdOrSlug: string) {
  const tenant = await getResourcinTenant();

  const baseWhere = {
    tenantId: tenant.id,
    status: "OPEN",
    internalOnly: false,
  } as const;

  const where = looksLikeUuid(jobIdOrSlug)
    ? { ...baseWhere, id: jobIdOrSlug }
    : { ...baseWhere, slug: jobIdOrSlug };

  return prisma.job.findFirst({
    where,
    include: {
      clientCompany: true,
    },
  });
}
