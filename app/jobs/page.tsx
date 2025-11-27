// app/jobs/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTenantId } from "@/lib/getTenantId";
import JobsPageClient from "./JobsPageClient";
import type { JobCardData } from "@/components/jobs/JobCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open roles | Resourcin",
  description:
    "Explore open mandates managed by Resourcin and its clients across Africa and beyond.",
};

// This matches the underlying "jobs" table column names
type JobRow = {
  id: string;
  slug: string | null;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  experience_level: string | null;
  work_mode: string | null;
  short_description: string | null;
  location_type: string | null;
  status: string;
  visibility: string;
  tags: string[] | null;
  created_at: string | null;
  salary_min: string | number | null;
  salary_max: string | number | null;
  salary_currency: string | null;
  confidential: boolean | null;
};

// Helper to turn salary_min / salary_max / salary_currency into a friendly string
function formatSalary(job: JobRow): string | undefined {
  const { salary_min, salary_max, salary_currency } = job;

  const hasMin = salary_min !== null && salary_min !== undefined;
  const hasMax = salary_max !== null && salary_max !== undefined;

  if (!hasMin && !hasMax) return undefined;

  const formatNumber = (value: string | number) => {
    const num =
      typeof value === "number" ? value : Number.parseFloat(value as string);
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString();
  };

  let range: string;
  if (hasMin && hasMax) {
    range = `${formatNumber(salary_min as any)} – ${formatNumber(
      salary_max as any
    )}`;
  } else if (hasMin) {
    range = `from ${formatNumber(salary_min as any)}`;
  } else {
    range = `up to ${formatNumber(salary_max as any)}`;
  }

  return salary_currency ? `${salary_currency} ${range}` : range;
}

export default async function JobsPage() {
  let tenantId: string;

  // 1) Resolve tenant UUID from RESOURCIN_TENANT_SLUG (or RESOURCIN_TENANT_ID)
  try {
    tenantId = await getTenantId();
  } catch (e) {
    console.error("Tenant resolution error:", e);
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-20">
          <h1 className="text-2xl font-semibold tracking-tight">
            We couldn&apos;t load roles right now
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Tenant configuration is incomplete. Please ensure{" "}
            <code>RESOURCIN_TENANT_SLUG</code> is set and that a matching
            tenant exists in the <code>tenants</code> table.
          </p>
        </div>
      </main>
    );
  }

  // 2) Load jobs for that tenant only, open + public
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      department,
      location,
      employment_type,
      experience_level,
      work_mode,
      short_description,
      location_type,
      status,
      visibility,
      tags,
      created_at,
      salary_min,
      salary_max,
      salary_currency,
      confidential
    `
    )
    .eq("tenant_id", tenantId)
    .eq("status", "open")
    .eq("visibility", "public")
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
            Please refresh the page in a moment. If this persists, we&apos;ll
            need to inspect the Supabase logs.
          </p>
        </div>
      </main>
    );
  }

  const rows = (data ?? []) as JobRow[];

  // 3) Map to your existing JobCardData structure
  const jobs: JobCardData[] = rows.map((job) => ({
    id: job.slug ?? job.id, // prefer slug in URL
    title: job.title,
    location: job.location ?? "",
    department: job.department ?? undefined,
    type: job.employment_type ?? undefined,
    experienceLevel: job.experience_level ?? undefined,
    workMode: job.work_mode ?? undefined,
    shortDescription: job.short_description ?? undefined,
    tags: job.tags ?? [],
    postedAt: job.created_at ?? undefined,
    salary: formatSalary(job),
    shareUrl: `/jobs/${encodeURIComponent(job.slug ?? job.id)}`,
    isConfidential: job.confidential ?? undefined,
    // company, applicants left undefined for now; we can wire clientCompany later
  }));

  return <JobsPageClient jobs={jobs} />;
}
