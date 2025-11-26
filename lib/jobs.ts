// lib/jobs.ts
import { prisma } from "@/lib/prisma";

export async function listTenantJobs(tenantId: string) {
  return prisma.job.findMany({
    where: {
      tenantId,
      status: {
        not: "CLOSED", // adjust if your enum name is different
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
