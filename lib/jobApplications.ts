// lib/jobApplications.ts
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

/**
 * Load a single job for a given tenant, plus its applications.
 *
 * If the job cannot be found for that tenant, returns { job: null, applications: [] }.
 * If applications table is missing or errors, we just return an empty array for applications
 * and still return the job (so the page doesn't blow up).
 */
export async function getJobWithApplicationsForTenant(
  jobId: string,
  tenantId: string
): Promise<{ job: any | null; applications: any[] }> {
  const supabase = await createSupabaseServerClient();

  // 1) Load the job from the REAL ATS `jobs` table
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(
      `
        id,
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
    .eq("id", jobId)
    .eq("tenant_id", tenantId)
    .single();

  if (jobError || !job) {
    console.error("❌ Error loading job for tenant", {
      jobError,
      jobId,
      tenantId,
    });
    return { job: null, applications: [] };
  }

  // 2) Try to load applications (best-effort, never break the page)
  let applications: any[] = [];

  try {
    const { data: apps, error: appsError } = await supabase
      // ⚠️ If your applications table has a different name, we'll still fail gracefully.
      .from("job_applications")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (appsError) {
      console.error("⚠️ Error loading applications for job", {
        appsError,
        jobId,
        tenantId,
      });
      applications = [];
    } else if (apps) {
      applications = apps;
    }
  } catch (err) {
    console.error("⚠️ Unexpected error loading applications for job", {
      err,
      jobId,
      tenantId,
    });
    applications = [];
  }

  return { job, applications };
}
