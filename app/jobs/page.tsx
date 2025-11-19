// app/jobs/page.tsx
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import JobBoardClient from "./JobBoardClient";
import type { Job } from "@/lib/jobs";

const RESOURCIN_TENANT_ID = "54286a10-0503-409b-a9d4-a324e9283c1c";

// Fetch all published jobs for the Resourcin tenant from the new `jobs` table
async function loadPublicJobs(): Promise<Job[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      slug,
      location,
      employment_type,
      function,
      tags,
      summary,
      created_at,
      is_published
    `
    )
    .eq("tenant_id", RESOURCIN_TENANT_ID)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error loading public jobs from jobs table", error);
    return [];
  }

  // Map DB rows to the Job type the UI expects
  const jobs: Job[] = data.map((row: any) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    location: row.location,
    employment_type: row.employment_type,
    department: row.function,
    tags: row.tags,
    summary: row.summary,
    created_at: row.created_at,
  }));

  return jobs;
}

// Revalidate occasionally so the board stays fresh without going crazy
export const revalidate = 60; // seconds

export default async function JobsPage() {
  const jobs = await loadPublicJobs();

  // JobBoardClient contains your existing design (filters, layout, etc.)
  return <JobBoardClient jobs={jobs} />;
}
