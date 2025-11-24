// app/jobs/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { JobsListClient } from "@/components/jobs/JobsListClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs | Resourcin",
  description:
    "Open roles managed by Resourcin and its clients. Browse and apply without creating an account.",
};

export type PublicJob = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  status: string | null;
  visibility: string | null;
  created_at: string;
  tags: string[] | null;
  department: string | null;
};

export default async function JobsPage() {
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      location,
      employment_type,
      seniority,
      status,
      visibility,
      created_at,
      tags,
      department
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Jobs page – error loading jobs:", error);
  }

  const jobs = (data ?? []) as PublicJob[];

  return <JobsListClient initialJobs={jobs} />;
}
