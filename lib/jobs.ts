// lib/jobs.ts
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { getAllowedTenantIdsForRequest } from "@/lib/auth/tenantAccess";

/**
 * Internal ATS job list for the CURRENT user context.
 * Used by /ats/jobs
 */
export async function listTenantJobsForCurrentUser() {
  const { isSuperAdmin, allowedTenantIds } = await getAllowedTenantIdsForRequest();

  // Not logged in or no tenant membership
  if (!isSuperAdmin && (!allowedTenantIds || allowedTenantIds.length === 0)) {
    return [];
  }

  return prisma.job.findMany({
    where: {
      ...(isSuperAdmin ? {} : { tenantId: { in: allowedTenantIds! } }),
      status: { not: "closed" },
    },
    orderBy: { createdAt: "desc" },
    include: {
      clientCompany: true,
      _count: { select: { applications: true } },
    },
  });
}

/**
 * Single job + its pipeline (applications, candidates) for ATS.
 * Used by /ats/jobs/[jobId]
 */
export async function getJobWithPipelineForCurrentUser(jobId: string) {
  const { isSuperAdmin, allowedTenantIds } = await getAllowedTenantIdsForRequest();

  if (!isSuperAdmin && (!allowedTenantIds || allowedTenantIds.length === 0)) {
    return null;
  }

  return prisma.job.findFirst({
    where: {
      id: jobId,
      ...(isSuperAdmin ? {} : { tenantId: { in: allowedTenantIds! } }),
    },
    include: {
      clientCompany: true,
      applications: {
        orderBy: { createdAt: "desc" },
        include: { candidate: true },
      },
    },
  });
}

/**
 * Public jobs for Resourcin careers page.
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
    orderBy: { createdAt: "desc" },
    include: { clientCompany: true },
  });
}

/**
 * Single public job for careers detail page.
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
      OR: [{ id: jobIdOrSlug }, { slug: jobIdOrSlug }],
    },
    include: { clientCompany: true },
  });
}
