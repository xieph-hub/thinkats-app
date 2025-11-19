// app/jobs/page.tsx
import { createClient } from "@supabase/supabase-js";
import JobBoardClient from "./JobBoardClient";
import type { Job } from "@/lib/jobs";

// Use your existing env vars (as you told me)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars"
  );
}

// Server-side Supabase client (safe for read-only public data)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// -----------------------------------------------------------------------------
// Load jobs from existing Supabase "Job" table
// -----------------------------------------------------------------------------

async function getPublicJobs(): Promise<Job[]> {
  // 1) Fetch ALL rows from Job table (no filter first, so we definitely see something)
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

  // 2) Map Supabase rows into the Job shape used by JobBoardClient
  //    We add fallbacks so it doesn't crash even if some columns are missing/nullable.
  const mappedJobs: Job[] = data.map((row: any) => {
    const slug =
      row.slug ??
      String(row.id ?? row.job_id ?? row.uuid ?? crypto.randomUUID());

    const title =
      row.title ??
      row.job_title ??
      "Untitled role";

    return {
      slug,

      title,

      employerInitials:
        row.employerInitials ??
        row.employer_initials ??
        (row.employerName ?? row.employer_name ?? "??")
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

      tags:
        (row.tags as string[]) ??
        [],

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

// -----------------------------------------------------------------------------
// Page component
// -----------------------------------------------------------------------------

export default async function JobsPage() {
  const jobs = await getPublicJobs();

  // This feeds your existing design component
  return <JobBoardClient jobs={jobs} />;
}
