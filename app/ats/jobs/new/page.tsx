// app/ats/jobs/new/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";
import NewJobForm from "./NewJobForm";

export default async function NewJobPage() {
  const { user, currentTenant } = await getCurrentUserAndTenants();

  if (!user || !currentTenant) {
    redirect("/login?role=client&redirect=/ats/jobs/new");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          ThinkATS
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Create a new role
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          This form creates a new job in your core <strong>Jobs</strong> table
          for tenant <span className="font-medium">{currentTenant.name}</span>.
          You can later manage its pipeline and publishing status from the ATS
          dashboard.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <NewJobForm />
      </section>
    </main>
  );
}
