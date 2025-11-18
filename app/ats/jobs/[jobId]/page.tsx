// app/ats/jobs/[jobId]/page.tsx
import { getJobWithPipeline } from '@/lib/jobs';

export default async function JobPipelinePage({ params }: { params: { jobId: string } }) {
  const { job, stages, applications } = await getJobWithPipeline(params.jobId);

  const appsByStage = stages.map((stage) => ({
    stage,
    applications: applications.filter(
      (a) => a.current_stage_id === stage.id
    ),
  }));

  // render Kanban board: columns = stages, cards = applications[stage]
}
