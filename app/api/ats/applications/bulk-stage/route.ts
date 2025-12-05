// app/api/ats/applications/bulk-stage/route.ts
import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  const formData = await request.formData();

  const jobIdRaw = formData.get("jobId");
  const jobId = typeof jobIdRaw === "string" ? jobIdRaw : "";

  const idsMulti = formData.getAll("applicationIds");
  const singleId = formData.get("applicationId");

  const applicationIds: string[] = [];

  for (const v of idsMulti) {
    if (typeof v === "string" && v.trim()) {
      applicationIds.push(v.trim());
    }
  }
  if (applicationIds.length === 0 && typeof singleId === "string") {
    applicationIds.push(singleId.trim());
  }

  const stageRaw = formData.get("stage") || formData.get("newStage");
  const newStageInput = typeof stageRaw === "string" ? stageRaw : "";
  const newStage = normaliseEnum(newStageInput);

  if (!applicationIds.length || !newStage) {
    const fallbackUrl = new URL(
      jobId ? `/ats/jobs/${jobId}` : "/ats/jobs",
      request.url,
    );
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }

  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      const fallbackUrl = new URL(
        jobId ? `/ats/jobs/${jobId}` : "/ats/jobs",
        request.url,
      );
      return NextResponse.redirect(fallbackUrl, { status: 303 });
    }

    const actor = await getServerUser().catch(() => null);

    // Only applications that belong to this tenant (+ optional job)
    const applications = await prisma.jobApplication.findMany({
      where: {
        id: { in: applicationIds },
        job: {
          tenantId: tenant.id,
          ...(jobId ? { id: jobId } : {}),
        },
      },
      select: {
        id: true,
        jobId: true,
        candidateId: true,
        stage: true,
        status: true,
      },
    });

    for (const app of applications) {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.jobApplication.update({
          where: { id: app.id },
          data: {
            stage: newStage,
          },
        });

        // Log as ApplicationEvent
        await tx.applicationEvent.create({
          data: {
            applicationId: updated.id,
            type: "bulk_stage_change",
            payload: {
              previousStage: app.stage,
              nextStage: newStage,
              previousStatus: app.status,
              nextStatus: app.status,
              bulk: true,
              tenantId: tenant.id,
              jobId: updated.jobId,
              candidateId: updated.candidateId,
              actorId: actor?.id,
            },
          },
        });

        // Global ActivityLog
        await tx.activityLog.create({
          data: {
            tenantId: tenant.id,
            actorId: actor?.id,
            entityType: "job_application",
            entityId: updated.id,
            action: "bulk_stage_change",
            metadata: {
              previousStage: app.stage,
              nextStage: newStage,
              previousStatus: app.status,
            },
          },
        });
      });
    }
  } catch (err) {
    console.error("Bulk stage update error:", err);
  }

  const redirectUrl = new URL(
    jobId ? `/ats/jobs/${jobId}` : "/ats/jobs",
    request.url,
  );
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
