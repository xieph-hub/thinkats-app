// app/ats/jobs/new/page.tsx
import Link from "next/link";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";
import NewJobForm from "./NewJobForm";

export const revalidate = 0;

export default async function NewJobPage() {
  const { user, currentTenant } = await getCurrentUserAndTenants();

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          ThinkATS – create a new job
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          You need to be signed in as a client or internal Resourcin user to
          create and publish jobs.
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
      <main className="mx-auto max-w-4xl px-4 py-10">
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ThinkATS · Job publishing
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Create a new job
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Capture the basics, classification, compensation and visibility in
            one pass. You can save as draft or publish straight to the careers
            site.
          </p>
        </div>
        <Link
          href="/ats/jobs"
          className="hidden text-[11px] font-medium text-slate-500 hover:text-slate-800 sm:inline-block"
        >
          ← Back to ATS jobs
        </Link>
      </div>

      <NewJobForm tenantId={currentTenant.id} />
    </main>
  );
}
