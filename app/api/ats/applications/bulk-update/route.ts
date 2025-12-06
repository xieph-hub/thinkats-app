// app/api/ats/applications/bulk-update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationIds, stage, status } = body ?? {};

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "applicationIds array is required" },
        { status: 400 },
      );
    }

    const data: any = {};
    if (typeof stage === "string" && stage.length > 0) {
      data.stage = stage;
    }
    if (typeof status === "string" && status.length > 0) {
      data.status = status;
      data.statusChangedAt = new Date();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "Nothing to update" },
        { status: 400 },
      );
    }

    await prisma.jobApplication.updateMany({
      where: { id: { in: applicationIds } },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Bulk update applications failed", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
