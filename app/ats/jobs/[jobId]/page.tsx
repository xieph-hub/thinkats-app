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

// always fetch fresh from DB
export const revalidate = 0;

export default async function JobPipelinePage({ params }: PageProps) {
  const { user, currentTenant } = await getCurrentUserAndTenants();

  // 1) Not signed in at all
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

  // 2) Signed in but no tenant linked
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

  // 3) Load the job directly from the real `jobs` table
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(
      `
        id,
        tenant_id,
        title,
        department,
        location,
        employment_type,
        seniority,
        description,
        status,
        visibility,
        tags,
        created_at,
        slug
      `
    )
    .eq("id", params.jobId)
    .maybeSingle();

  if (jobError) {
    console.error("❌ Error loading job in JobPipelinePage:", {
      jobError,
      jobId: params.jobId,
      tenantId: currentTenant.id,
    });
  }

  // 4) If job does not exist OR not the same tenant → show "Job not found"
  if (!job || job.tenant_id !== currentTenant.id) {
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

  // 5) Load applications for this job from job_applications
  //    Map snake_case → camelCase to match the old JobApplication shape.
  let applications: any[] = [];

  try {
    const { data: rawApps, error: appsError } = await supabase
      .from("job_applications")
      .select(
        `
          id,
          job_id,
          candidate_id,
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
          created_at,
          updated_at
        `
      )
      .eq("job_id", job.id)
      .order("created_at", { ascending: false });

    if (appsError) {
      console.error("⚠️ Error loading applications in JobPipelinePage:", {
        appsError,
        jobId: params.jobId,
      });
      applications = [];
    } else if (rawApps) {
      // Map to camelCase so ApplicationsTableClient can treat them like the old JobApplication rows
      applications = rawApps.map((row) => ({
        id: row.id,
        jobId: row.job_id,
        candidateId: row.candidate_id,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        location: row.location,
        linkedinUrl: row.linkedin_url,
        portfolioUrl: row.portfolio_url,
        cvUrl: row.cv_url,
        coverLetter: row.cover_letter,
        source: row.source,
        stage: row.stage,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }
  } catch (err) {
    console.error(
      "⚠️ Unexpected error loading applications in JobPipelinePage:",
      {
        err,
        jobId: params.jobId,
      }
    );
    applications = [];
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
          {job.seniority && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.seniority}
            </span>
          )}
        </div>
      </header>

      {/* Applications table (now gets real data when present) */}
      <ApplicationsTableClient applications={applications as any} />
    </main>
  );
}
