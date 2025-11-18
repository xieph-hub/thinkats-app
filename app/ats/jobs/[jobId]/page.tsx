// app/ats/jobs/[jobId]/page.tsx
import { getJobWithPipeline } from '@/lib/jobs';

export default async function JobPipelinePage({ params }: { params: { jobId: string } }) {
  const { job, stages, applications } = await getJobWithPipeline(params.jobId);

  const appsByStage = stages.map((stage) => ({
    stage,
    applications: applications.filter(
      (app) => app.current_stage_id === stage.id
    ),
  }));

  return (
    <main className="p-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">{job.title}</h1>
        <p className="text-sm text-neutral-500">
          {job.location} • {job.employment_type} • {job.department}
        </p>
      </header>

      <section className="flex gap-4 overflow-x-auto">
        {appsByStage.map(({ stage, applications }) => (
          <div
            key={stage.id}
            className="min-w-[260px] bg-neutral-50 border border-neutral-200 rounded-lg p-3"
          >
            <h2 className="text-sm font-semibold mb-2">
              {stage.name} ({applications.length})
            </h2>
            <div className="space-y-2">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white border border-neutral-200 rounded p-2 text-sm"
                >
                  <div className="font-medium">
                    {app.candidate.full_name}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {app.candidate.current_title} @{' '}
                    {app.candidate.current_company}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
