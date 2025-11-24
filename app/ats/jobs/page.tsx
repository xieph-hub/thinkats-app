// app/ats/jobs/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  JobsIndexClient,
  type AtsJobSummary,
} from "@/components/ats/JobsIndexClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ATS Jobs | Resourcin",
  description:
    "Internal view of all jobs managed via Resourcin ATS, with quick preview and pipeline access.",
};

type RawJobRow = {
  id: string;
  title: string;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  status: string | null;
  visibility: string | null;
  created_at: string;
  department: string | null;
  tags: string[] | null;
};

type RawApplicationRow = {
  id: string;
  job_id: string | null;
  status: string | null;
};

function deriveWorkMode(job: RawJobRow): string | null {
  const loc = (job.location || "").toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase());

  if (loc.includes("remote") || tags.includes("remote")) return "Remote";
  if (loc.includes("hybrid") || tags.includes("hybrid")) return "Hybrid";
  if (loc.includes("flexible") || tags.includes("flexible")) return "Flexible";
  if (loc.includes("on-site") || loc.includes("onsite")) return "On-site";

  return null;
}

export default async function AtsJobsPage() {
  const [{ data: jobsData, error: jobsError }, { data: appsData, error: appsError }] =
    await Promise.all([
      supabaseAdmin
        .from("jobs")
        .select(
          `
          id,
          title,
          location,
          employment_type,
          seniority,
          status,
          visibility,
          created_at,
          department,
          tags
        `
        )
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("job_applications")
        .select("id, job_id, status"),
    ]);

  if (jobsError) {
    console.error("ATS jobs page – error loading jobs:", jobsError);
  }
  if (appsError) {
    console.error("ATS jobs page – error loading applications:", appsError);
  }

  const jobsRows = (jobsData ?? []) as RawJobRow[];
  const appsRows = (appsData ?? []) as RawApplicationRow[];

  const countsByJobId = new Map<
    string,
    { total: number; byStatus: Record<string, number> }
  >();

  for (const app of appsRows) {
    if (!app.job_id) continue;
    const key = app.job_id;
    if (!countsByJobId.has(key)) {
      countsByJobId.set(key, { total: 0, byStatus: {} });
    }
    const entry = countsByJobId.get(key)!;
    entry.total += 1;
    const s = (app.status || "applied").toLowerCase();
    entry.byStatus[s] = (entry.byStatus[s] || 0) + 1;
  }

  const jobs: AtsJobSummary[] = jobsRows.map((row) => {
    const counts = countsByJobId.get(row.id) ?? {
      total: 0,
      byStatus: {} as Record<string, number>,
    };

    return {
      id: row.id,
      title: row.title,
      location: row.location,
      employmentType: row.employment_type,
      seniority: row.seniority,
      status: row.status,
      visibility: row.visibility,
      createdAt: row.created_at,
      department: row.department,
      tags: row.tags,
      workMode: deriveWorkMode(row),
      applicationsTotal: counts.total,
      applicationsByStatus: counts.byStatus,
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Jobs overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Internal view of all roles managed via Resourcin ATS. Use filters and
          the quick preview drawer to inspect pipelines without leaving this
          page.
        </p>
      </header>

      <JobsIndexClient jobs={jobs} />
    </main>
  );
}
