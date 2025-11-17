// app/api/candidate-applications/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailRaw = searchParams.get("email");

    if (!emailRaw) {
      return NextResponse.json(
        { error: "Missing email parameter" },
        { status: 400 }
      );
    }

    const email = emailRaw.trim().toLowerCase();

    const applications = await prisma.jobApplication.findMany({
      where: {
        email,
      },
      orderBy: { createdAt: "desc" },
      include: {
        job: true,
      },
    });

    const payload = applications.map((app) => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.job?.title ?? null,
      appliedAt: app.createdAt,
      source: app.source,
      stage: app.stage,
      status: app.status,
    }));

    return NextResponse.json({ applications: payload });
  } catch (error) {
    console.error("Error in /api/candidate-applications", error);
    return NextResponse.json(
      { error: "Failed to load applications" },
      { status: 500 }
    );
  }
}
