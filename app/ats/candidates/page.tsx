// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CandidatesAccordion, Candidate } from "@/components/ats/CandidatesAccordion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ATS – Candidates | Resourcin",
  description:
    "Global view of candidates and applications flowing through the Resourcin ATS.",
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
    console.error("ATS candidates – error loading applications:", error);
  }

  const rows = (data ?? []) as any[];

  const candidates: Candidate[] = rows.map((row) => {
    const jobRel = row.job;
    const job =
      Array.isArray(jobRel) && jobRel.length > 0 ? jobRel[0] : jobRel ?? null;

    return {
      id: row.id as string,
      job_id: row.job_id as string,
      full_name: row.full_name as string,
      email: row.email as string,
      phone: (row.phone as string | null) ?? null,
      location: (row.location as string | null) ?? null,
      stage: (row.stage as string) ?? "APPLIED",
      status: (row.status as string) ?? "PENDING",
      created_at: row.created_at as string,
      cv_url: (row.cv_url as string | null) ?? null,
      job: job
        ? {
            id: job.id as string,
            title: job.title as string,
            slug: (job.slug as string | null) ?? null,
          }
        : null,
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Candidates
          </p>
          <h1 className="text-lg font-semibold text-slate-900">
            Global application inbox
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            All candidates flowing into the Resourcin ATS, across roles.
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-500">
          <p>
            Total candidates:{" "}
            <span className="font-semibold text-slate-700">
              {candidates.length}
            </span>
          </p>
        </div>
      </header>

      <section className="mt-4">
        <CandidatesAccordion candidates={candidates} />
      </section>
    </main>
  );
}
