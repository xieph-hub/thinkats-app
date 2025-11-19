// lib/jobApplications.ts
import { createSupabaseServerClient } from "./supabaseServerClient";

export type JobApplicationRow = {
  id: string;
  job_id: string;
  candidate_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  cv_url: string | null;
  cover_letter: string | null;
  source: string | null;
  stage: string | null;
  status: string | null;
  created_at: string;
};

export async function createJobApplication(params: {
  jobId: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  cvUrl?: string;
  coverLetter?: string;
  source?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { jobId, ...rest } = params;

  const { error } = await supabase
    .from("job_applications")
    .insert({
      job_id: jobId,
      full_name: rest.fullName,
      email: rest.email,
      phone: rest.phone ?? null,
      location: rest.location ?? null,
      linkedin_url: rest.linkedinUrl ?? null,
      portfolio_url: rest.portfolioUrl ?? null,
      cv_url: rest.cvUrl ?? null,
      cover_letter: rest.coverLetter ?? null,
      source: rest.source ?? "Website",
      // stage/status default in DB: APPLIED / PENDING
    });

  if (error) {
    console.error("Error creating job application", error);
    throw error;
  }
}

export async function getJobWithApplicationsForTenant(
  jobId: string,
  tenantId: string
) {
  const supabase = await createSupabaseServerClient();

  // 1) Get the job, scoped to the current tenant
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("tenant_id", tenantId)
    .single();

  if (jobError || !job) {
    console.error("Job not found or not accessible", jobError);
    return { job: null, applications: [] as JobApplicationRow[] };
  }

  // 2) Get applications for this job
  const { data: applications, error: appsError } = await supabase
    .from("job_applications")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (appsError) {
    console.error(
      "Error loading job applications for job",
      jobId,
      appsError
    );
  }

  return {
    job,
    applications: (applications ?? []) as JobApplicationRow[],
  };
}
