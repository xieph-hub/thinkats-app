// lib/jobs.ts
import { createSupabaseServerClient } from "./supabaseServerClient";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

// For now keep this simple — you can tighten this later if you like.
export type JobSeniority = string;

export type Job = {
  id: string;
  tenant_id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  seniority: JobSeniority | null;
  status: string | null;
  visibility: string | null;
  created_at: string;
};

// -----------------------------------------------------------------------------
// Queries
// -----------------------------------------------------------------------------

/**
 * Get all jobs for a given tenant.
 */
export async function getJobsForTenant(tenantId: string): Promise<Job[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
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
      status,
      visibility,
      created_at
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Job[];
}

/**
 * Get a single job and its pipeline:
 * - job
 * - stages
 * - applications + candidate info
 *
 * Types are kept loose (any[]) for now to avoid extra friction.
 */
export async function getJobWithPipeline(jobId: string): Promise<{
  job: Job | null;
  stages: any[];
  applications: any[];
}> {
  const supabase = createSupabaseServerClient();

  // 1) Job
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
      status,
      visibility,
      created_at
    `
    )
    .eq("id", jobId)
    .single();

  if (jobError) throw jobError;

  // 2) Stages
  const { data: stages, error: stagesError } = await supabase
    .from("job_stages")
    .select("id, name, position, is_terminal")
    .eq("job_id", jobId)
    .order("position", { ascending: true });

  if (stagesError) throw stagesError;

  // 3) Applications + candidates
  const { data: applications, error: appsError } = await supabase
    .from("applications")
    .select(
      `
      id,
      tenant_id,
      job_id,
      candidate_id,
      current_stage_id,
      status,
      applied_at,
      updated_at,
      candidate:candidates (
        id,
        full_name,
        email,
        phone,
        location,
        linkedin_url,
        current_title,
        current_company
      )
    `
    )
    .eq("job_id", jobId);

  if (appsError) throw appsError;

  return {
    job: (job as Job) ?? null,
    stages: stages ?? [],
    applications: applications ?? [],
  };
}
