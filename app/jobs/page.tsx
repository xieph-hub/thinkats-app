// app/jobs/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentTenantId } from "@/lib/tenant";
import JobsExplorer from "./JobsExplorer";
import type { JobCardData } from "@/components/jobs/JobCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open roles | Resourcin",
  description:
    "Live mandates managed by Resourcin via ThinkATS. Apply directly or join the talent network.",
};

type RawJobRow = {
  id: string;
  slug: string | null;
  title: string;
  short_description: string | null;
  location: string | null;
  employment_type: string | null;
  experience_level: string | null;
  work_mode: string | null;
  department: string | null;
  tags: string[] | null;
  status: string | null;
  visibility: string | null;
  internal_only: boolean | null;
  confidential: boolean | null;
  created_at: string;
};

export default async function JobsPage() {
  const tenantId = await getCurrentTenantId();

  if (!tenantId) {
    console.warn("JobsPage: no current tenant id – returning empty list");
  }

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      slug,
      title,
      short_description,
      location,
      employment_type,
      experience_level,
      work_mode,
      department,
      tags,
      status,
      visibility,
      internal_only,
      confidential,
      created_at
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("JobsPage – error loading jobs:", error);
  }

  const rows = (data ?? []) as RawJobRow[];

  // Only show jobs that should appear on the public board
  const publicRows = rows.filter((row) => {
    const status = (row.status || "").toLowerCase();
    const visibility = (row.visibility || "").toLowerCase();

    const isOpen = status === "open";
    const isPublic = visibility === "public";
    const isInternal = row.internal_only === true;

    // Hide internal-only jobs from the public board.
    return isOpen && isPublic && !isInternal;
  });

  const jobs: JobCardData[] = publicRows.map((row) => {
    const slugOrId = row.slug ?? row.id;

    const card: JobCardData = {
      id: row.id,
      title: row.title,
      location: row.location ?? "Location flexible",
      employmentType: row.employment_type ?? undefined,
      experienceLevel: row.experience_level ?? undefined,
      workMode: row.work_mode ?? undefined,
      department: row.department ?? undefined,
      shortDescription: row.short_description ?? undefined,
      tags: row.tags ?? [],
      postedAt: row.created_at,
      shareUrl: `/jobs/${slugOrId}`,
      isConfidential: row.confidential === true,
    } as JobCardData;

    return card;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p
          className="text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: "#172965" }} // Resourcin blue
        >
          Open roles
        </p>
        <h1
          className="mt-2 text-3xl font-semibold"
          style={{ color: "#172965" }} // Resourcin blue
        >
          Opportunities via Resourcin
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Roles managed through ThinkATS. Apply directly or share with someone
          who fits.
        </p>
      </header>

      <JobsExplorer jobs={jobs} />
    </main>
  );
}
