// app/ats/applications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const applicationId = formData.get("applicationId")?.toString() || "";
  const jobId = formData.get("jobId")?.toString() || "";
  const tenantIdFromForm = formData.get("tenantId")?.toString() || "";
  const newStageRaw = formData.get("newStage")?.toString() || "";

  // Normalise stage to uppercase so it plays nicely with your grouping
  const newStage = newStageRaw.toUpperCase();

  if (!applicationId || !newStage) {
    return redirectBack(req, jobId);
  }

  // Resolve tenant (prefer form, fall back to default)
  let tenantId = tenantIdFromForm;
  if (!tenantId) {
    const defaultTenant = await getResourcinTenant();
    if (!defaultTenant) {
      return redirectBack(req, jobId);
    }
    tenantId = defaultTenant.id;
  }

  // Make sure this application belongs to that tenant via its job
  const appRecord = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      job: {
        tenantId,
      },
    },
    select: { id: true },
  });

  if (!appRecord) {
    // Either job/application mismatch or wrong tenant – just bounce back.
    return redirectBack(req, jobId);
  }

  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      stage: newStage,
    },
  });

  return redirectBack(req, jobId);
}

function redirectBack(req: NextRequest, jobId: string) {
  const url = new URL(req.url);
  const redirectPath = jobId ? `/ats/jobs/${jobId}` : "/ats/jobs";
  return NextResponse.redirect(new URL(redirectPath, url.origin));
}
