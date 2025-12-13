// lib/jobs.ts
import { prisma } from "@/lib/prisma";
import { getAtsTenantScope } from "@/lib/auth/tenantAccess";
import { getResourcinTenant } from "@/lib/tenant";

/**
 * ATS: jobs visible for current user (tenant-safe).
 * - Super admin: returns jobs for activeTenantId (host-based), not “all tenants” by default.
 *   (Global standard: you only show cross-tenant when you explicitly build that UI.)
 */
export async function listTenantJobsForAts() {
  const scope = await getAtsTenantScope();

  if (!scope.activeTenantId) return [];

  // Non-admin must belong to the active tenant
  if (!scope.isSuperAdmin && scope.allowedTenantIds && !scope.allowedTenantIds.includes(scope.activeTenantId)) {
    return [];
  }

  return prisma.job.findMany({
    where: {
      tenantId: scope.activeTenantId,
      status: { not: "closed" },
    },
    orderBy: { createdAt: "desc" },
    include: {
      clientCompany: true,
      _count: { select: { applications: true } },
    },
  });
}

export async function getJobWithPipelineForAts(jobId: string) {
  const scope = await getAtsTenantScope();
  if (!scope.activeTenantId) return null;

  if (!scope.isSuperAdmin && scope.allowedTenantIds && !scope.allowedTenantIds.includes(scope.activeTenantId)) {
    return null;
  }

  return prisma.job.findFirst({
    where: { id: jobId, tenantId: scope.activeTenantId },
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
 * Public jobs for Resourcin careers page (still fine).
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
