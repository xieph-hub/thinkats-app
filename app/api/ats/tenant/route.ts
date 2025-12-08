// app/api/ats/tenant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/getServerUser";

// This route reads cookies via getServerUser() → must be dynamic
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const ctx = await getServerUser();

    // Guard against unauthenticated / missing user
    if (!ctx || !ctx.user || !ctx.user.email) {
      return NextResponse.json(
        { ok: false, error: "unauthenticated" },
        { status: 401 },
      );
    }

    const {
      user,
      isSuperAdmin,
      tenantRoles,
      primaryTenantId,
      primaryTenantSlug,
      primaryTenantPlanTier,
    } = ctx;

    // Pick a primary tenant summary (fallback to first role if needed)
    const primaryTenantSummary =
      tenantRoles.find((r) => r.tenantId === primaryTenantId) ||
      tenantRoles[0] ||
      null;

    return NextResponse.json({
      ok: true,
      isSuperAdmin,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        globalRole: user.globalRole,
      },
      // Keep "tenant" for existing callers, but now with real data
      tenant: primaryTenantSummary
        ? {
            id: primaryTenantSummary.tenantId,
            slug: primaryTenantSummary.tenantSlug,
            planTier: primaryTenantSummary.planTier,
            role: primaryTenantSummary.role,
            isPrimary: primaryTenantSummary.isPrimary,
          }
        : null,
      // Also expose all tenant memberships (for future UI)
      tenants: tenantRoles.map((r) => ({
        id: r.tenantId,
        slug: r.tenantSlug,
        role: r.role,
        isPrimary: r.isPrimary,
        planTier: r.planTier,
      })),
      primaryTenant: primaryTenantId
        ? {
            id: primaryTenantId,
            slug: primaryTenantSlug,
            planTier: primaryTenantPlanTier,
          }
        : null,
    });
  } catch (error) {
    console.error("/api/ats/tenant GET error", error);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
