// app/api/ats/jobs/[jobId]/pipeline/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
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

    // 2) Tenant scope
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "tenant_not_found" },
        { status: 404 },
      );
    }

    // 3) Parse body
    const body = (await req.json().catch(() => null)) as BulkPipelineBody | null;

    if (!body || !Array.isArray(body.applicationIds) || body.applicationIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No applicationIds provided." },
        { status: 400 },
      );
    }

    const { applicationIds } = body;

    // Build update payload in a tolerant way so it works with
    // both the "old" and "new" client code.
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

    // 4) Ensure the job belongs to this tenant (extra safety)
    const job = await prisma.job.findFirst({
      where: { id: jobId, tenantId: tenant.id },
      select: { id: true },
    });

    if (!job) {
      return NextResponse.json(
        { ok: false, error: "job_not_found_for_tenant" },
        { status: 404 },
      );
    }

    // 5) Apply bulk update, scoped by tenant + job
    const result = await prisma.jobApplication.updateMany({
      where: {
        id: { in: applicationIds },
        jobId: jobId,
        job: {
          tenantId: tenant.id,
        },
      },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      updatedCount: result.count,
    });
  } catch (err) {
    // ⚠️ IMPORTANT: we never rethrow redirects here –
    // only log and return JSON so inline updates don’t blow up.
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
