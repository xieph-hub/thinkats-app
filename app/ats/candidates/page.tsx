// app/ats/candidates/page.tsx
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getCurrentTenantId } from "@/lib/tenant";
import { CandidatesAccordion } from "@/components/ats/CandidatesAccordion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ATS – Candidates | Resourcin",
  description:
    "All candidates in the Resourcin ATS across open and closed mandates.",
};

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
    tenant_id: string;
  }[] | null;
};

export default async function AtsCandidatesPage() {
  const tenantId = await getCurrentTenantId();

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
      job:jobs!inner (
        id,
        title,
        slug,
        tenant_id
      )
    `
    )
    // Scope to Resourcin via the *job's* tenant
    .eq("jobs.tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ATS candidates – error loading candidates:", error);
  }

  const rows = (data ?? []) as RawRow[];

  const candidates = rows.map((row) => {
    const jobRelation = row.job?.[0] ?? null;

    return {
      id: row.id,
      job_id: row.job_id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      location: row.location,
      stage: row.stage,
      status: row.status,
      created_at: row.created_at,
      cv_url: row.cv_url,
      job: jobRelation
        ? {
            id: jobRelation.id,
            title: jobRelation.title,
            slug: jobRelation.slug,
          }
        : null,
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-4 flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-[#172965]">
          Candidates in pipeline
        </h1>
        <p className="text-xs text-slate-500">
          All applicants across mandates. Use this view to jump quickly into CVs
          and specific roles.
        </p>
      </header>

      <CandidatesAccordion candidates={candidates} />
    </main>
  );
}
