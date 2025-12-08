// app/api/ats/settings/billing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant, requireTenantMembership } from "@/lib/tenant";
import { getServerUser } from "@/lib/auth/getServerUser";

const ALLOWED_PLAN_TIERS = ["STARTER", "GROWTH", "AGENCY", "ENTERPRISE"];

export async function POST(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getServerUser();
    const tenant = await getResourcinTenant();

    if (!tenant) {
      return NextResponse.redirect(
        new URL("/ats/settings?error=tenant_not_configured", req.url),
      );
    }

    const formData = await req.formData();
    const planTierRaw = (formData.get("planTier") as string | null) || "";
    const planTier = planTierRaw.trim().toUpperCase();

    const seatsRaw = (formData.get("seats") as string | null) || "";
    const maxSeatsRaw = (formData.get("maxSeats") as string | null) || "";

    const tenantIdOverride = (formData.get("tenantId") as string | null) || "";

    if (!ALLOWED_PLAN_TIERS.includes(planTier)) {
      return NextResponse.redirect(
        new URL("/ats/settings?error=invalid_plan_tier", req.url),
      );
    }

    const seats =
      seatsRaw === "" ? null : Number.isNaN(Number(seatsRaw)) ? null : Number(seatsRaw);
    const maxSeats =
      maxSeatsRaw === ""
        ? null
        : Number.isNaN(Number(maxSeatsRaw))
        ? null
        : Number(maxSeatsRaw);

    if (seats !== null && seats < 0) {
      return NextResponse.redirect(
        new URL("/ats/settings?error=invalid_seats_value", req.url),
      );
    }
    if (maxSeats !== null && maxSeats < 0) {
      return NextResponse.redirect(
        new URL("/ats/settings?error=invalid_max_seats_value", req.url),
      );
    }

    // Decide which tenant to update:
    // - Super admin can override any tenantId.
    // - Normal admins can only update their own tenant.
    const targetTenantId = isSuperAdmin && tenantIdOverride
      ? tenantIdOverride
      : tenant.id;

    if (!isSuperAdmin) {
      await requireTenantMembership(targetTenantId, {
        allowedRoles: ["OWNER", "ADMIN"],
      });
    }

    await prisma.tenant.update({
      where: { id: targetTenantId },
      data: {
        planTier: planTier as any,
        seats,
        maxSeats,
      },
    });

    return NextResponse.redirect(
      new URL("/ats/settings?updated=billing", req.url),
    );
  } catch (err) {
    console.error("Error updating billing settings:", err);
    return NextResponse.redirect(
      new URL("/ats/settings?error=billing_update_failed", req.url),
    );
  }
}
