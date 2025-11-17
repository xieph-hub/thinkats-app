// app/jobs/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDefaultTenant } from "@/lib/tenant";
import JobBoardClient from "./JobBoardClient";

export const metadata: Metadata = {
  title: "Jobs | Resourcin",
  description:
    "Curated roles across Product, Engineering, People and Operations. Browse open roles or share your profile once via the Resourcin talent network.",
};

export default async function JobsPage() {
  const tenant = await getDefaultTenant();

  // Fetch jobs from your database
  const dbJobs = await prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      isPublished: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // If you still want to keep your old static jobs as fallback,
  // you can import them and merge. For now, just use DB jobs.
  return <JobBoardClient initialJobs={dbJobs as any} />;
}
