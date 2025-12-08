// app/api/ats/tenant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";
import { getHostContext } from "@/lib/host";

export async function GET(_req: NextRequest) {
  try {
    const { supabaseUser, user, isSuperAdmin, primaryTenant } =
      await getServerUser();

    if (!supabaseUser || !supabaseUser.email) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const { isPrimaryHost, tenantSlugFromHost } = getHostContext();

    let tenant = primaryTenant;

    // If we’re on a tenant subdomain, prefer that tenant
    if (!isPrimaryHost && tenantSlugFromHost) {
      tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlugFromHost },
      });

      if (!tenant) {
        return NextResponse.json(
          { ok: false, error: "tenant_not_found" },
          { status: 404 },
        );
      }
    }

    // Shape this so it’s safe for client consumption
    const safeUser = user
      ? {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          globalRole: user.globalRole,
        }
      : null;

    return NextResponse.json({
      ok: true,
      isSuperAdmin,
      tenant,
      user: safeUser,
    });
  } catch (err) {
    console.error("/api/ats/tenant error:", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
