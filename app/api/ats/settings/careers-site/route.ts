// app/api/ats/settings/careers-site/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

async function parseBody(req: NextRequest): Promise<Record<string, any>> {
  const contentType = req.headers.get("content-type") || "";

  // JSON body
  if (contentType.includes("application/json")) {
    return (await req.json()) as Record<string, any>;
  }

  // form-data (HTML form)
  const formData = await req.formData();
  const obj: Record<string, any> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      obj[key] = value;
    } else {
      // Keep File objects so we can upload them
      obj[key] = value;
    }
  }

  return obj;
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req);

    // --------------------------------------------------
    // Resolve tenantId (form field first, then host)
    // --------------------------------------------------
    let tenantId: string | null = null;

    if (typeof body.tenantId === "string" && body.tenantId.trim() !== "") {
      tenantId = body.tenantId.trim();
    } else {
      try {
        const hostContext = await getHostContext();
        const maybeTenant = (hostContext as any)?.tenant;
        if (maybeTenant?.id) tenantId = String(maybeTenant.id);
      } catch {
        // ignore – handled below
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

    // --------------------------------------------------
    // Optional banner image upload → Supabase Storage
    // --------------------------------------------------
    let newBannerImagePath: string | undefined;
    let newBannerImageUrl: string | undefined;

    const bannerFile = body.bannerImageFile as any | undefined;
    if (
      bannerFile &&
      typeof bannerFile === "object" &&
      typeof bannerFile.arrayBuffer === "function"
    ) {
      try {
        const arrayBuffer = await bannerFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const originalName: string =
          bannerFile.name || `banner-${Date.now()}.jpg`;
        const ext = originalName.includes(".")
          ? originalName.split(".").pop()!
          : "jpg";

        const objectPath = `tenants/${tenantId}/banner-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("careers-assets")
          .upload(objectPath, buffer, {
            contentType: bannerFile.type || "image/*",
            upsert: true,
          });

        if (uploadError) {
          console.error("Error uploading banner image:", uploadError);
        } else {
          newBannerImagePath = objectPath;
          const publicBase =
            process.env.NEXT_PUBLIC_CAREERS_ASSET_BASE_URL || "";
          if (publicBase) {
            newBannerImageUrl = `${publicBase.replace(
              /\/$/,
              "",
            )}/${objectPath}`;
          }
        }
      } catch (e) {
        console.error("Unexpected error uploading banner image:", e);
      }
    }

    // --------------------------------------------------
    // Build update payload
    // --------------------------------------------------
    const data: Record<string, any> = {
      logoUrl: nullIfEmpty(body.logoUrl),

      // Only update banner fields if we actually uploaded a new file
      bannerImageUrl: newBannerImageUrl,
      bannerImagePath: newBannerImagePath,

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

    // Strip undefined (but keep null to allow clearing values)
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    const existing = await prisma.careerSiteSettings.findFirst({
      where: { tenantId },
    });

    const settings = existing
      ? await prisma.careerSiteSettings.update({
          where: { id: existing.id },
          data: cleanedData,
        })
      : await prisma.careerSiteSettings.create({
          data: {
            tenantId,
            ...cleanedData,
          },
        });

    // --------------------------------------------------
    // Browser form? Redirect back to settings
    // --------------------------------------------------
    const accept = req.headers.get("accept") || "";
    const isBrowser = accept.includes("text/html");

    if (isBrowser) {
      const url = new URL(req.url);
      url.pathname = "/ats/settings/careers";
      url.searchParams.set("tenantId", tenantId);
      return NextResponse.redirect(url.toString(), { status: 303 });
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
  return NextResponse.json(
    { ok: false, error: "Use POST to update careers site settings." },
    { status: 405 },
  );
}
