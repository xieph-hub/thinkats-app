// app/api/ats/settings/careers-site/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Node runtime so Buffer works
export const runtime = "nodejs";

function nullIfEmpty(value: any): string | null | undefined {
  // undefined = don't touch this DB column
  if (value === undefined) return undefined;
  if (value === null) return null;
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

  if (contentType.includes("application/json")) {
    return (await req.json()) as Record<string, any>;
  }

  const formData = await req.formData();
  const obj: Record<string, any> = {};

  for (const [key, value] of formData.entries()) {
    obj[key] = value; // string or File
  }

  return obj;
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req);

    // -----------------------
    // Resolve tenantId
    // -----------------------
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

    // -----------------------
    // Base settings payload (no banner yet)
    // -----------------------
    const data: Record<string, any> = {
      logoUrl: nullIfEmpty(body.logoUrl),

      primaryColor: nullIfEmpty(body.primaryColor),
      accentColor: nullIfEmpty(body.accentColor),

      heroTitle: nullIfEmpty(body.heroTitle),
      heroSubtitle: nullIfEmpty(body.heroSubtitle),
      aboutHtml: nullIfEmpty(body.aboutHtml),

      linkedinUrl: nullIfEmpty(body.linkedinUrl),
      twitterUrl: nullIfEmpty(body.twitterUrl),
      instagramUrl: nullIfEmpty(body.instagramUrl),

      updatedAt: new Date(),
    };

    if (body.includeInMarketplace !== undefined) {
      data.includeInMarketplace = parseCheckbox(body.includeInMarketplace);
    }
    if (body.isPublic !== undefined) {
      data.isPublic = parseCheckbox(body.isPublic);
    }

    // -----------------------
    // Banner upload (optional)
    // -----------------------
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

        const bucket =
          process.env.NEXT_PUBLIC_CAREER_BANNERS_BUCKET || "career-banners";
        const objectPath = `tenants/${tenantId}/banner-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from(bucket)
          .upload(objectPath, buffer, {
            contentType: bannerFile.type || "image/*",
            upsert: true,
          });

        if (uploadError) {
          console.error("Error uploading banner image:", uploadError);
        } else {
          const { data: publicData } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(objectPath);

          if (publicData?.publicUrl) {
            data.bannerImageUrl = publicData.publicUrl;
            data.bannerImagePath = objectPath;
          }
        }
      } catch (e) {
        console.error("Unexpected error uploading banner image:", e);
      }
    }

    // Do NOT touch bannerImageUrl if no file uploaded
    // (data.bannerImageUrl will simply be undefined in that case)

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
