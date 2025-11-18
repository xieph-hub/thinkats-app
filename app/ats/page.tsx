// app/ats/page.tsx
import { getCurrentUserAndTenants } from '@/lib/getCurrentUserAndTenants';
import { getJobsForTenant } from '@/lib/jobs';

export default async function ATSHomePage() {
  const { profile, currentTenant } = await getCurrentUserAndTenants();
  if (!currentTenant) {
    // maybe show "no tenant" message or an onboarding flow
  }

  const jobs = await getJobsForTenant(currentTenant.id);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">
        Hi {profile?.full_name || 'there'}, welcome to ThinkATS
      </h1>
      <p className="text-sm text-neutral-500 mt-1">
        Tenant: {currentTenant?.name}
      </p>

      <section className="mt-6">
        <h2 className="text-lg font-medium mb-2">Open Roles</h2>
        {/* Render jobs as cards or table */}
        {/* link to /ats/jobs/[jobId] */}
      </section>
    </main>
  );
}
