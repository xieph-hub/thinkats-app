// app/ats/jobs/new/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import JobCreateWizard from "./JobCreateWizard";

export const dynamic = "force-dynamic";

type ClientCompanyRow = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
};

export default async function NewJobPage() {
  const { data, error } = await supabaseAdmin
    .from("client_companies")
    .select("id, name, slug, logo_url")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load client companies from Supabase", error);
  }

  const clientCompanies =
    (data as ClientCompanyRow[] | null)?.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      logoUrl: c.logo_url,
    })) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-lg font-semibold text-slate-900">
        Create new job
      </h1>
      <p className="mt-1 text-xs text-slate-500">
        Capture the bare minimum you need to launch a search. You can refine
        the details and pipeline later.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-0 sm:p-0">
        <JobCreateWizard clientCompanies={clientCompanies} />
      </div>
    </div>
  );
}
