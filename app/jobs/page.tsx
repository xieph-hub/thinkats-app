// app/jobs/page.tsx
import { listPublicJobsForCurrentTenant } from "@/lib/jobs";
import JobsExplorer from "./JobsExplorer";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await listPublicJobsForCurrentTenant();

  return <JobsExplorer initialJobs={jobs} />;
}
