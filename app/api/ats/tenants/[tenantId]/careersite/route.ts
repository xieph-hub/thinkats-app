// app/api/ats/tenants/[tenantId]/careersite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";
import { isOfficialUser } from "@/lib/officialEmail";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    tenantId: string;
  };
};

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { tenantId } = params;

    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "missing_tenant_id" },
        { status: 400 },
      );
    }

    // 🔐 Ensure caller is an authenticated Supabase user
    const supabase = createSupabaseRouteClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    // 🔐 Optional: restrict to official / whitelisted emails
    if (!isOfficialUser(user)) {
      return NextResponse.json(
        { ok: false, error: "forbidden_non_official_user" },
        { status: 403 },
      );
    }

    const form = await req.formData();

    const heroTitle = (form.get("heroTitle") || "") as string;
    const heroSubtitle = (form.get("heroSubtitle") || "") as string;
    const primaryColor = (form.get("primaryColor") || "") as string;
    const accentColor = (form.get("accentColor") || "") as string;
    const aboutHtml = (form.get("aboutHtml") || "") as string;
    const isPublic = form.get("isPublic") === "on";

    // Very light validation
    if (!heroTitle.trim()) {
      return NextResponse.json(
        { ok: false, error: "missing_hero_title" },
        { status: 400 },
      );
    }

    // Ensure tenant exists (defensive)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "tenant_not_found" },
        { status: 404 },
      );
    }

    // Either update an existing settings row or create a new one
    const existing = await prisma.careerSiteSettings.findFirst({
      where: { tenantId },
    });

    const data = {
      tenantId,
      heroTitle: heroTitle.trim(),
      heroSubtitle: heroSubtitle.trim() || null,
      primaryColor: primaryColor.trim() || null,
      accentColor: accentColor.trim() || null,
      aboutHtml: aboutHtml.trim() || null,
      isPublic,
    };

    if (existing) {
      await prisma.careerSiteSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.careerSiteSettings.create({ data });
    }

    // Redirect back to the ATS UI page with a success flag
    const redirectUrl = new URL(
      `/ats/tenants/${tenantId}/careersite?saved=1`,
      req.nextUrl.origin,
    );

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[ThinkATS CareerSite] POST error:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
