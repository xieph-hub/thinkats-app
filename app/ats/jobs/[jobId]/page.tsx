// app/ats/jobs/[jobId]/page.tsx
import Link from "next/link";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import ApplicationsTableClient from "./ApplicationsTableClient";

type PageProps = {
  params: { jobId: string };
};

// Helper – get job + its applications scoped to the current tenant
async function getJobAndApplications(jobId: string, tenantId: string) {
  const supabase = await createSupabaseServerClient();

  // ✅ Fetch the job (making sure it belongs to this tenant)
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(
      `
        id,
        title,
        location,
        employment_type,
        function,
        is_published,
        created_at,
        tenant_id
      `
    )
    .eq("id", jobId)
    .eq("tenant_id", tenantId)
    .single();

  if (jobError || !job) {
    console.error("❌ Job not found or tenant mismatch:", jobError);
    return { job: null, applications: [] };
  }

  // ✅ Fetch all applications for this job under the same tenant
  const { data: applications, error: appError } = await supabase
    .from("applications")
    .select(
      `
        id,
        candidate_name,
        candidate_email,
        candidate_phone,
        stage,
        status,
        created_at
      `
    )
    .eq("job_id", jobId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (appError) {
    console.error("⚠️ Error loading applications:", appError);
  }

  return { job, applications: applications ?? [] };
}

export default async function JobPipelinePage({ params }: PageProps) {
  const { user, currentTenant } = await getCurrentUserAndTenants();

  // 🚪 Not signed in
  if (!user) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          ThinkATS – sign in to view this job
        </h1>
        <p className="text-sm text-slate-600">
          You need to be signed in as a client or internal Resourcin user to view job pipelines in ThinkATS.
        </p>
        <Link
          href="/login?role=client"
          className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a]"
        >
          Go to client login
        </Link>
      </main>
    );
  }

  // 🚫 No tenant configured
  if (!currentTenant) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          ThinkATS – no tenant configured
        </h1>
        <p className="text-sm text-slate-600">
          You&apos;re authenticated but your user isn&apos;t linked to any ATS tenant yet.
          Please make sure your account has a tenant assignment in Supabase.
        </p>
        <Link
          href="/ats"
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Back to ATS dashboard
        </Link>
      </main>
    );
  }

  // ✅ Load job + applications
  const { job, applications } = await getJobAndApplications(
    params.jobId,
    currentTenant.id
  );

  // 🕳️ Not found or tenant mismatch
  if (!job) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          Job not found
        </h1>
        <p className="text-sm text-slate-600">
          This job either doesn&apos;t exist, doesn&apos;t belong to your tenant,
          or has been removed.
        </p>
        <Link
          href="/ats"
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Back to ATS dashboard
        </Link>
      </main>
    );
  }

  // ✅ Page layout – job header + applications table
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
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
          {job.function && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.function}
            </span>
          )}
        </div>
      </header>

      {/* Applications table (client-side) */}
      <ApplicationsTableClient applications={applications as any} />
    </main>
  );
}
