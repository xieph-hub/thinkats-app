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
      // With the new schema, status is a lowercase string ("open", "draft", "closed", etc.)
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
        // In the new schema we have createdAt on JobApplication, not submittedAt
        orderBy: { createdAt: "desc" },
        include: {
          candidate: true,
        },
      },
      // From the new JobStage model
      stages: {
        orderBy: { position: "asc" },
      },
    },
  });
}

/**
 * Public jobs for Resourcin careers page.
 * Filters by tenant + visibility + internalOnly + status = "open".
 * Used by /jobs
 */
export async function listPublicJobsForResourcin() {
  const tenant = await getResourcinTenant();

  return prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      visibility: "public",   // new field instead of isPublic
      status: "open",         // matches Job.status default
      internalOnly: false,    // don’t show internal-only jobs on the public careers page
    },
    orderBy: {
      createdAt: "desc",      // we no longer rely on publishedAt
    },
    include: {
      clientCompany: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
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
      clientCompany: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
    },
  });
}
