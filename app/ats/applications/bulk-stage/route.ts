// app/ats/applications/bulk-stage/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export async function POST(request: Request) {
  const formData = await request.formData();

  const jobIdRaw = formData.get("jobId");
  const newStageRaw = formData.get("newStage");

  const jobId = typeof jobIdRaw === "string" ? jobIdRaw : "";
  const newStage = typeof newStageRaw === "string" ? newStageRaw : "";

  // Support multiple possible field names for selected IDs:
  const idFields = [
    ...formData.getAll("applicationIds"),
    ...formData.getAll("applicationIds[]"),
    ...formData.getAll("ids"),
    ...formData.getAll("ids[]"),
  ];

  const applicationIds = idFields.filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );

  // If form is incomplete, send them back to ATS jobs
  if (!jobId || !newStage || applicationIds.length === 0) {
    const fallbackUrl = new URL(request.url);
    fallbackUrl.pathname = "/ats/jobs";
    fallbackUrl.search = "";
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }

  try {
    const tenant = await getResourcinTenant();

    if (!tenant) {
      const url = new URL(request.url);
      url.pathname = "/ats/jobs";
      url.search = "";
      return NextResponse.redirect(url, { status: 303 });
    }

    // Bulk update stage
    await prisma.jobApplication.updateMany({
      where: {
        id: { in: applicationIds },
        job: {
          id: jobId,
          tenantId: tenant.id,
        },
      },
      data: {
        stage: newStage,
      },
    });
  } catch (err) {
    console.error("Bulk stage update error:", err);
    // We still redirect – later you can add a flash message system if you want
  }

  const redirectUrl = new URL(request.url);
  redirectUrl.pathname = `/ats/jobs/${jobId}`;
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
