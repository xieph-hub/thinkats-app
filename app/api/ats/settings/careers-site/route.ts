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

// Accept both JSON and form-data bodies
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
      obj[key] = (value as File).name;
    }
  }

  return obj;
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req);

    // 1) Prefer explicit tenantId from the form / JSON
    let tenantId: string | null = null;

    if (typeof body.tenantId === "string" && body.tenantId.trim() !== "") {
      tenantId = body.tenantId.trim();
    } else {
      // 2) Fallback: try to resolve from host (for subdomain / custom-domain flows)
      try {
        const hostContext = await getHostContext();
        const maybeTenant = (hostContext as any)?.tenant;
        if (maybeTenant?.id) {
          tenantId = String(maybeTenant.id);
        }
      } catch {
        // swallow host resolution errors; we'll handle missing tenantId below
      }
    }

    if (!tenantId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No tenantId provided and none resolved from host. Make sure the form sends tenantId.",
        },
        { status: 400 },
      );
    }

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

    // Strip out undefined so we don't overwrite with undefined
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    const existing = await prisma.careerSiteSettings.findFirst({
      where: { tenantId },
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
          tenantId,
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

export async function GET() {
  // So hitting /api/ats/settings/careers-site in the browser gives a clear message
  return NextResponse.json(
    { ok: false, error: "Use POST to update careers site settings." },
    { status: 405 },
  );
}
