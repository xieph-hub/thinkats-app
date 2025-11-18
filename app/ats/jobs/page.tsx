// app/ats/jobs/page.tsx
import { getCurrentUserAndTenants } from '@/lib/getCurrentUserAndTenants';
import { getJobsForTenant } from '@/lib/jobs';

export default async function JobsPage() {
  const { currentTenant } = await getCurrentUserAndTenants();
  if (!currentTenant) {
    // redirect to onboarding / error
  }

  const jobs = await getJobsForTenant(currentTenant.id);

  // render jobs list...
}
