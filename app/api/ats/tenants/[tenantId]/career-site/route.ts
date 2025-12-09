import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  heroTitle?: string;
  heroSubtitle?: string;
  aboutHtml?: string;
  logoUrl?: string;
  bannerImageUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
};

function normalise(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  const { tenantId } = params;

  // TODO: plug in your real ATS auth / permissions check here.
  // e.g. requireAtsUserWithTenantRole(tenantId, ["owner","admin"])

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: "tenant_not_found" },
      { status: 404 },
    );
  }

  const existing = await prisma.careerSiteSettings.findFirst({
    where: { tenantId },
  });

  const data = {
    heroTitle: normalise(body.heroTitle),
    heroSubtitle: normalise(body.heroSubtitle),
    aboutHtml: normalise(body.aboutHtml),
    logoUrl: normalise(body.logoUrl),
    bannerImageUrl: normalise(body.bannerImageUrl),
    linkedinUrl: normalise(body.linkedinUrl),
    twitterUrl: normalise(body.twitterUrl),
    instagramUrl: normalise(body.instagramUrl),
  };

  let settings;
  if (existing) {
    settings = await prisma.careerSiteSettings.update({
      where: { id: existing.id },
      data,
    });
  } else {
    settings = await prisma.careerSiteSettings.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  return NextResponse.json({ ok: true, settings });
}
