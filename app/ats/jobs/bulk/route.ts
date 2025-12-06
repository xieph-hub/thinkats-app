// app/api/ats/jobs/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

type BulkBody = {
  jobIds: string[];
  action: "publish" | "unpublish";
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BulkBody | null;

    const jobIds = body?.jobIds;
    const action = body?.action;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No jobIds provided." },
        { status: 400 },
      );
    }

    if (action !== "publish" && action !== "unpublish") {
      return NextResponse.json(
        { ok: false, error: "Invalid bulk action." },
        { status: 400 },
      );
    }

    const tenant = await getResourcinTenant();

    const where = {
      id: { in: jobIds },
      tenantId: tenant.id,
    };

    const data =
      action === "publish"
        ? { isPublished: true }
        : { isPublished: false };

    const result = await prisma.job.updateMany({
      where,
      data,
    });

    return NextResponse.json({
      ok: true,
      updatedCount: result.count,
    });
  } catch (err) {
    console.error("Bulk jobs update failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong while updating jobs. Please try again.",
      },
      { status: 500 },
    );
  }
}
