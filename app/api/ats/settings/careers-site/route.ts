// app/api/ats/settings/careers-site/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";

function nullIfEmpty(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return String(value);
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseCheckbox(value: unknown): boolean {
  if (typeof value === "string") {
    const v = value.toLowerCase();
    return v === "on" || v === "true" || v === "1" || v === "yes";
  }
  return Boolean(value);
}

async function parseBody(req: NextRequest): Promise<Record<string, unknown>> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const json = (await req.json()) as Record<string, unknown>;
    return json ?? {};
  }

  const formData = await req.formData();
  const obj: Record<string, unknown> = {};

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

    // 1) Prefer explicit tenantId from form / JSON
    let tenantId: string | null = null;

    const rawTenant = body.tenantId;
    if (typeof rawTenant === "string" && rawTenant.trim() !== "") {
      tenantId = rawTenant.trim();
    } else {
      // 2) Fallback: resolve from host for subdomain/custom domains
      try {
        const hostContext = await getHostContext();
        const maybeTenant = (hostContext as any)?.tenant;
        if (maybeTenant?.id) {
          tenantId = String(maybeTenant.id);
        }
      } catch {
        // ignore, fallback handled below
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

      includeInMarketplace: parseCheckbox(body.includeInMarketplace),
      isPublic: parseCheckbox(body.isPublic),

      updatedAt: new Date(),
    };

    const existing = await prisma.careerSiteSettings.findFirst({
      where: { tenantId },
    });

    const settings = existing
      ? await prisma.careerSiteSettings.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.careerSiteSettings.create({
          data: {
            tenantId,
            ...data,
          },
        });

    // If called from a browser form, redirect back to settings instead of
    // leaving the user on a JSON response.
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
