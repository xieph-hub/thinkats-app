// app/api/ats/jobs/[jobId]/pipeline/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

type BulkPipelineBody = {
  applicationIds: string[];
  // Inline edits may send these directly…
  stage?: string | null;
  status?: string | null;
  tier?: string | null;
  // …or wrap them in a generic updates object
  updates?: Record<string, any> | null;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const { jobId } = params;

    // 1) Auth: cookie-based ATS user
    const ctx = await getServerUser();
    if (!ctx || !ctx.user) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const { isSuperAdmin, tenantRoles } = ctx;

    // 2) Parse body safely
    const body = (await req.json().catch(() => null)) as BulkPipelineBody | null;

    if (
      !body ||
      !Array.isArray(body.applicationIds) ||
      body.applicationIds.length === 0
    ) {
      return NextResponse.json(
        { ok: false, error: "No applicationIds provided." },
        { status: 400 },
      );
    }

    const { applicationIds } = body;

    // 3) Build update payload in a tolerant way
    const updateData: Record<string, any> = {};

    // If client sends an `updates` object, start from that
    if (body.updates && typeof body.updates === "object") {
      Object.assign(updateData, body.updates);
    }

    // Then override with explicit fields if present
    if (typeof body.stage === "string" && body.stage.trim()) {
      updateData.stage = body.stage.trim();
    }

    if (typeof body.status === "string" && body.status.trim()) {
      updateData.status = body.status.trim();
    }

    if (typeof body.tier === "string" && body.tier.trim()) {
      updateData.tier = body.tier.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { ok: false, error: "No updates specified (stage/status/tier)." },
        { status: 400 },
      );
    }

    // 4) Load job and make sure user has access
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, tenantId: true },
    });

    if (!job) {
      return NextResponse.json(
        { ok: false, error: "job_not_found" },
        { status: 404 },
      );
    }

    if (!isSuperAdmin) {
      const canAccessTenant = tenantRoles.some(
        (r) => r.tenantId === job.tenantId,
      );

      if (!canAccessTenant) {
        return NextResponse.json(
          { ok: false, error: "no_access_to_job_tenant" },
          { status: 403 },
        );
      }
    }

    // 5) Apply bulk update, scoped to this job (and implicitly tenant)
    const result = await prisma.jobApplication.updateMany({
      where: {
        id: { in: applicationIds },
        jobId: job.id,
      },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      updatedCount: result.count,
    });
  } catch (err) {
    // ⚠️ We never rethrow redirects here – only log and return JSON
    console.error("Bulk pipeline update error", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong while updating the pipeline. Please try again.",
      },
      { status: 500 },
    );
  }
}
