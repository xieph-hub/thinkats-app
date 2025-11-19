// app/ats/jobs/[jobId]/page.tsx
import Link from "next/link";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";
import { getJobWithApplicationsForTenant } from "@/lib/jobApplications";
import ApplicationsTableClient from "./ApplicationsTableClient";

type PageProps = {
  params: {
    jobId: string;
  };
};

export default async function JobPipelinePage({ params }: PageProps) {
  const { user, currentTenant } = await getCurrentUserAndTenants();

  if (!user) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          ThinkATS – sign in to view this job
        </h1>
        <p className="text-sm text-slate-600">
          You need to be signed in as a client or internal
          Resourcin user to view job pipelines in ThinkATS.
        </p>
        <div>
          <Link
            href="/login?role=client"
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a]"
          >
            Go to client login
          </Link>
        </div>
      </main>
    );
  }

  if (!currentTenant) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          ThinkATS – no tenant configured
        </h1>
        <p className="text-sm text-slate-600">
          You&apos;re authenticated but your user isn&apos;t
          linked to any ATS tenant yet. Please make sure
          your account has a tenant assignment in Supabase.
        </p>
        <div>
          <Link
            href="/ats"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to ATS dashboard
          </Link>
        </div>
      </main>
    );
  }

  const { job, applications } = await getJobWithApplicationsForTenant(
    params.jobId,
    currentTenant.id as string
  );

  if (!job) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          Job not found
        </h1>
        <p className="text-sm text-slate-600">
          This job either doesn&apos;t exist, doesn&apos;t
          belong to your tenant, or has been removed.
        </p>
        <div>
          <Link
            href="/ats"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to ATS dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Page header */}
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            ThinkATS · Pipeline
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {job.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {applications.length} application
            {applications.length === 1 ? "" : "s"} so far.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          {job.location && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.location}
            </span>
          )}
          {job.employment_type && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.employment_type}
            </span>
          )}
          {job.department && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.department}
            </span>
          )}
        </div>
      </header>

      {/* Applications table (client-side) */}
      <ApplicationsTableClient applications={applications as any} />
    </main>
  );
}
