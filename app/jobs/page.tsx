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
  name: string;
  logo_url: string | null;
  slug: string | null;
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
  created_at: string | null;
  client_company: ClientCompanyRow | null;
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
      created_at,
      client_company:client_companies(
        name,
        logo_url,
        slug
      )
    `
    )
    .eq("is_published", true)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading jobs:", error);
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-20">
          <h1 className="text-2xl font-semibold tracking-tight">
            We couldn&apos;t load roles right now
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Please refresh the page in a moment. If this persists, let us know
            and we&apos;ll take a look.
          </p>
        </div>
      </main>
    );
  }

  const jobs: JobCardData[] =
    (data as JobRow[] | null)?.map((job) => ({
      id: job.id,
      slug: job.slug,
      title: job.title,
      shortDescription: job.short_description,
      location: job.location,
      locationType: job.location_type,
      employmentType: job.employment_type,
      department: job.department,
      clientName: job.client_company?.name ?? null,
      clientLogoUrl: job.client_company?.logo_url ?? null,
      clientSlug: job.client_company?.slug ?? null,
      createdAt: job.created_at,
    })) ?? [];

  return <JobsPageClient jobs={jobs} />;
}
