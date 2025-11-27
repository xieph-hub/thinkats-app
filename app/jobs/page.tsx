// app/jobs/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import JobsPageClient from "./JobsPageClient";
import type { JobCardData } from "@/components/jobs/JobCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open roles | Resourcin",
  description:
    "Explore open mandates managed by Resourcin and its clients across Africa and beyond.",
};

type ClientCompanyRow = {
  name: string | null;
};

type JobRow = {
  id: string;
  slug: string | null;
  title: string;
  short_description: string | null;
  department: string | null;
  location: string | null;
  location_type: string | null;
  employment_type: string | null;
  seniority: string | null;
  salary_range: string | null;
  tags: string[] | null;
  created_at: string | null;
  is_confidential: boolean | null;
  // NOTE: Supabase returns an array for the relationship, even with the alias
  client_company: ClientCompanyRow[] | null;
};

export default async function JobsPage() {
  const tenantId =
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? "tenant_resourcin_1";

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      short_description,
      department,
      location,
      location_type,
      employment_type,
      seniority,
      salary_range,
      tags,
      created_at,
      is_confidential,
      client_company:client_companies(
        name
      )
    `
    )
    .eq("is_published", true)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading jobs:", error);
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-20">
          <h1 className="text-2xl font-semibold tracking-tight">
            We couldn&apos;t load roles right now
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Please refresh the page in a moment. If this persists, let us know
            and we&apos;ll take a look.
          </p>
        </div>
      </main>
    );
  }

  const rows = (data ?? []) as JobRow[];

  const jobs: JobCardData[] = rows.map((job) => {
    // Supabase returns an array of related client_companies;
    // for your use case we just take the first one if present.
    const firstCompany =
      job.client_company && job.client_company.length > 0
        ? job.client_company[0]
        : null;

    return {
      // use slug in URLs where possible
      id: job.slug ?? job.id,
      title: job.title,
      location: job.location ?? "",
      company: firstCompany?.name ?? undefined,
      department: job.department ?? undefined,
      type: job.employment_type ?? undefined,
      experienceLevel: job.seniority ?? undefined,
      workMode: job.location_type ?? undefined,
      salary: job.salary_range ?? undefined,
      shortDescription: job.short_description ?? undefined,
      tags: job.tags ?? [],
      postedAt: job.created_at ?? undefined,
      shareUrl: `/jobs/${encodeURIComponent(job.slug ?? job.id)}`,
      isConfidential: job.is_confidential ?? undefined,
      // applicants left undefined for now
    };
  });

  return <JobsPageClient jobs={jobs} />;
}
