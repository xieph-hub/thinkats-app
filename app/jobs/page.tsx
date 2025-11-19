// app/jobs/page.tsx

import JobBoardClient from "./JobBoardClient";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// We want this to always fetch fresh data from the DB
export const dynamic = "force-dynamic";

export default async function JobsPage() {
  // 1) Read from the *new* Prisma Job table
  const dbJobs = await prisma.job.findMany({
    where: { isPublished: true },
    include: {
      tenant: true,
      clientCompany: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 2) Map Prisma rows into the shape your JobBoardClient expects
  const jobs = dbJobs.map((job) => {
    const employerName =
      job.clientCompany?.name ?? job.tenant?.name ?? "Resourcin search";

    const nameForInitials =
      job.clientCompany?.name ?? job.tenant?.name ?? "Resourcin";

    const employerInitials = nameForInitials
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();

    const postedAt = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(job.createdAt);

    // Prisma `tags` is String[]
    const tags = job.tags ?? [];

    return {
      // required by your UI Job type
      id: job.id,
      slug: job.slug,
      title: job.title,
      employerInitials,
      employerName,
      // map Prisma fields → UI fields
      department: job.function,
      location: job.location,
      workType: job.employmentType,
      // you also have `type` on the UI Job – we’ll mirror employmentType
      type: job.employmentType,
      seniority: job.seniority,
      // you don’t have salary range / highlight in Prisma, so we keep them null/summary
      salaryRange: null,
      highlight: job.summary,
      tags,
      postedAt,
    };
  });

  // cast to any to avoid TS being fussy about the exact Job type shape
  return <JobBoardClient jobs={jobs as any} />;
}
