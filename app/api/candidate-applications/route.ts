// app/api/candidate-applications/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // ...keep your existing logic here exactly as it was...
}
 {
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
      where: { email },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            title: true,
            clientCompany: {
              select: { name: true },
            },
          },
        },
      },
    });

    const payload = applications.map((app) => ({
      id: app.id,
      createdAt: app.createdAt.toISOString(),
      jobTitle: app.job?.title ?? "Role",
      clientName: app.job?.clientCompany?.name ?? null,
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
