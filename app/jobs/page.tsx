// app/jobs/page.tsx

import JobBoardClient from "./JobBoardClient";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  // 1) Load published jobs from Prisma
  const jobs = await prisma.job.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      tenant: true,
      clientCompany: true,
    },
  });

  // 2) Map to the shape the JobBoardClient expects
  const mappedJobs = jobs.map((job) => {
    const employerName =
      job.clientCompany?.name ?? job.tenant?.name ?? "Resourcin search";

    const nameForInitials =
      job.clientCompany?.name ?? job.tenant?.name ?? "Resourcin";

    const initials = nameForInitials
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();

    const postedAt = new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(job.createdAt);

    // SIMPLE heuristic for work type from tags
    const workTypeFromTags = (() => {
      const tags = job.tags ?? [];
      if (tags.some((t) => t.toLowerCase().includes("remote"))) return "Remote";
      if (tags.some((t) => t.toLowerCase().includes("hybrid"))) return "Hybrid";
      return "Onsite";
    })();

    return {
      slug: job.slug,
      title: job.title,
      employerInitials: initials,
      employerName,
      department: job.function ?? "General",
      location: job.location ?? "Not specified",
      workType: workTypeFromTags,
      type: job.employmentType ?? "Full-time",
      seniority: job.seniority ?? "Unspecified",
      salaryRange: null as string | null,
      highlight: job.summary ?? null,
      tags: job.tags ?? [],
      postedAt,
    };
  });

  return <JobBoardClient jobs={mappedJobs} />;
}
