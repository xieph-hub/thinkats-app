// app/ats/jobs/[jobId]/page.tsx
import Link from "next/link";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import ApplicationsTableClient from "./ApplicationsTableClient";

export const revalidate = 0;

type PageProps = {
  params: {
    jobId: string;
  };
};

type AtsJob = {
  id: string;
  title: string;
  location: string | null;
  department: string | null;
  employmentType: string | null;
  seniority: string | null;
  status: string;
  createdAt: string | null;
};

export type AtsApplication = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  cvUrl?: string | null;
  source?: string | null;
  stage: string;
  status: string;
  createdAt: string | null;
};

async function loadJobAndApplications(
  jobId: string,
  tenantId: string
): Promise<{ job: AtsJob | null; applications: AtsApplication[] }> {
  const supabase = await createSupabaseServerClient();

  // ---- 1) Load job (scoped to tenant) ----
  const { data: jobRows, error: jobError } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      location,
      department,
      employment_type,
      seniority,
      status,
      created_at
    `
    )
    .eq("id", jobId)
    .eq("tenant_id", tenantId)
    .limit(1);

  if (jobError) {
    console.error("Error loading ATS job", jobError);
  }

  const jobRow = jobRows && jobRows.length > 0 ? jobRows[0] : null;

  const job: AtsJob | null = jobRow
    ? {
        id: jobRow.id,
        title: jobRow.title,
        location: jobRow.location ?? null,
        department: jobRow.department ?? null,
        employmentType: jobRow.employment_type ?? null,
        seniority: jobRow.seniority ?? null,
        status: jobRow.status ?? "open",
        createdAt: jobRow.created_at ?? null,
      }
    : null;

  if (!job) {
    return { job: null, applications: [] };
  }

  // ---- 2) Load applications from job_applications ----
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
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (appsError) {
    console.error("Error loading ATS applications", appsError);
  }

  const applications: AtsApplication[] = (appRows ?? []).map((row: any) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? null,
    location: row.location ?? null,
    linkedinUrl: row.linkedin_url ?? null,
    portfolioUrl: row.portfolio_url ?? null,
    cvUrl: row.cv_url ?? null,
    source: row.source ?? null,
    stage: row.stage ?? "APPLIED",
    status: row.status ?? "PENDING",
    createdAt: row.created_at ?? null,
  }));

  return { job, applications };
}

export default async function JobPipelinePage({ params }: PageProps) {
  const { user, currentTenant } = await getCurrentUserAndTenants();

  // Not logged in → show message + link
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

  // No tenant assigned → warning
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

  const { job, applications } = await loadJobAndApplications(
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
            {job.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {applicationsCount} application
            {applicationsCount === 1 ? "" : "s"} so far.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          {job.location && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.location}
            </span>
          )}
          {job.employmentType && (
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1">
              {job.employmentType}
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

      {/* Applications table (client-side) */}
      <ApplicationsTableClient applications={applications} />
    </main>
  );
}
