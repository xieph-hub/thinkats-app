// app/api/ats/tenant/select/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const tenant = await getResourcinTenant();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "No tenant configured" },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const tenantIdRaw = formData.get("tenantId");
    const redirectToRaw = formData.get("redirectTo");

    const tenantId =
      typeof tenantIdRaw === "string" ? tenantIdRaw.trim() : "";
    const redirectTo =
      typeof redirectToRaw === "string" && redirectToRaw.trim()
        ? redirectToRaw.trim()
        : "/ats/dashboard";

    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "Missing tenantId" },
        { status: 400 },
      );
    }

    // Verify tenant exists
    const target = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json(
        { ok: false, error: "Tenant not found" },
        { status: 404 },
      );
    }

    const res = NextResponse.redirect(new URL(redirectTo, req.url), 303);

    // Cookie used by all /ats pages to scope tenant data
    res.cookies.set("ats_tenant_id", tenantId, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  } catch (err) {
    console.error("Select tenant error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error selecting tenant" },
      { status: 500 },
    );
  }
}
