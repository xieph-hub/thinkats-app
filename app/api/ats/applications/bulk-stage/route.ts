// app/api/ats/applications/bulk-stage/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();

  const jobIdRaw = formData.get("jobId");
  const jobId = typeof jobIdRaw === "string" ? jobIdRaw : "";

  // Accept either applicationIds (multi) or applicationId
  const idsMulti = formData.getAll("applicationIds");
  const singleId = formData.get("applicationId");

  const applicationIds: string[] = [];

  for (const v of idsMulti) {
    if (typeof v === "string" && v.trim()) {
      applicationIds.push(v.trim());
    }
  }
  if (applicationIds.length === 0 && typeof singleId === "string") {
    applicationIds.push(singleId);
  }

  const stageRaw = formData.get("stage") || formData.get("newStage");
  const newStage = typeof stageRaw === "string" ? stageRaw : "";

  if (!applicationIds.length || !newStage) {
    const fallbackUrl = new URL("/ats/jobs", request.url);
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }

  try {
    await prisma.jobApplication.updateMany({
      where: {
        id: { in: applicationIds },
        ...(jobId ? { jobId } : {}),
      },
      data: {
        stage: newStage,
      },
    });
  } catch (err) {
    console.error("Bulk stage update error:", err);
  }

  const redirectUrl = new URL(
    jobId ? `/ats/jobs/${jobId}` : "/ats/jobs",
    request.url,
  );
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
