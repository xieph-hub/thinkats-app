// lib/jobs.ts
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import type { Job, ClientCompany } from "@prisma/client";

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
 * The shape we expect public jobs to have (for /jobs and /jobs/[jobIdOrSlug]).
 */
export type PublicJobWithClient = Job & {
  clientCompany: ClientCompany | null;
};

/**
 * Internal ATS job list for a given tenant.
 * Used by /ats/jobs
 */
export async function listTenantJobs(
  tenantId: string,
): Promise<PublicJobWithClient[]> {
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
 *
 * NOTE: This assumes you have applications + pipelineStage relations
 * wired in your Prisma schema. If not, we can simplify this further.
 */
export async function getJobWithPipeline(
  jobId: string,
  tenantId: string,
) {
  return prisma.job.findFirst({
    where: {
      id: jobId,
      tenantId,
    },
    include: {
      clientCompany: true,
      applications: {
        orderBy: { createdAt: "desc" }, // using createdAt, matches your schema
        include: {
          candidate: true,
          // If you don't have pipelineStage yet, comment this out:
          // pipelineStage: true,
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
export async function listPublicJobsForResourcin(): Promise<
  PublicJobWithClient[]
> {
  const tenant = await getResourcinTenant();

  return prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      status: "open",       // only open roles
      internalOnly: false,  // exclude internal-only roles
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
export async function getPublicJobBySlugOrId(
  jobIdOrSlug: string,
): Promise<PublicJobWithClient | null> {
  const tenant = await getResourcinTenant();

  const baseWhere = {
    tenantId: tenant.id,
    status: "open",
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
