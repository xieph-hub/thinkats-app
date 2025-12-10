// app/api/ats/settings/careers-site/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";

function nullIfEmpty(value: any): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return String(value);
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseCheckbox(value: any): boolean {
  if (typeof value === "string") {
    const v = value.toLowerCase();
    return v === "on" || v === "true" || v === "1";
  }
  return Boolean(value);
}

// Accept both JSON and form-data bodies so we're future-proof
async function parseBody(req: NextRequest): Promise<Record<string, any>> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await req.json()) as Record<string, any>;
  }

  const formData = await req.formData();
  const obj: Record<string, any> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      obj[key] = value;
    } else {
      // File objects, etc. — for now, just keep their filename
      obj[key] = (value as File).name;
    }
  }

  return obj;
}

export async function POST(req: NextRequest) {
  try {
    // Resolve current tenant from host / session
    const hostContext = await getHostContext();
    const { tenant } = hostContext as any;

    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant resolved for this request." },
        { status: 400 },
      );
    }

    const body = await parseBody(req);

    const data = {
      logoUrl: nullIfEmpty(body.logoUrl),

      bannerImageUrl: nullIfEmpty(body.bannerImageUrl),
      bannerImagePath: nullIfEmpty(body.bannerImagePath),
      bannerImageAlt: nullIfEmpty(body.bannerImageAlt),

      primaryColorHex: nullIfEmpty(body.primaryColorHex),
      accentColorHex: nullIfEmpty(body.accentColorHex),
      heroBackgroundHex: nullIfEmpty(body.heroBackgroundHex),

      primaryColor: nullIfEmpty(body.primaryColor),
      accentColor: nullIfEmpty(body.accentColor),

      heroTitle: nullIfEmpty(body.heroTitle),
      heroSubtitle: nullIfEmpty(body.heroSubtitle),
      aboutHtml: nullIfEmpty(body.aboutHtml),

      linkedinUrl: nullIfEmpty(body.linkedinUrl),
      twitterUrl: nullIfEmpty(body.twitterUrl),
      instagramUrl: nullIfEmpty(body.instagramUrl),

      includeInMarketplace:
        body.includeInMarketplace !== undefined
          ? parseCheckbox(body.includeInMarketplace)
          : undefined,
      isPublic:
        body.isPublic !== undefined ? parseCheckbox(body.isPublic) : undefined,

      updatedAt: new Date(),
    };

    // Strip out undefined keys so we don't accidentally overwrite with "undefined"
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    // Find existing settings row (we didn't mark tenantId as @unique in Prisma)
    const existing = await prisma.careerSiteSettings.findFirst({
      where: { tenantId: tenant.id },
    });

    let settings;
    if (existing) {
      settings = await prisma.careerSiteSettings.update({
        where: { id: existing.id },
        data: cleanedData,
      });
    } else {
      settings = await prisma.careerSiteSettings.create({
        data: {
          tenantId: tenant.id,
          ...cleanedData,
        },
      });
    }

    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error("Error updating careers site settings:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update careers site settings." },
      { status: 500 },
    );
  }
}

// Optional: explicitly block GET so hitting this URL in the browser
// returns a clear message instead of a 404.
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Use POST to update careers site settings." },
    { status: 405 },
  );
}
