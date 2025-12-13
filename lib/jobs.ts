// lib/jobs.ts
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { getAllowedTenantIdsForRequest } from "@/lib/auth/tenantAccess";

/**
 * Internal ATS job list for the CURRENT user context.
 * Used by /ats/jobs
 *
 * ✅ Tenant-safe: only returns jobs for tenant(s) the user can access.
 * ✅ Tenant host-safe: if on slug.thinkats.com, it will be forced to that tenant.
 */
export async function listAtsJobsForCurrentUser() {
  const { allowedTenantIds } = await getAllowedTenantIdsForRequest();

  if (allowedTenantIds.length === 0) {
    return [];
  }

  return prisma.job.findMany({
    where: {
      tenantId: { in: allowedTenantIds },
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
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });
}

/**
 * Single job + its pipeline (applications, candidates) for ATS.
 * Used by /ats/jobs/[jobId]
 *
 * ✅ Tenant-safe: job must belong to a tenant the user can access.
 */
export async function getAtsJobWithPipelineForCurrentUser(jobId: string) {
  const { allowedTenantIds } = await getAllowedTenantIdsForRequest();

  if (allowedTenantIds.length === 0) {
    return null;
  }

  return prisma.job.findFirst({
    where: {
      id: jobId,
      tenantId: { in: allowedTenantIds },
    },
    include: {
      clientCompany: true,
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          candidate: true,
        },
      },
    },
  });
}

/**
 * Public jobs for Resourcin careers page.
 * Filters by tenant + visibility + status + internalOnly=false.
 * Used by /jobs
 *
 * (unchanged)
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
 *
 * (unchanged)
 */
export async function getPublicJobBySlugOrId(jobIdOrSlug: string) {
  const tenant = await getResourcinTenant();

  return prisma.job.findFirst({
    where: {
      tenantId: tenant.id,
      visibility: "public",
      status: "open",
      internalOnly: false,
      OR: [{ id: jobIdOrSlug }, { slug: jobIdOrSlug }],
    },
    include: {
      clientCompany: true,
    },
  });
}
