// app/ats/applications/actions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { requireTenantMembership } from "@/lib/requireTenantMembership";

export async function POST(request: Request) {
  const formData = await request.formData();

  const jobIdRaw = formData.get("jobId");
  const applicationIdRaw = formData.get("applicationId");
  const newStageRaw = formData.get("newStage");
  const redirectToRaw = formData.get("redirectTo");

  const jobId = typeof jobIdRaw === "string" ? jobIdRaw : "";
  const applicationId =
    typeof applicationIdRaw === "string" ? applicationIdRaw : "";
  const newStage = typeof newStageRaw === "string" ? newStageRaw : "";
  const redirectTo = typeof redirectToRaw === "string" ? redirectToRaw : "";

  if (!jobId || !applicationId || !newStage) {
    const fallbackUrl = new URL(request.url);
    fallbackUrl.pathname = "/ats/jobs";
    fallbackUrl.search = "";
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }

  try {
    const tenant = await getResourcinTenant();
    await requireTenantMembership(tenant.id);
    // For role-specific gating:
    // await requireTenantMembership(tenant.id, { allowedRoles: ["owner", "admin", "recruiter"] });

    // Make sure the application belongs to this job + tenant
    const appRecord = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        jobId,
        job: {
          tenantId: tenant.id,
        },
      },
      select: { id: true },
    });

    if (appRecord) {
      await prisma.jobApplication.update({
        where: { id: appRecord.id },
        data: {
          stage: newStage,
        },
      });
    }
  } catch (err) {
    console.error("Error updating application stage:", err);
  }

  const redirectPath =
    redirectTo && redirectTo.startsWith("/")
      ? redirectTo
      : `/ats/jobs/${jobId}`;

  const url = new URL(request.url);
  url.pathname = redirectPath;
  url.search = "";

  return NextResponse.redirect(url, { status: 303 });
}
