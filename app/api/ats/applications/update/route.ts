// app/api/ats/applications/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationId, stage, status } = body ?? {};

    if (!applicationId || typeof applicationId !== "string") {
      return NextResponse.json(
        { ok: false, error: "applicationId is required" },
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

    const updated = await prisma.jobApplication.update({
      where: { id: applicationId },
      data,
    });

    return NextResponse.json({ ok: true, application: updated });
  } catch (error) {
    console.error("Update application failed", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
