// app/api/ats/jobs/[jobId]/pipeline/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant, requireTenantMembership } from "@/lib/tenant";

type BulkActionBody = {
  jobId?: string;
  applicationIds?: string[];
  action?: "move_stage" | "set_status";
  stage?: string;
  status?: "PENDING" | "ON_HOLD" | "REJECTED" | string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated_tenant" },
        { status: 401 },
      );
    }

    // 🔐 Enforce tenant membership + role
    await requireTenantMembership(tenant.id, {
      allowedRoles: ["OWNER", "ADMIN", "RECRUITER"],
    });

    const urlJobId = params.jobId;
    const body = (await req.json()) as BulkActionBody;

    const {
      jobId: bodyJobId,
      applicationIds,
      action,
      stage,
      status,
    } = body || {};

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No applicationIds provided" },
        { status: 400 },
      );
    }

    if (!action) {
      return NextResponse.json(
        { ok: false, error: "No action specified" },
        { status: 400 },
      );
    }

    // Ensure the jobId in the URL is canonical
    if (bodyJobId && bodyJobId !== urlJobId) {
      return NextResponse.json(
        { ok: false, error: "Job ID mismatch between URL and body" },
        { status: 400 },
      );
    }

    // First, verify this job belongs to the current tenant
    const job = await prisma.job.findFirst({
      where: {
        id: urlJobId,
        tenantId: tenant.id,
      },
      select: { id: true },
    });

    if (!job) {
      return NextResponse.json(
        { ok: false, error: "Job not found for this tenant" },
        { status: 404 },
      );
    }

    let updatedCount = 0;

    if (action === "move_stage") {
      if (!stage || !stage.trim()) {
        return NextResponse.json(
          { ok: false, error: "Stage is required for move_stage" },
          { status: 400 },
        );
      }

      const normalisedStage = stage.toUpperCase().trim();

      const result = await prisma.jobApplication.updateMany({
        where: {
          id: { in: applicationIds },
          jobId: urlJobId,
          job: {
            tenantId: tenant.id,
          },
        },
        data: {
          stage: normalisedStage,
        },
      });

      updatedCount = result.count;
    } else if (action === "set_status") {
      if (!status || !status.trim()) {
        return NextResponse.json(
          { ok: false, error: "Status is required for set_status" },
          { status: 400 },
        );
      }

      const normalisedStatus = status.toUpperCase().trim(); // PENDING / ON_HOLD / REJECTED

      const result = await prisma.jobApplication.updateMany({
        where: {
          id: { in: applicationIds },
          jobId: urlJobId,
          job: {
            tenantId: tenant.id,
          },
        },
        data: {
          status: normalisedStatus,
        },
      });

      updatedCount = result.count;
    } else {
      return NextResponse.json(
        { ok: false, error: `Unsupported action: ${action}` },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      jobId: urlJobId,
      action,
      updatedCount,
    });
  } catch (err) {
    console.error("Bulk pipeline update error", err);
    const message =
      err instanceof Error ? err.message : "Unexpected error during bulk update.";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
