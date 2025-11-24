// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import CandidatesAccordion, {
  Candidate as AccordionCandidate,
} from "@/components/ats/CandidatesAccordion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidates | Resourcin ATS",
  description:
    "Unified view of candidates from all roles managed in Resourcin ATS.",
};

type RawRow = {
  id: string;
  job_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  status: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    slug: string | null;
  }[]; // <- Supabase returns this as an array
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
    console.error("ATS candidates – error loading candidates:", error);
  }

  const rows = (data ?? []) as RawRow[];

  const candidates: AccordionCandidate[] = rows.map((row) => {
    const job = row.job?.[0]; // take the first related job if present

    return {
      id: row.id,
      // primary identity
      full_name: row.full_name,
      name: row.full_name,
      email: row.email,
      phone: row.phone,
      location: row.location,

      // job context
      title: job?.title ?? "Role not specified",
      current_role: job?.title ?? null,
      // you can wire current_company later if you add it to the query

      // metadata
      tags: [row.status],
      last_contact_at: row.created_at,
      // key_skills, years_experience, etc. can be wired in later
    };
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 border-b border-slate-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Talent database
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Candidates
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Browse applicants from all roles in a single, unified view. Use this
          list as your lightweight CRM for talent.
        </p>
      </header>

      <CandidatesAccordion candidates={candidates} />
    </main>
  );
}
