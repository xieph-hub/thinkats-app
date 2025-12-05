// app/api/ats/applications/bulk-stage/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export async function POST(request: Request) {
  const formData = await request.formData();

  const jobIdRaw = formData.get("jobId");
  const jobId = typeof jobIdRaw === "string" ? jobIdRaw : "";

  // All visible ids for this view (we'll pass them from the pipeline UI)
  const visibleIdsMulti = formData.getAll("visibleApplicationIds");
  const visibleIds: string[] = [];
  for (const v of visibleIdsMulti) {
    if (typeof v === "string" && v.trim()) {
      visibleIds.push(v.trim());
    }
  }

  // Accept either applicationIds (multi) or applicationId (single)
  const idsMulti = formData.getAll("applicationIds");
  const singleId = formData.get("applicationId");

  const selectAllVisibleRaw = formData.get("selectAllVisible");
  const selectAllVisible =
    typeof selectAllVisibleRaw === "string" &&
    selectAllVisibleRaw === "1";

  let applicationIds: string[] = [];

  if (selectAllVisible && visibleIds.length > 0) {
    // "Select all visible" overrides individual checkboxes
    applicationIds = [...visibleIds];
  } else {
    for (const v of idsMulti) {
      if (typeof v === "string" && v.trim()) {
        applicationIds.push(v.trim());
      }
    }
    if (applicationIds.length === 0 && typeof singleId === "string") {
      applicationIds.push(singleId.trim());
    }
  }

  const stageRaw = formData.get("stage") || formData.get("newStage");
  const newStage = typeof stageRaw === "string" ? stageRaw : "";

  if (!applicationIds.length || !newStage) {
    const fallbackUrl = new URL("/ats/jobs", request.url);
    return NextResponse.redirect(fallbackUrl, { status: 303 });
  }

  try {
    const tenant = await getResourcinTenant();
    const tenantId = tenant?.id ?? null;

    // Fetch current state so we can log previous stage/status per application
    const apps = await prisma.jobApplication.findMany({
      where: {
        id: { in: applicationIds },
        ...(jobId ? { jobId } : {}),
      },
      select: {
        id: true,
        stage: true,
        status: true,
        jobId: true,
      },
    });

    await Promise.all(
      apps.map(async (app) => {
        const updated = await prisma.jobApplication.update({
          where: { id: app.id },
          data: {
            stage: newStage,
          },
        });

        // application_events log
        try {
          await prisma.applicationEvent.create({
            data: {
              applicationId: updated.id,
              type: "bulk_stage_update",
              payload: {
                previousStage: app.stage,
                previousStatus: app.status,
                newStage,
                jobId: app.jobId,
                source: "bulk_pipeline_move",
              },
            },
          });
        } catch (eventErr) {
          console.error(
            "Bulk stage update – failed to insert ApplicationEvent:",
            eventErr,
          );
        }

        // activity_log log
        if (tenantId) {
          try {
            await prisma.activityLog.create({
              data: {
                tenantId,
                actorId: null,
                entityType: "job_application",
                entityId: updated.id,
                action: "bulk_stage_update",
                metadata: {
                  previousStage: app.stage,
                  previousStatus: app.status,
                  newStage,
                  jobId: app.jobId,
                  source: "bulk_pipeline_move",
                },
              },
            });
          } catch (logErr) {
            console.error(
              "Bulk stage update – failed to insert ActivityLog:",
              logErr,
            );
          }
        }
      }),
    );
  } catch (err) {
    console.error("Bulk stage update error:", err);
  }

  const redirectUrl = new URL(
    jobId ? `/ats/jobs/${jobId}` : "/ats/jobs",
    request.url,
  );
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
