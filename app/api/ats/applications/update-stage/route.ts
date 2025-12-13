// app/api/ats/applications/update-stage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const runtime = "nodejs";

function firstString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export async function POST(request: NextRequest) {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: "No tenant configured" },
      { status: 400 },
    );
  }

  const formData = await request.formData();

  const applicationId = firstString(formData.get("applicationId")).trim();
  const jobId = firstString(formData.get("jobId")).trim();

  const newStage = firstString(formData.get("stage") || formData.get("newStage"))
    .trim();
  const newStatus = firstString(
    formData.get("status") || formData.get("newStatus"),
  ).trim();

  const redirectToRaw = firstString(formData.get("redirectTo")).trim();
  const fallbackPath = jobId ? `/ats/jobs/${jobId}` : "/ats/jobs";
  const fallbackUrl = new URL(redirectToRaw || fallbackPath, request.url);

  if (!applicationId) {
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }

  try {
    // Tenant-safe load (enforced through job.tenantId)
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        job: { tenantId: tenant.id },
      },
      select: {
        id: true,
        stage: true,
        status: true,
        jobId: true,
      },
    });

    if (!application) {
      return NextResponse.redirect(fallbackUrl, { status: 303 });
    }

    const fromStage = application.stage || "";
    const fromStatus = application.status || "";

    const toStage = newStage || fromStage;
    const toStatus = newStatus || fromStatus;

    await prisma.jobApplication.update({
      where: { id: application.id },
      data: {
        stage: toStage,
        status: toStatus,
        updatedAt: new Date(),
        statusChangedAt: toStatus !== fromStatus ? new Date() : undefined,
      },
    });

    // Logging (best-effort)
    const now = new Date();
    const loggingOps: Promise<any>[] = [];

    // ✅ FIX: use tenant relation connect (NOT tenantId) + application connect
    loggingOps.push(
      prisma.applicationEvent.create({
        data: {
          tenant: { connect: { id: tenant.id } },
          application: { connect: { id: application.id } },
          type: "stage_status_change",
          payload: {
            fromStage,
            toStage,
            fromStatus,
            toStatus,
            source: "pipeline_single_move",
            movedAt: now.toISOString(),
          },
          createdAt: now,
        },
      }),
    );

    loggingOps.push(
      prisma.activityLog.create({
        data: {
          tenantId: tenant.id,
          actorId: null,
          entityType: "job_application",
          entityId: application.id,
          action: "stage_status_change",
          metadata: {
            jobId: application.jobId,
            fromStage,
            toStage,
            fromStatus,
            toStatus,
            source: "pipeline_single_move",
            movedAt: now.toISOString(),
          },
          createdAt: now,
        },
      }),
    );

    await Promise.allSettled(loggingOps);
  } catch (err) {
    console.error("Update stage error:", err);
    // still redirect
  }

  return NextResponse.redirect(fallbackUrl, { status: 303 });
}
