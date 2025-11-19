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
          Publish a new role
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Fill in the core details. We&apos;ll generate the slug, status and
          timestamps, and store everything in the{" "}
          <strong>jobs</strong> table for tenant{" "}
          <span className="font-medium">{currentTenant.name}</span>.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <NewJobForm />
      </section>
    </main>
  );
}
