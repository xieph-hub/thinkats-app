// app/ats/tenants/[tenantId]/careersite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureOtpVerified } from "@/lib/requireOtp";

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  await ensureOtpVerified("/ats");

  const tenantId = params.tenantId;
  const formData = await req.formData();

  const heroTitle = (formData.get("heroTitle") || "").toString().trim();
  const heroSubtitle = (formData.get("heroSubtitle") || "").toString().trim();
  const aboutHtml = (formData.get("aboutHtml") || "").toString().trim();
  const primaryColor = (formData.get("primaryColor") || "").toString().trim();
  const accentColor = (formData.get("accentColor") || "").toString().trim();
  const isPublic = formData.get("isPublic") === "on";

  // Ensure tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return NextResponse.redirect(new URL("/ats/tenants", req.url));
  }

  const existing = await prisma.careerSiteSettings.findFirst({
    where: { tenantId },
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
      },
    });
  }

  const redirectUrl = new URL(
    `/ats/tenants/${encodeURIComponent(tenantId)}/careersite?saved=1`,
    req.url,
  );
  return NextResponse.redirect(redirectUrl);
}
