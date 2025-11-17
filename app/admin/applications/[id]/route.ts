// app/api/admin/applications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();

    const data: { stage?: string; status?: string } = {};

    if (body.stage) {
      data.stage = body.stage; // assume valid enum from UI
    }
    if (body.status) {
      data.status = body.status; // assume valid enum from UI
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
