import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  try {
    const tenantId = params.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "Missing tenantId" },
        { status: 400 },
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "Tenant not found" },
        { status: 404 },
      );
    }

    const formData = await req.formData();

    const heroTitle = (formData.get("heroTitle") || "").toString().trim();
    const heroSubtitle = (formData.get("heroSubtitle") || "")
      .toString()
      .trim();
    const aboutHtml = (formData.get("aboutHtml") || "").toString().trim();
    const primaryColor = (formData.get("primaryColor") || "")
      .toString()
      .trim();
    const accentColor = (formData.get("accentColor") || "")
      .toString()
      .trim();

    const isPublic = formData.get("isPublic") === "on";
    const includeInMarketplace =
      formData.get("includeInMarketplace") === "on";

    const existing = await prisma.careerSiteSettings.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await prisma.careerSiteSettings.update({
        where: { id: existing.id },
        data: {
          heroTitle: heroTitle || null,
          heroSubtitle: heroSubtitle || null,
          aboutHtml: aboutHtml || null,
          primaryColor: primaryColor || null,
          accentColor: accentColor || null,
          isPublic,
          includeInMarketplace,
        },
      });
    } else {
      await prisma.careerSiteSettings.create({
        data: {
          tenantId,
          heroTitle: heroTitle || null,
          heroSubtitle: heroSubtitle || null,
          aboutHtml: aboutHtml || null,
          primaryColor: primaryColor || null,
          accentColor: accentColor || null,
          isPublic,
          includeInMarketplace,
        },
      });
    }

    const redirectUrl = new URL(
      `/ats/tenants/${tenantId}/careersite?updated=1`,
      req.nextUrl.origin,
    );

    return NextResponse.redirect(redirectUrl.toString(), { status: 303 });
  } catch (err) {
    console.error("[CAREERSITE_SETTINGS_UPDATE] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error saving settings" },
      { status: 500 },
    );
  }
}
