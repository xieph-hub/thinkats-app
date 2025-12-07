// app/ats/tenants/[tenantId]/careersite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  const s = value.toString().trim();
  return s.length ? s : null;
}

function normaliseHex(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  let s = value.toString().trim();
  if (!s) return null;

  // Ensure it starts with '#'
  if (!s.startsWith("#")) {
    s = `#${s}`;
  }

  // Accept #RGB or #RRGGBB
  const hexPattern = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  if (!hexPattern.test(s)) {
    return null;
  }

  return s.toLowerCase();
}

export async function POST(
  req: NextRequest,
  context: { params: { tenantId: string } },
) {
  const { tenantId } = context.params;

  try {
    const formData = await req.formData();

    const heroTitle = toNullableString(formData.get("heroTitle"));
    const heroSubtitle = toNullableString(formData.get("heroSubtitle"));
    const aboutHtml = toNullableString(formData.get("aboutHtml"));

    const primaryColorHex = normaliseHex(formData.get("primaryColorHex"));
    const accentColorHex = normaliseHex(formData.get("accentColorHex"));
    const heroBackgroundHex = normaliseHex(formData.get("heroBackgroundHex"));

    const logoUrl = toNullableString(formData.get("logoUrl"));

    const isPublic = formData.get("isPublic") === "on";
    const includeInMarketplace =
      formData.get("includeInMarketplace") === "on";

    const existing = await prisma.careerSiteSettings.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });

    const data: any = {
      tenantId,
      heroTitle,
      heroSubtitle,
      aboutHtml,
      isPublic,
      includeInMarketplace,
      primaryColorHex,
      accentColorHex,
      heroBackgroundHex,
      logoUrl,
      updatedAt: new Date(),
    };

    if (existing) {
      await prisma.careerSiteSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.careerSiteSettings.create({
        data: {
          ...data,
          createdAt: new Date(),
        },
      });
    }

    const url = new URL(
      `/ats/tenants/${tenantId}/careersite`,
      req.url,
    );
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error("Failed to update career site settings", err);
    const url = new URL(
      `/ats/tenants/${tenantId}/careersite`,
      req.url,
    );
    url.searchParams.set("error", "update_failed");
    return NextResponse.redirect(url, 303);
  }
}
