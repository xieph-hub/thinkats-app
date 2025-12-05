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

    // Ensure application belongs to this tenant and capture current values
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        job: {
          tenantId: tenant.id,
        },
      },
      select: {
        id: true,
        jobId: true,
        stage: true,
        status: true,
        statusChangedAt: true,
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

    // If nothing changes, just return current state
    if (
      nextStage === application.stage &&
      nextStatus === application.status
    ) {
      return NextResponse.json({
        ok: true,
        applicationId: application.id,
        stage: application.stage,
        status: application.status,
        unchanged: true,
      });
    }

    const now = new Date();

    const updated = await prisma.jobApplication.update({
      where: { id: application.id },
      data: {
        stage: nextStage,
        status: nextStatus,
        statusChangedAt:
          nextStatus !== application.status
            ? now
            : application.statusChangedAt ?? now,
        updatedAt: now,
      },
      select: {
        id: true,
        jobId: true,
        stage: true,
        status: true,
      },
    });

    // Fire-and-forget logging
    const loggingOps: Promise<unknown>[] = [];

    // Application-level event
    loggingOps.push(
      prisma.applicationEvent.create({
        data: {
          applicationId: application.id,
          type: "stage_status_change",
          payload: {
            fromStage: application.stage,
            toStage: nextStage,
            fromStatus: application.status,
            toStatus: nextStatus,
            source: "inline_pipeline",
          },
        },
      }),
    );

    // Tenant-level audit log
    loggingOps.push(
      prisma.activityLog.create({
        data: {
          tenantId: tenant.id,
          actorId: null, // can be wired to a user later
          entityType: "job_application",
          entityId: application.id,
          action: "stage_status_change",
          metadata: {
            jobId: application.jobId,
            fromStage: application.stage,
            toStage: nextStage,
            fromStatus: application.status,
            toStatus: nextStatus,
            source: "inline_pipeline",
          },
        },
      }),
    );

    // Don't block user on logging; just avoid unhandled rejections
    await Promise.allSettled(loggingOps);

    return NextResponse.json(
      {
        ok: true,
        applicationId: updated.id,
        stage: updated.stage,
        status: updated.status,
      },
      { status: 200 },
    );
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
