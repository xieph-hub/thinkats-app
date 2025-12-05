// app/api/ats/applications/update-stage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { getServerUser } from "@/lib/auth/getServerUser";

export const runtime = "nodejs";

function normaliseEnum(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let payload: any = {};

    if (contentType.includes("application/json")) {
      payload = await req.json().catch(() => ({}));
    } else {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        payload = {
          applicationId: formData.get("applicationId") ?? undefined,
          stage: formData.get("stage") ?? undefined,
          status: formData.get("status") ?? undefined,
        };
      }
    }

    const applicationId = (payload.applicationId as string | undefined)?.trim();
    const stageInput = payload.stage as string | undefined;
    const statusInput = payload.status as string | undefined;

    if (!applicationId) {
      return NextResponse.json(
        { ok: false, error: "Missing applicationId" },
        { status: 400 },
      );
    }

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
        candidateId: true,
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

    const actor = await getServerUser().catch(() => null);

    const updated = await prisma.$transaction(async (tx) => {
      const updatedApp = await tx.jobApplication.update({
        where: { id: application.id },
        data: {
          stage: nextStage,
          status: nextStatus,
          statusChangedAt:
            application.status !== nextStatus
              ? new Date()
              : application.statusChangedAt,
        },
      });

      // ApplicationEvent for timeline — log tenant/job/etc INSIDE payload
      await tx.applicationEvent.create({
        data: {
          applicationId: updatedApp.id,
          type: "stage_status_change",
          payload: {
            previousStage: application.stage,
            nextStage,
            previousStatus: application.status,
            nextStatus,
            tenantId: tenant.id,
            jobId: updatedApp.jobId,
            candidateId: updatedApp.candidateId,
            actorId: actor?.id,
          },
        },
      });

      // ActivityLog for global audit
      await tx.activityLog.create({
        data: {
          tenantId: tenant.id,
          actorId: actor?.id,
          entityType: "job_application",
          entityId: updatedApp.id,
          action: "stage_status_change",
          metadata: {
            previousStage: application.stage,
            nextStage,
            previousStatus: application.status,
            nextStatus,
          },
        },
      });

      return updatedApp;
    });

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
