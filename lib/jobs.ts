// lib/jobs.ts
import { prisma } from "@/lib/prisma"
import { getCurrentTenantId } from "@/lib/tenant"

// List all jobs for current tenant
export async function listJobsForCurrentTenant() {
  const tenantId = getCurrentTenantId()
  return prisma.job.findMany({
    where: { tenant: { id: tenantId } },
    orderBy: { createdAt: "desc" },
  })
}

// Get a single job by slug for current tenant
export async function getJobForCurrentTenantBySlug(slug: string) {
  const tenantId = getCurrentTenantId()
  return prisma.job.findFirst({
    where: {
      slug,
      tenant: { id: tenantId },
    },
  })
}
