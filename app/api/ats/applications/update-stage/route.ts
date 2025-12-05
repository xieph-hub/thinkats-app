// app/api/ats/applications/update-stage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

function normaliseEnum(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const applicationId = body.applicationId as string | undefined;
    const stageInput = body.stage as string | undefined;
    const statusInput = body.status as string | undefined;

    if (!applicationId) {
      return NextResponse.json(
        { ok: false, error: "Missing applicationId" },
        { status: 400 },
      );
    }

    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    // Ensure the application belongs to the current tenant
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        job: {
          tenantId: tenant.id,
        },
      },
      select: {
        id: true,
        stage: true,
        status: true,
        jobId: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { ok: false, error: "Application not found for this tenant" },
        { status: 404 },
      );
    }

    const nextStage =
      normaliseEnum(stageInput) ||
      (application.stage as string | undefined) ||
      "APPLIED";
    const nextStatus =
      normaliseEnum(statusInput) ||
      (application.status as string | undefined) ||
      "PENDING";

    const updated = await prisma.jobApplication.update({
      where: { id: application.id },
      data: {
        stage: nextStage,
        status: nextStatus,
      },
    });

    // --- Logging: application_events ---
    try {
      await prisma.applicationEvent.create({
        data: {
          applicationId: updated.id,
          type: "stage_status_update",
          payload: {
            previousStage: application.stage,
            previousStatus: application.status,
            nextStage,
            nextStatus,
            jobId: application.jobId,
            source: "inline_pipeline",
          },
        },
      });
    } catch (eventErr) {
      console.error(
        "Update application stage – failed to insert ApplicationEvent:",
        eventErr,
      );
    }

    // --- Logging: activity_log ---
    try {
      await prisma.activityLog.create({
        data: {
          tenantId: tenant.id,
          actorId: null, // can be wired to an authenticated user later
          entityType: "job_application",
          entityId: updated.id,
          action: "stage_status_update",
          metadata: {
            previousStage: application.stage,
            previousStatus: application.status,
            nextStage,
            nextStatus,
            jobId: application.jobId,
            source: "inline_pipeline",
          },
        },
      });
    } catch (logErr) {
      console.error(
        "Update application stage – failed to insert ActivityLog:",
        logErr,
      );
    }

    return NextResponse.json({
      ok: true,
      applicationId: updated.id,
      stage: updated.stage,
      status: updated.status,
    });
  } catch (err) {
    console.error("Update application stage error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected error updating application stage",
      },
      { status: 500 },
    );
  }
}
