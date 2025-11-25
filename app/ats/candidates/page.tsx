// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CandidatesAccordion } from "@/components/ats/CandidatesAccordion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidates | Resourcin ATS",
  description:
    "All candidates who have applied to open mandates in the Resourcin ATS.",
};

// Shape that comes back from Supabase (note: job is an ARRAY)
type RawRow = {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  stage: string;
  status: string;
  created_at: string;
  cv_url: string | null;
  job: {
    id: string;
    title: string;
    slug: string | null;
  }[];
};

// Shape we actually want to use in the UI (job is a single object or null)
export type CandidateRow = {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  stage: string;
  status: string;
  created_at: string;
  cv_url: string | null;
  job: {
    id: string;
    title: string;
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
      stage,
      status,
      created_at,
      cv_url,
      job:jobs (
        id,
        title,
        slug
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ATS candidates – error loading candidates:", error);
  }

  const rows = (data ?? []) as RawRow[];

  const candidates: CandidateRow[] = rows.map((row) => {
    const jobRecord = row.job && row.job.length > 0 ? row.job[0] : null;

    return {
      id: row.id,
      job_id: row.job_id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone ?? null,
      location: row.location ?? null,
      stage: row.stage,
      status: row.status,
      created_at: row.created_at,
      cv_url: row.cv_url ?? null,
      job: jobRecord
        ? {
            id: jobRecord.id,
            title: jobRecord.title,
            slug: jobRecord.slug ?? null,
          }
        : null,
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ATS
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            Candidates
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            All applicants across active and recent mandates.
          </p>
        </div>

        <Link
          href="/ats/jobs"
          className="hidden text-[11px] font-medium text-[#172965] underline-offset-2 hover:underline sm:inline-flex"
        >
          View jobs
        </Link>
      </header>

      {candidates.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          No candidates yet. Once applications come in, they&apos;ll appear
          here grouped by role.
        </div>
      ) : (
        <section className="mt-4">
          <CandidatesAccordion candidates={candidates} />
        </section>
      )}
    </main>
  );
}
