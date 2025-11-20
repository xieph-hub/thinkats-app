// app/ats/jobs/[jobId]/page.tsx

import Link from "next/link";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import ApplicationsTableClient from "./ApplicationsTableClient";

type PageProps = {
  params: {
    jobId: string;
  };
};

export const revalidate = 0;

export default async function JobPipelinePage({ params }: PageProps) {
  const { user, currentTenant } = await getCurrentUserAndTenants();

  // Not logged in
  if (!user) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          ThinkATS – sign in to view this job
        </h1>
        <p className="text-sm text-slate-600">
          You need to be signed in as a client or internal Resourcin user to
          view job pipelines in ThinkATS.
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

  // User with no tenant mapping
  if (!currentTenant) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          ThinkATS – no tenant configured
        </h1>
        <p className="text-sm text-slate-600">
          You&apos;re authenticated but your user isn&apos;t linked to any ATS
          tenant yet. Please make sure your account has a tenant assignment in
          Supabase.
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

  const supabase = await createSupabaseServerClient();

  // 1) Load the job for this tenant
  const { data: jobRow, error: jobError } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      location,
      employment_type,
      department,
      seniority
    `
    )
    .eq("id", params.jobId)
    .eq("tenant_id", currentTenant.id)
    .single();

  if (jobError || !jobRow) {
    console.error("Job not found for tenant in ATS", jobError);
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          Job not found
        </h1>
        <p className="text-sm text-slate-600">
          This job either doesn&apos;t exist, doesn&apos;t belong to your
          tenant, or has been removed.
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

  // 2) Load applications for this job from job_applications
  const { data: appRows, error: appsError } = await supabase
    .from("job_applications")
    .select(
      `
      id,
      full_name,
      email,
      phone,
      location,
      linkedin_url,
      portfolio_url,
      cv_url,
      cover_letter,
      source,
      stage,
      status,
      created_at
    `
    )
    .eq("job_id", params.jobId)
    .order("created_at", { ascending: false });

  if (appsError) {
    console.error("Error loading job applications", appsError);
  }

  const applications =
    appRows?.map((row: any) => ({
      id: row.id as string,
      fullName: row.full_name as string,
      email: row.email as string,
      phone: (row.phone as string | null) ?? null,
      location: (row.location as string | null) ?? null,
      linkedinUrl: (row.linkedin_url as string | null) ?? null,
      portfolioUrl: (row.portfolio_url as string | null) ?? null,
      cvUrl: (row.cv_url as string | null) ?? null,
      coverLetter: (row.cover_letter as string | null) ?? null,
      source: (row.source as string | null) ?? null,
      stage: (row.stage as string) ?? "APPLIED",
      status: (row.status as string) ?? "PENDING",
      createdAt: row.created_at as string,
    })) ?? [];

  const applicationsCount = applications.length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Page header */}
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            ThinkATS · Pipeline
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {jobRow.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {applicationsCount} application
            {applicationsCount === 1 ? "" : "s"} so far.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          {jobRow.location && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {jobRow.location}
            </span>
          )}
          {jobRow.employment_type && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {jobRow.employment_type}
            </span>
          )}
          {jobRow.department && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {jobRow.department}
            </span>
          )}
          {jobRow.seniority && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {jobRow.seniority}
            </span>
          )}
        </div>
      </header>

      {/* Applications table (client-side) */}
      <ApplicationsTableClient applications={applications as any} />
    </main>
  );
}
