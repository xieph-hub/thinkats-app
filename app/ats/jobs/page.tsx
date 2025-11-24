// app/ats/jobs/page.tsx
import Link from "next/link";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import AtsJobsPageClient from "./AtsJobsPageClient";
import type { AtsJobListItem } from "@/components/ats/JobListWithDrawer";

export const revalidate = 0;

export default async function AtsJobsPage() {
  const { user, currentTenant } = await getCurrentUserAndTenants();

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          ThinkATS – sign in to view jobs
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          You need to be signed in as a client or internal Resourcin user to
          manage jobs in ThinkATS.
        </p>
        <div className="mt-4">
          <Link
            href="/login?role=client"
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a]"
          >
            Go to client login
          </Link>
        </div>
      </main>
    );
  }

  if (!currentTenant) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          ThinkATS – no tenant configured
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          You&apos;re authenticated but your user isn&apos;t linked to any ATS
          tenant yet. Please make sure your account has a tenant assignment in
          Supabase.
        </p>
        <div className="mt-4">
          <Link
            href="/ats"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to ATS dashboard
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      location,
      employment_type,
      seniority,
      status,
      created_at,
      client_company:client_companies(name)
    `
    )
    .eq("tenant_id", currentTenant.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading ATS jobs:", error);
  }

  const rawJobs = (data ?? []) as any[];

  const jobs: AtsJobListItem[] = rawJobs.map((row) => {
    const companyRel = Array.isArray(row.client_company)
      ? row.client_company[0]
      : row.client_company;

    const companyName = companyRel?.name || "Client role";

    const createdAt =
      typeof row.created_at === "string"
        ? row.created_at
        : new Date().toISOString();

    return {
      id: row.id,
      title: row.title,
      companyName,
      location: row.location || "Location flexible",
      salary: undefined,
      workMode: undefined,
      status: (row.status || "draft") as AtsJobListItem["status"],
      createdAt,
      description: "",
      requirements: "",
    };
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <ErrorBoundary>
        <AtsJobsPageClient jobs={jobs} />
      </ErrorBoundary>
    </main>
  );
}
