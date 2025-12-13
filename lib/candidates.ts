// lib/candidates.ts
import { prisma } from "@/lib/prisma";

export async function getCandidateDetail(tenantId: string, candidateId: string) {
  // Candidate must match tenant
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, tenantId },
    include: {
      tags: { include: { tag: true } },
      skills: { include: { skill: true } },
    },
  });

  if (!candidate) return null;

  // Applications must belong to jobs under same tenant
  const applications = await prisma.jobApplication.findMany({
    where: {
      candidateId,
      job: { tenantId },
    },
    orderBy: { createdAt: "desc" },
    include: {
      job: { select: { id: true, title: true, department: true, location: true } },
      scoringEvents: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // Notes already have tenantId - enforce it
  const notes = await prisma.note.findMany({
    where: { candidateId, tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      // if you want author, you may need an author relation in Prisma schema (currently you store authorId + authorName)
    },
  });

  return { candidate, applications, notes };
}
