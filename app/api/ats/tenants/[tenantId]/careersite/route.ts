// app/api/ats/tenants/[tenantId]/careersite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toNullableString(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  const s = value.toString().trim();
  return s.length ? s : null;
}

function normalizeColorHex(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  let s = value.toString().trim();
  if (!s) return null;

  // Allow user to type "172965" or "#172965"
  if (!s.startsWith("#")) {
    s = `#${s}`;
  }

  // Very loose validation: #RGB, #RRGGBB, #RRGGBBAA, etc.
  if (!/^#[0-9a-fA-F]{3,8}$/.test(s)) {
    return null;
  }

  return s.toLowerCase();
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  const tenantId = params.tenantId;

  try {
    // Ensure tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });

    if (!tenant) {
      const url = new URL(`/ats/tenants/${tenantId}/careersite`, req.url);
      url.searchParams.set("error", "tenant_not_found");
      return NextResponse.redirect(url, 303);
    }

    const formData = await req.formData();

    const heroTitle = toNullableString(formData.get("heroTitle"));
    const heroSubtitle = toNullableString(formData.get("heroSubtitle"));
    const aboutHtml = toNullableString(formData.get("aboutHtml"));

    const primaryColorHex = normalizeColorHex(
      formData.get("primaryColorHex"),
    );
    const accentColorHex = normalizeColorHex(
      formData.get("accentColorHex"),
    );
    const heroBackgroundHex = normalizeColorHex(
      formData.get("heroBackgroundHex"),
    );

    // Optional logo override (if you ever add a text field for this)
    const logoUrl = toNullableString(formData.get("logoUrl"));

    const isPublic = formData.get("isPublic") === "on";
    const includeInMarketplace =
      formData.get("includeInMarketplace") === "on";

    const existing = await prisma.careerSiteSettings.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });

    const data: any = {
      isPublic,
      includeInMarketplace,
      updatedAt: new Date(),
    };

    if (heroTitle !== null) data.heroTitle = heroTitle;
    if (heroSubtitle !== null) data.heroSubtitle = heroSubtitle;
    if (aboutHtml !== null) data.aboutHtml = aboutHtml;

    if (primaryColorHex !== null) data.primaryColorHex = primaryColorHex;
    if (accentColorHex !== null) data.accentColorHex = accentColorHex;
    if (heroBackgroundHex !== null)
      data.heroBackgroundHex = heroBackgroundHex;

    if (logoUrl !== null) data.logoUrl = logoUrl;

    if (existing) {
      await prisma.careerSiteSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.careerSiteSettings.create({
        data: {
          tenantId,
          ...data,
        },
      });
    }

    const url = new URL(`/ats/tenants/${tenantId}/careersite`, req.url);
    url.searchParams.set("updated", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    console.error(
      "POST /api/ats/tenants/[tenantId]/careersite error",
      error,
    );
    const url = new URL(`/ats/tenants/${tenantId}/careersite`, req.url);
    url.searchParams.set("error", "save_failed");
    return NextResponse.redirect(url, 303);
  }
}
