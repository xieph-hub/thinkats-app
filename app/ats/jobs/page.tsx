// app/ats/jobs/page.tsx
import Link from "next/link";
import { getResourcinTenant } from "@/lib/tenant";
import { listTenantJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export default async function AtsJobsPage() {
  const tenant = await getResourcinTenant();
  const jobs = await listTenantJobs(tenant.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            ATS Jobs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Internal view of all open and active roles for the Resourcin tenant.
          </p>
        </div>

        <Link
          href="/ats/jobs/new"
          className="inline-flex items-center rounded-md bg-resourcin-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-900"
        >
          + New job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No jobs found for this tenant yet. Create one with the “New job” button.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 text-sm text-slate-900">
                    <div className="flex flex-col">
                      <span className="font-medium">{job.title}</span>
                      <span className="text-xs text-slate-500">
                        {job.slug ? job.slug : job.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {job.clientCompany
                      ? job.clientCompany.name
                      : "Resourcin-branded"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {job.location ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <Link
                      href={`/ats/jobs/${job.id}`}
                      className="text-sm font-medium text-resourcin-blue hover:underline"
                    >
                      View pipeline →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
