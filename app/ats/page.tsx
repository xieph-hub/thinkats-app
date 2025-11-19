// app/ats/page.tsx
import Link from "next/link";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";
import { getJobsForTenant } from "@/lib/jobs";
import AtsSignOutButton from "./AtsSignOutButton";
export default async function AtsDashboardPage() {
  const { user, currentTenant } =
    await getCurrentUserAndTenants();

  // Not logged in → ask them to sign in as a client.
  if (!user) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          ThinkATS – sign in to continue
        </h1>
        <p className="text-sm text-slate-600">
          You need to be signed in to access the ATS. Use
          your client or internal Resourcin account to
          continue.
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

  // Logged in but no tenant attached → show a simple state.
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
          (user_tenant_roles and tenants tables).
        </p>
      </main>
    );
  }

  // We have a tenant → load jobs for it.
  const jobs = await getJobsForTenant(
    currentTenant.id as string
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Page header */}
      <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-500">
      ThinkATS
    </p>
    <h1 className="mt-1 text-2xl font-semibold text-slate-900">
      {currentTenant.name ?? "Current tenant"}
    </h1>
    <p className="mt-1 text-sm text-slate-600">
      Central view of all roles you&apos;re hiring
      for. Click a job to see its pipeline.
    </p>
  </div>

  <div className="flex gap-2">
    <AtsSignOutButton />
    <Link
      href="/ats/jobs/new"
      className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a]"
    >
      + New job
    </Link>
  </div>
</header>

      {/* Jobs table / empty state */}
      {jobs.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <h2 className="text-base font-semibold text-slate-900">
            No jobs yet
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Once you start creating roles in ThinkATS,
            they&apos;ll appear here with quick access to
            their pipelines.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Employment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: any) => (
                <tr
                  key={job.id}
                  className="border-t border-slate-100 hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3 align-top">
                    <div className="text-sm font-medium text-slate-900">
                      {job.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    {job.department ?? "—"}
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    {job.location ?? "—"}
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    {job.employment_type ?? "—"}
                  </td>
                  <td className="px-4 py-3 align-top text-xs capitalize">
                    {job.status ?? "—"}
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    {job.created_at
                      ? new Date(
                          job.created_at
                        ).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 align-top text-right text-xs">
                    <Link
                      href={`/ats/jobs/${job.id}`}
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-[#172965] hover:bg-slate-100"
                    >
                      View pipeline
                      <span className="ml-1">↗</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
