// app/api/ats/candidates/bulk/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

type BulkPayload = {
  tenantId?: string;
  applicationIds?: string[];
  action?: string; // e.g. "stage:INTERVIEW" or "stage"
  stage?: string;
  status?: string;
  tag?: string;
};

async function parseBulkBody(req: Request): Promise<BulkPayload> {
  const contentType = req.headers.get("content-type") || "";

  // ✅ JSON (used by inline stage changes on /ats/jobs/[jobId])
  if (contentType.includes("application/json")) {
    return (await req.json()) as BulkPayload;
  }

  // ✅ HTML form / multipart (used by /ats/candidates inbox bulk form)
  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const formData = await req.formData();

    const tenantId = formData.get("tenantId")?.toString();
    const action =
      formData.get("action")?.toString() ||
      formData.get("bulkAction")?.toString() ||
      "";

    const stage = formData.get("stage")?.toString();
    const status = formData.get("status")?.toString();
    const tag = formData.get("tag")?.toString();

    const applicationIdsRaw = formData.getAll("applicationIds");
    const applicationIds = applicationIdsRaw
      .map((v) => (typeof v === "string" ? v : String(v)))
      .filter(Boolean);

    return {
      tenantId,
      action,
      stage,
      status,
      tag,
      applicationIds,
    };
  }

  // Fallback: try JSON anyway, but do NOT call req.formData() again
  try {
    return (await req.json()) as BulkPayload;
  } catch {
    throw new Error(
      'Unsupported Content-Type. Expected "application/json" or form-data.',
    );
  }
}

export async function POST(req: Request) {
  try {
    const payload = await parseBulkBody(req);

    // Resolve tenant (still useful for auditing/logging later if you add tenantId to JobApplication)
    const fallbackTenant = await getResourcinTenant().catch(() => null);
    const tenantId = payload.tenantId || fallbackTenant?.id;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Missing tenant context." },
        { status: 400 },
      );
    }

    const applicationIds = payload.applicationIds ?? [];
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No application IDs provided.",
        },
        { status: 400 },
      );
    }

    const action = payload.action || "";

    // --------------------------------------------------
    // 1) Stage changes (supports:
    //    - action="stage"
    //    - action="stage:INTERVIEW"
    //    - JSON body with { stage: "INTERVIEW" }
    // --------------------------------------------------
    if (action.startsWith("stage:")) {
      const stageFromAction = action.slice("stage:".length);
      const stage = stageFromAction || payload.stage;

      if (!stage) {
        return NextResponse.json(
          { success: false, error: "Missing stage value." },
          { status: 400 },
        );
      }

      await prisma.jobApplication.updateMany({
        where: {
          id: { in: applicationIds },
          // ❌ no tenantId here – JobApplication model doesn’t have it
        },
        data: { stage },
      });

      return NextResponse.json({
        success: true,
        updated: applicationIds.length,
        stage,
      });
    }

    if (action === "stage" || payload.stage) {
      const stage = payload.stage;
      if (!stage) {
        return NextResponse.json(
          { success: false, error: "Missing stage value." },
          { status: 400 },
        );
      }

      await prisma.jobApplication.updateMany({
        where: {
          id: { in: applicationIds },
        },
        data: { stage },
      });

      return NextResponse.json({
        success: true,
        updated: applicationIds.length,
        stage,
      });
    }

    // --------------------------------------------------
    // 2) Status changes (if/when you wire them from UI)
    // --------------------------------------------------
    if (action === "status" || payload.status) {
      const status = payload.status;
      if (!status) {
        return NextResponse.json(
          { success: false, error: "Missing status value." },
          { status: 400 },
        );
      }

      await prisma.jobApplication.updateMany({
        where: {
          id: { in: applicationIds },
        },
        data: { status },
      });

      return NextResponse.json({
        success: true,
        updated: applicationIds.length,
        status,
      });
    }

    // --------------------------------------------------
    // 3) Tagging hook (ready for future use)
    // --------------------------------------------------
    if (action === "tag" || payload.tag) {
      const tag = payload.tag;
      // You can extend this once you decide how tags are stored
      return NextResponse.json({
        success: true,
        updated: 0,
        note:
          "Tag action acknowledged, but not yet implemented in the DB schema.",
        tag,
      });
    }

    // --------------------------------------------------
    // Fallback: no recognised action
    // --------------------------------------------------
    return NextResponse.json(
      {
        success: false,
        error: "Unsupported or missing bulk action.",
      },
      { status: 400 },
    );
  } catch (err) {
    console.error("POST /api/ats/candidates/bulk error", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process bulk candidate update.",
      },
      { status: 500 },
    );
  }
}
