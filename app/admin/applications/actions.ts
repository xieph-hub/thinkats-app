"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateApplicationStage(formData: FormData) {
  const id = formData.get("id") as string;
  const stage = formData.get("stage") as string;

  if (!id || !stage) return;

  await prisma.application.update({
    where: { id },
    data: {
      stage: stage as any, // ApplicationStage
    },
  });

  revalidatePath(`/admin/applications/${id}`);
}

export async function addApplicationNote(formData: FormData) {
  const applicationId = formData.get("applicationId") as string;
  const body = formData.get("body") as string;
  const author = formData.get("author") as string | null;

  if (!applicationId || !body) return;

  await prisma.applicationNote.create({
    data: {
      applicationId,
      body,
      author: author || null,
    },
  });

  revalidatePath(`/admin/applications/${applicationId}`);
}
