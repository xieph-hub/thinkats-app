// app/jobs/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
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
  title: string;
  location: string | null;
  status: string | null;
  visibility: string | null;
  internal_only: boolean | null;
  confidential: boolean | null;
  created_at: string;
};

export default async function JobsPage() {
  // ⬇️ No tenant filter – public board
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      title,
      location,
      status,
      visibility,
      internal_only,
      confidential,
      created_at
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("JobsPage – error loading jobs:", error);
  }

  const rows = (data ?? []) as RawJobRow[];

  // Only show open + public + not internal
  const publicRows = rows.filter((row) => {
    const status = (row.status || "").toLowerCase();
    const visibility = (row.visibility || "").toLowerCase();
    const isOpen = status === "open";
    const isPublic = visibility === "public";
    const isInternal = row.internal_only === true;
    return isOpen && isPublic && !isInternal;
  });

  const jobs: JobCardData[] = publicRows.map((row) => ({
    id: row.id,
    title: row.title,
    location: row.location ?? "Location flexible",
    company: row.confidential
      ? "Confidential search – via Resourcin"
      : "Resourcin",
    postedAt: row.created_at,
    shareUrl: `/jobs/${row.id}`,
    // everything else in JobCardData is optional and can be added later
  }));

  console.log(
    "JobsPage – total rows:",
    rows.length,
    "public rows shown:",
    publicRows.length
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p
          className="text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: "#172965" }}
        >
          Open roles
        </p>
        <h1
          className="mt-2 text-3xl font-semibold"
          style={{ color: "#172965" }}
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
