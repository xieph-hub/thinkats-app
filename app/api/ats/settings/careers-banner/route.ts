// app/api/ats/settings/careers-banner/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const tenantId =
      typeof body.tenantId === "string" ? body.tenantId.trim() : "";
    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "tenantId is required" },
        { status: 400 },
      );
    }

    const bannerImageUrl =
      typeof body.bannerImageUrl === "string"
        ? body.bannerImageUrl.trim()
        : "";
    const bannerImagePath =
      typeof body.bannerImagePath === "string"
        ? body.bannerImagePath.trim()
        : "";

    if (!bannerImageUrl) {
      return NextResponse.json(
        { ok: false, error: "bannerImageUrl is required" },
        { status: 400 },
      );
    }

    const data: Record<string, any> = {
      bannerImageUrl,
      updatedAt: new Date(),
    };

    if (bannerImagePath) {
      data.bannerImagePath = bannerImagePath;
    }

    const existing = await prisma.careerSiteSettings.findFirst({
      where: { tenantId },
    });

    const settings = existing
      ? await prisma.careerSiteSettings.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.careerSiteSettings.create({
          data: {
            tenantId,
            ...data,
          },
        });

    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error("Error saving careers banner:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to save banner image" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Use POST to update careers banner." },
    { status: 405 },
  );
}
