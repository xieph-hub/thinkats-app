// app/ats/jobs/[jobId]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import JobDetailShell from "@/components/ats/JobDetailShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ATS – Job detail | Resourcin",
  description:
    "Detailed ATS view of a mandate and its candidate pipeline inside Resourcin.",
};

type JobRow = {
  id: string;
  slug: string | null;
  title: string;
  short_description: string | null;
  description: string | null;
  department: string | null;
  location: string | null;
  location_type: string | null;
  employment_type: string | null;
  experience_level: string | null;
  years_experience_min: number | null;
  years_experience_max: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_visible: boolean | null;
  required_skills: string[] | null;
  education_required: string | null;
  education_field: string | null;
  internal_only: boolean | null;
  confidential: boolean | null;
  status: string | null;
  visibility: string | null;
  work_mode: string | null;
  tags: string[] | null;
  created_at: string;
  client_company: {
    name: string;
    logo_url: string | null;
    slug: string | null;
  }[] | null;
};

type ApplicationRow = {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  stage: string;
  status: string;
  created_at: string;
  cv_url: string | null;
};

export default async function AtsJobDetailPage({
  params,
}: {
  params: { jobId: string };
}) {
  const jobId = params.jobId;

  // 1) Load job itself
  const { data: jobData, error: jobError } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      short_description,
      description,
      department,
      location,
      location_type,
      employment_type,
      experience_level,
      years_experience_min,
      years_experience_max,
      salary_min,
      salary_max,
      salary_currency,
      salary_visible,
      required_skills,
      education_required,
      education_field,
      internal_only,
      confidential,
      status,
      visibility,
      work_mode,
      tags,
      created_at,
      client_company:client_companies (
        name,
        logo_url,
        slug
      )
    `
    )
    .eq("id", jobId)
    .maybeSingle();

  if (jobError) {
    console.error("ATS job detail – error loading job:", jobError);
  }

  if (!jobData) {
    notFound();
  }

  const job = jobData as JobRow;

  // 2) Load applications for this job
  const { data: appData, error: appError } = await supabaseAdmin
    .from("job_applications")
    .select(
      `
      id,
      job_id,
      full_name,
      email,
      phone,
      location,
      stage,
      status,
      created_at,
      cv_url
    `
    )
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (appError) {
    console.error(
      "ATS job detail – error loading applications:",
      appError
    );
  }

  const applications = (appData ?? []) as ApplicationRow[];

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <JobDetailShell job={job as any} applications={applications as any[]} />
    </main>
  );
}
