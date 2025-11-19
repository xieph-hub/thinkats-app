// app/ats/jobs/new/page.tsx
import Link from "next/link";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";
import NewJobForm from "./NewJobForm";

export default async function NewJobPage() {
  const { user, currentTenant } =
    await getCurrentUserAndTenants();

  if (!user) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          ThinkATS – sign in to create a job
        </h1>
        <p className="text-sm text-slate-600">
          You need to be signed in as a client or internal
          Resourcin user to create roles in ThinkATS.
        </p>
        <div>
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
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          ThinkATS – no tenant configured
        </h1>
        <p className="text-sm text-slate-600">
          Your user is authenticated but not linked to any
          ATS tenant yet. Please make sure your account has
          a tenant assignment in Supabase
          (user_tenant_roles and tenants tables) before
          creating jobs.
        </p>
        <div>
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          ThinkATS
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Create a new job
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Roles created here belong to{" "}
          <span className="font-semibold">
            {currentTenant.name ?? "this tenant"}
          </span>{" "}
          and will show up on your ATS dashboard and job
          board (if public).
        </p>
      </header>

      <NewJobForm tenantId={currentTenant.id as string} />
    </main>
  );
}
