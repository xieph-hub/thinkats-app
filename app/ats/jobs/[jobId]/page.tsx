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

type JobRow = {
  id: string;
  title: string;
  location: string | null;
  employment_type: string | null;
  department: string | null;
  seniority: string | null;
  created_at: string | null;
};

type Application = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  cvUrl: string | null;
  coverLetter: string | null;
  source: string | null;
  stage: string;
  status: string;
  createdAt: string;
};

export const revalidate = 0; // always fresh

export default async function JobPipelinePage({ params }: PageProps) {
  const { jobId } = params;
  const { user, currentTenant } = await getCurrentUserAndTenants();

  // Not signed in as ATS user
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

  // User has no tenant linked
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
      seniority,
      created_at
    `
    )
    .eq("id", jobId)
    .eq("tenant_id", currentTenant.id)
    .single<JobRow>();

  if (jobError || !jobRow) {
    console.error("Error loading job for pipeline", jobError);
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

  // 2) Load job applications from job_applications
  const { data: rawApplications, error: appsError } = await supabase
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
    .eq("job_id", jobRow.id)
    .order("created_at", { ascending: false });

  if (appsError) {
    console.error("Error loading job_applications", appsError);
  }

  const applications: Application[] =
    rawApplications?.map((row: any) => ({
      id: row.id,
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
    })) ?? [];

  const applicationsCount = applications.length;

  const createdLabel = jobRow.created_at
    ? new Date(jobRow.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
    : "";

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
          {createdLabel && (
            <p className="mt-0.5 text-xs text-slate-500">
              Role created {createdLabel}
            </p>
          )}
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

      {/* Applications table (client-side with filters & inline updates) */}
      <ApplicationsTableClient applications={applications} />
    </main>
  );
}
