// app/api/ats/settings/defaults/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant, requireTenantMembership } from "@/lib/tenant";
import { getServerUser } from "@/lib/auth/getServerUser";

export async function POST(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getServerUser();
    const tenant = await getResourcinTenant();

    if (!tenant) {
      return NextResponse.redirect(
        new URL("/ats/settings?error=tenant_not_configured", req.url),
      );
    }

    if (!isSuperAdmin) {
      await requireTenantMembership(tenant.id, {
        allowedRoles: ["OWNER", "ADMIN"],
      });
    }

    const formData = await req.formData();
    const timezone = (formData.get("timezone") as string | null)?.trim();
    const currency = (formData.get("currency") as string | null)
      ?.trim()
      .toUpperCase();

    const safeTimezone = timezone || null;
    const safeCurrency = currency || null;

    // Very light validation – you can tighten this later if you like
    if (safeCurrency && safeCurrency.length !== 3) {
      return NextResponse.redirect(
        new URL("/ats/settings?error=invalid_currency", req.url),
      );
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        defaultTimezone: safeTimezone,
        defaultCurrency: safeCurrency,
      },
    });

    return NextResponse.redirect(
      new URL("/ats/settings?updated=defaults", req.url),
    );
  } catch (err) {
    console.error("Error updating workspace defaults:", err);
    return NextResponse.redirect(
      new URL("/ats/settings?error=defaults_update_failed", req.url),
    );
  }
}
