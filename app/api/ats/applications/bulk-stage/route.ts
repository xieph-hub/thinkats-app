// app/api/ats/applications/bulk-stage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  const tenant = await getResourcinTenant();
  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: "No tenant configured" },
      { status: 400 },
    );
  }

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
  const newStage = typeof stageRaw === "string" ? stageRaw.trim() : "";

  const fallbackUrl = new URL(
    jobId ? `/ats/jobs/${jobId}` : "/ats/jobs",
    request.url,
  );

  if (!applicationIds.length || !newStage) {
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }

  try {
    // Only consider applications that belong to this tenant (and job, if provided)
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
        stage: true,
        status: true,
      },
    });

    if (!applications.length) {
      return NextResponse.redirect(fallbackUrl, { status: 303 });
    }

    const idsToUpdate = applications.map((a) => a.id);

    await prisma.jobApplication.updateMany({
      where: {
        id: { in: idsToUpdate },
      },
      data: {
        stage: newStage,
        updatedAt: new Date(),
      },
    });

    // Logging (best-effort)
    const now = new Date();

    // application_events
    const appEventsData = applications.map((app) => ({
      applicationId: app.id,
      type: "bulk_stage_change",
      payload: {
        fromStage: app.stage,
        toStage: newStage,
        fromStatus: app.status,
        toStatus: app.status,
        source: "pipeline_bulk_move",
        movedAt: now.toISOString(),
      },
    }));

    if (appEventsData.length) {
      await prisma.applicationEvent.createMany({
        data: appEventsData,
      });
    }

    // activity_log
    const activityData = applications.map((app) => ({
      tenantId: tenant.id,
      actorId: null, // later we can wire this to the current user
      entityType: "job_application",
      entityId: app.id,
      action: "bulk_stage_change",
      metadata: {
        jobId: app.jobId,
        fromStage: app.stage,
        toStage: newStage,
        fromStatus: app.status,
        toStatus: app.status,
        batchSize: applications.length,
        source: "pipeline_bulk_move",
        movedAt: now.toISOString(),
      },
      createdAt: now,
    }));

    if (activityData.length) {
      await prisma.activityLog.createMany({
        data: activityData,
      });
    }
  } catch (err) {
    console.error("Bulk stage update error:", err);
    // We still redirect back to the pipeline so the UI doesn't break
  }

  const redirectUrl = new URL(
    jobId ? `/ats/jobs/${jobId}` : "/ats/jobs",
    request.url,
  );
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
