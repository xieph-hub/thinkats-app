// app/api/admin/applications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationStage, ApplicationStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();

    // Make sure we use the Prisma enums, not plain strings
    const data: {
      stage?: ApplicationStage;
      status?: ApplicationStatus;
    } = {};

    if (body.stage) {
      data.stage = body.stage as ApplicationStage;
    }

    if (body.status) {
      data.status = body.status as ApplicationStatus;
    }

    if (!data.stage && !data.status) {
      return NextResponse.json(
        { error: "No stage or status provided" },
        { status: 400 }
      );
    }

    await prisma.jobApplication.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating application", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
