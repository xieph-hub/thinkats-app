// lib/jobs.ts
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function getJobsForTenant(tenantId: string) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore }
  );

  const { data, error } = await supabase
    .from('jobs')
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
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

// lib/jobs.ts
export async function getJobWithPipeline(jobId: string) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore }
  );

  // 1. Get job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
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
    .eq('id', jobId)
    .single();

  if (jobError) throw jobError;

  // 2. Get stages for this job
  const { data: stages, error: stagesError } = await supabase
    .from('job_stages')
    .select('id, name, position, is_terminal')
    .eq('job_id', jobId)
    .order('position', { ascending: true });

  if (stagesError) throw stagesError;

  // 3. Get all applications + candidates for this job
  const { data: applications, error: appsError } = await supabase
    .from('applications')
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
    .eq('job_id', jobId);

  if (appsError) throw appsError;

  return { job, stages, applications };
}
