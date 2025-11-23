// app/ats/jobs/[jobId]/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { ApplicationStage } from '@prisma/client';

export async function moveApplicationStage(formData: FormData) {
  const applicationId = formData.get('applicationId')?.toString();
  const stage = formData.get('stage')?.toString() as
    | ApplicationStage
    | undefined;

  if (!applicationId || !stage) return;

  const app = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { currentStage: stage },
    select: { jobId: true },
  });

  revalidatePath(`/ats/jobs/${app.jobId}`);
}
