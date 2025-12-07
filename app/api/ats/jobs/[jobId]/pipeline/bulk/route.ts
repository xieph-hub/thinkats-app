// app/api/ats/jobs/[jobId]/pipeline/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 },
      );
    }

    const jobId = params.jobId;
    if (!jobId) {
      return NextResponse.json(
        { ok: false, error: "Missing jobId" },
        { status: 400 },
      );
    }

    const body = await req.json();

    const applicationIds: string[] = body.applicationIds ?? [];
    const action: string | undefined = body.action;

    // Allow both "stage" and "nextStage"
    const targetStage: string | null =
      (action === "SET_STAGE" ? body.stage : null) ??
      body.nextStage ??
      null;

    // Allow both "status" and "nextStatus"
    const targetStatus: string | null =
      (action === "SET_STATUS" ? body.status : null) ??
      body.nextStatus ??
      null;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No applicationIds supplied" },
        { status: 400 },
      );
    }

    if (!targetStage && !targetStatus) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nothing to update. Provide stage and/or status.",
        },
        { status: 400 },
      );
    }

    const data: Record<string, any> = {};
    if (targetStage) data.stage = targetStage;
    if (targetStatus) data.status = targetStatus;

    // Update many job applications for this job & tenant
    const result = await prisma.jobApplication.updateMany({
      where: {
        id: { in: applicationIds },
        job: {
          id: jobId,
          tenantId: tenant.id,
        },
      },
      data,
    });

    return NextResponse.json({
      ok: true,
      updatedCount: result.count,
    });
  } catch (err: any) {
    console.error("pipeline bulk update error", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Internal error updating pipeline.",
      },
      { status: 500 },
    );
  }
}
