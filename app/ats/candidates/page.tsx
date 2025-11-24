// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CandidatesAccordion } from "@/components/ats/CandidatesAccordion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidates | Resourcin ATS",
  description:
    "Unified candidate database across all jobs managed in Resourcin ATS.",
};

type RawRow = {
  id: string;
  job_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  status: string | null;
  created_at: string;
  job?: {
    id: string;
    title: string | null;
    slug: string | null;
  } | null;
};

export default async function CandidatesPage() {
  const { data, error } = await supabaseAdmin
    .from("job_applications")
    .select(
      `
      id,
      job_id,
      full_name,
      email,
      phone,
      location,
      status,
      created_at,
      job:jobs (
        id,
        title,
        slug
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Candidates page – error loading applications:", error);
  }

  const rows = (data ?? []) as RawRow[];

  const candidates = rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    location: row.location ?? undefined,
    status: (row.status as string) || "applied",
    appliedAt: row.created_at,
    jobTitle: row.job?.title ?? undefined,
    jobSlug: row.job?.slug ?? undefined,
    jobId: row.job_id ?? undefined,
    // These can later be filled from CV parsing / tagging
    headline: row.job?.title
      ? `Applied for ${row.job.title}`
      : "Candidate profile",
    keySkills: [] as string[],
    experienceSummary: undefined as string | undefined,
    source: undefined as string | undefined,
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Candidate database
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Browse all applicants across roles. Filter by status and search by
          name, email, or role to quickly find the right profiles.
        </p>
      </header>

      <CandidatesAccordion candidates={candidates} />
    </main>
  );
}
