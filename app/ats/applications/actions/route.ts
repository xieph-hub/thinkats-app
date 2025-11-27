// app/ats/applications/actions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();

  const jobIdRaw = formData.get("jobId");
  const applicationIdRaw = formData.get("applicationId");
  const newStageRaw = formData.get("newStage");

  const jobId = typeof jobIdRaw === "string" ? jobIdRaw : "";
  const applicationId =
    typeof applicationIdRaw === "string" ? applicationIdRaw : "";
  const newStage =
    typeof newStageRaw === "string" ? newStageRaw : "";

  if (!jobId || !applicationId || !newStage) {
    // Nothing useful to do, bounce back to ATS jobs
    const fallbackUrl = new URL(request.url);
    fallbackUrl.pathname = "/ats/jobs";
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }

  try {
    // Nested update via Job -> applications relation
    await prisma.job.update({
      where: { id: jobId },
      data: {
        applications: {
          update: {
            where: { id: applicationId },
            data: {
              stage: newStage,
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("Error updating application stage:", err);
    // Still redirect back to job detail – later you can add flash messages
  }

  const redirectUrl = new URL(request.url);
  redirectUrl.pathname = `/ats/jobs/${jobId}`;
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
