// lib/auth/getServerUser.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// 🔐 Shared cookie names for auth + OTP
export const AUTH_COOKIE_NAME = "thinkats_user_id";
export const OTP_COOKIE_NAME = "thinkats_otp_verified";

export type TenantRoleSummary = {
  tenantId: string;
  tenantSlug: string | null;
  role: string;
  isPrimary: boolean;
  planTier: string | null;
};

export type ServerUserContext = {
  /**
   * Canonical login identity (top-level) so callers can safely do:
   *   const authUser = await getServerUser();
   *   if (!authUser?.email) redirect("/login");
   */
  email: string | null;

  user: {
    id: string;
    email: string | null;
    fullName: string | null;
    globalRole: string;
  };

  isSuperAdmin: boolean;
  tenantRoles: TenantRoleSummary[];
  primaryTenantId: string | null;
  primaryTenantSlug: string | null;
  primaryTenantPlanTier: string | null;
};

// ✨ Shape used by ATS UI (e.g. AtsLayoutClient)
export type AppUserWithTenants = ServerUserContext["user"] & {
  tenants?: TenantRoleSummary[];
};

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

export async function getServerUser(): Promise<ServerUserContext | null> {
  const cookieStore = cookies();

  // ✅ READ-ONLY cookies – allowed in server components
  const userId = cookieStore.get(AUTH_COOKIE_NAME)?.value?.trim();
  if (!userId) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userTenantRoles: {
        include: {
          tenant: true,
        },
      },
    },
  });

  if (!dbUser || !dbUser.isActive) {
    return null;
  }

  const email = normalizeEmail(dbUser.email);

  const tenantRoles: TenantRoleSummary[] = dbUser.userTenantRoles.map(
    (utr) => ({
      tenantId: utr.tenantId,
      tenantSlug: utr.tenant.slug,
      role: utr.role,
      isPrimary: utr.isPrimary,
      planTier: utr.tenant.planTier,
    }),
  );

  const primary =
    tenantRoles.find((r) => r.isPrimary) || tenantRoles[0] || null;

  const isSuperAdmin = dbUser.globalRole === "SUPER_ADMIN";

  return {
    // ✅ NEW: top-level alias used by requireAtsContext.ts
    email,

    user: {
      id: dbUser.id,
      email,
      fullName: dbUser.fullName,
      globalRole: dbUser.globalRole,
    },

    isSuperAdmin,
    tenantRoles,
    primaryTenantId: primary?.tenantId ?? null,
    primaryTenantSlug: primary?.tenantSlug ?? null,
    primaryTenantPlanTier: primary?.planTier ?? null,
  };
}
