// app/jobs/page.tsx
import { createClient } from "@supabase/supabase-js";
import JobBoardClient from "./JobBoardClient";
import type { Job } from "@/lib/jobs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars"
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Load jobs from your existing Supabase "Job" table
async function getPublicJobs(): Promise<Job[]> {
  const { data, error } = await supabase.from("Job").select("*");

  if (error) {
    console.error("Error fetching jobs from Supabase:", error);
    return [];
  }

  if (!data || data.length === 0) {
    console.log("No jobs returned from Supabase Job table");
    return [];
  }

  console.log(`Loaded ${data.length} jobs from Supabase`);

  const mappedJobs: Job[] = data.map((row: any, index: number) => {
    const id = String(
      row.id ?? row.job_id ?? row.uuid ?? `generated-${index}`
    );

    const slug =
      row.slug ??
      row.job_slug ??
      id;

    const title =
      row.title ??
      row.job_title ??
      "Untitled role";

    return {
      id,
      slug,

      title,

      employerInitials:
        row.employerInitials ??
        row.employer_initials ??
        (row.employerName ?? row.employer_name ?? "??")
          .toString()
          .split(" ")
          .map((p: string) => p[0])
          .join("")
          .toUpperCase(),

      employerName:
        row.employerName ?? row.employer_name ?? "Confidential employer",

      department: row.department ?? row.function ?? "General",

      location: row.location ?? "Unspecified",

      workType: row.workType ?? row.work_type ?? "Onsite",
      type: row.type ?? row.employment_type ?? "Full-time",
      seniority: row.seniority ?? "Mid",

      salaryRange: row.salaryRange ?? row.salary_range ?? null,

      highlight:
        row.highlight ??
        row.short_summary ??
        null,

      tags: (row.tags as string[]) ?? [],

      postedAt: row.postedAt
        ? String(row.postedAt)
        : row.posted_at
        ? new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }).format(new Date(row.posted_at))
        : "",
    };
  });

  return mappedJobs;
}

export default async function JobsPage() {
  const jobs = await getPublicJobs();
  return <JobBoardClient jobs={jobs} />;
}
