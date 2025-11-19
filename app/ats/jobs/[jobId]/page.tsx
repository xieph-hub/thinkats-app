// app/ats/jobs/[jobId]/page.tsx
import { getJobWithPipeline } from "@/lib/jobs";

type PageProps = {
  params: {
    jobId: string;
  };
};

export default async function JobPipelinePage({ params }: PageProps) {
  const { job, stages, applications } = await getJobWithPipeline(params.jobId);

  const stageList = (stages ?? []) as any[];
  const appList = (applications ?? []) as any[];

  if (!job) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-xl font-semibold text-neutral-900">
          Job not found
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          We couldn&apos;t find this job. It may have been removed.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Job header */}
      <section className="mb-8">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          Job
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
          {job.title}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          {job.department && `${job.department} · `}
          {job.location}
        </p>
      </section>

      {/* Pipeline summary */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-neutral-900">
          Pipeline overview
        </h2>
        <div className="mt-3 grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-xs text-neutral-700 sm:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">
              Total applications
            </p>
            <p className="mt-1 text-lg font-semibold">
              {appList.length}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">
              Stages
            </p>
            <p className="mt-1 text-lg font-semibold">
              {stageList.length}
            </p>
          </div>
        </div>
      </section>

      {/* Applications table */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">
          Applications
        </h2>

        {appList.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No applications yet for this job.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 text-[11px] uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Applied</th>
                </tr>
              </thead>
              <tbody>
                {appList.map((app: any, idx: number) => {
                  // Supabase sometimes returns related rows as arrays.
                  // Normalise candidate to a single object.
                  const candidate = Array.isArray(app.candidate)
                    ? app.candidate[0]
                    : app.candidate;

                  const stage = stageList.find(
                    (s) => s.id === app.current_stage_id
                  );

                  return (
                    <tr
                      key={app.id ?? idx}
                      className="border-t border-neutral-100 hover:bg-neutral-50/60"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium">
                          {candidate?.full_name ?? "Unnamed candidate"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-neutral-500">
                          {candidate?.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-xs">
                        <div>{candidate?.current_title}</div>
                        {candidate?.current_company && (
                          <div className="mt-0.5 text-[11px] text-neutral-500">
                            @{candidate.current_company}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-xs">
                        {stage?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 align-top text-xs capitalize">
                        {app.status ?? "unknown"}
                      </td>
                      <td className="px-4 py-3 align-top text-xs">
                        {app.applied_at
                          ? new Date(app.applied_at).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
