// app/ats/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndTenants } from "@/lib/getCurrentUserAndTenants";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import AtsSignOutButton from "./AtsSignOutButton";

type AtsJob = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  status: string;
  createdAt: string | null;
};

// Load jobs for the current tenant from the NEW `jobs` table
async function loadTenantJobs(tenantId: string): Promise<AtsJob[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      location,
      employment_type,
      function,
      is_published,
      created_at
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error loading ATS jobs for tenant", error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    title: row.title,
    department: row.function ?? null,
    location: row.location ?? null,
    employmentType: row.employment_type ?? null,
    status: row.is_published ? "Open" : "Closed",
    createdAt: row.created_at ?? null,
  }));
}

export const revalidate = 0; // always fresh per request

export default async function AtsPage() {
  const { user, currentTenant } = await getCurrentUserAndTenants();

  // If not logged in as a client, push back to login with redirect to /ats
  if (!user || !currentTenant) {
    redirect("/login?role=client&redirect=/ats");
  }

  const jobs = await loadTenantJobs(currentTenant.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Header: ThinkATS + tenant name + actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            THINKATS
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {currentTenant.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Central view of all roles you&apos;re hiring for. Click a job to
            see its pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AtsSignOutButton />
          <Link
            href="/ats/jobs/new"
            className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#111b4a]"
          >
            + New job
          </Link>
        </div>
      </div>

      {/* Jobs table */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4">Job</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Employment</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => {
                const createdLabel = job.createdAt
                  ? new Date(job.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })
                  : "";

                return (
                  <tr key={job.id} className="align-middle">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      {job.title}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {job.department ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {job.location ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {job.employmentType ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          job.status === "Open"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-600">
                      {createdLabel}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/ats/jobs/${job.id}`}
                        className="text-xs font-medium text-[#172965] hover:underline"
                      >
                        View pipeline ↗
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {jobs.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-sm text-slate-500"
                  >
                    No jobs yet. Click &quot;New job&quot; to create your first
                    role.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
