// lib/jobs.ts
import { createSupabaseServerClient } from "./supabaseServerClient";

/**
 * Get all jobs for a given tenant.
 */
export async function getJobsForTenant(tenantId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
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

  return data ?? [];
}

/**
 * Get a single job and its pipeline:
 * - job
 * - stages
 * - applications + candidate info
 */
export async function getJobWithPipeline(jobId: string) {
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
    job,
    stages: stages ?? [],
    applications: applications ?? [],
  };
}
