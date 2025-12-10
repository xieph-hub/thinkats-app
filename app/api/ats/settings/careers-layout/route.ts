// app/api/ats/settings/careers-layout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCareerLayout } from "@/lib/careersLayout";
import { CareerPageKind } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      tenantId?: string;
      layout?: unknown;
    };

    const tenantId = body.tenantId?.trim();
    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "tenantId is required." },
        { status: 400 },
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "Tenant not found." },
        { status: 404 },
      );
    }

    // Validate / normalise layout with Zod
    const layout = parseCareerLayout(body.layout);

    const page = await prisma.careerPage.upsert({
      where: {
        tenantId_slug: {
          tenantId,
          slug: "careers-home",
        },
      },
      update: {
        layout,
        isPublished: true,
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        clientCompanyId: null,
        themeId: null,
        kind: CareerPageKind.CAREERS_HOME,
        slug: "careers-home",
        path: "/careers",
        title:
          tenant.name ??
          // @ts-expect-error slug may exist via @@map
          (tenant as any).slug ??
          "Careers",
        description: null,
        layout,
        isPublished: true,
        isDefault: true,
      },
    });

    return NextResponse.json({ ok: true, page });
  } catch (err) {
    console.error("Error updating careers layout:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update careers layout." },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Use POST to update careers page layout." },
    { status: 405 },
  );
}
