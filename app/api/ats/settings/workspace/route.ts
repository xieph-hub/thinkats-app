// app/api/ats/settings/workspace/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

function normaliseSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const tenant = await getResourcinTenant();

  if (!tenant) {
    const url = new URL(
      "/ats/settings/workspace?error=No+default+tenant",
      request.url,
    );
    return NextResponse.redirect(url);
  }

  const formData = await request.formData();

  const rawName = (formData.get("name") as string | null) ?? "";
  const rawSlug = (formData.get("slug") as string | null) ?? "";
  const rawPrimaryContactEmail =
    (formData.get("primaryContactEmail") as string | null) ?? "";
  const rawInternalNotes =
    (formData.get("internalNotes") as string | null) ?? "";

  const rawWorkspaceLogoUrl =
    (formData.get("workspaceLogoUrl") as string | null) ?? "";
  const rawCareersiteLogoUrl =
    (formData.get("careersiteLogoUrl") as string | null) ?? "";

  const rawHeroTitle =
    (formData.get("heroTitle") as string | null) ?? "";
  const rawHeroSubtitle =
    (formData.get("heroSubtitle") as string | null) ?? "";
  const rawPrimaryColor =
    (formData.get("primaryColor") as string | null) ?? "";
  const rawAccentColor =
    (formData.get("accentColor") as string | null) ?? "";
  const rawIsPublic = formData.get("isPublic");

  const name = rawName.trim();
  const slugInput = rawSlug.trim();
  const primaryContactEmail = rawPrimaryContactEmail.trim() || null;
  const internalNotes = rawInternalNotes.trim() || null;

  const workspaceLogoUrl = rawWorkspaceLogoUrl.trim() || null;
  const careersiteLogoUrl =
    rawCareersiteLogoUrl.trim() || workspaceLogoUrl || null;

  const heroTitle = rawHeroTitle.trim() || null;
  const heroSubtitle = rawHeroSubtitle.trim() || null;
  const primaryColor = rawPrimaryColor.trim() || null;
  const accentColor = rawAccentColor.trim() || null;
  const isPublic = rawIsPublic === "on";

  if (!name) {
    const url = new URL(
      "/ats/settings/workspace?error=Workspace+name+is+required",
      request.url,
    );
    return NextResponse.redirect(url);
  }

  const slug = slugInput ? normaliseSlug(slugInput) : tenant.slug;

  try {
    await prisma.$transaction(async (tx) => {
      // Update tenant basics
      await tx.tenant.update({
        where: { id: tenant.id },
        data: {
          name,
          slug,
          primaryContactEmail,
          internalNotes,
          logoUrl: workspaceLogoUrl,
        },
      });

      // Upsert careersite settings for this tenant
      const existing = await tx.careerSiteSettings.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "asc" },
      });

      const data = {
        tenantId: tenant.id,
        logoUrl: careersiteLogoUrl,
        primaryColor,
        accentColor,
        heroTitle,
        heroSubtitle,
        isPublic,
      };

      if (existing) {
        await tx.careerSiteSettings.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await tx.careerSiteSettings.create({ data });
      }
    });
  } catch (err) {
    console.error("Error updating workspace:", err);
    const url = new URL(
      "/ats/settings/workspace?error=Failed+to+save+workspace",
      request.url,
    );
    return NextResponse.redirect(url);
  }

  const redirectUrl = new URL(
    "/ats/settings/workspace?updated=1",
    request.url,
  );
  return NextResponse.redirect(redirectUrl);
}
