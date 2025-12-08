// lib/auth/getServerUser.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// 🔐 IMPORTANT: this must match whatever your /api/auth/login sets
const AUTH_COOKIE_NAME = "thinkats_user_id";

export type TenantRoleSummary = {
  tenantId: string;
  tenantSlug: string | null;
  role: string;
  isPrimary: boolean;
  planTier: string | null;
};

export type ServerUserContext = {
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
// Kept compatible with ServerUserContext.user, with an optional tenants field
export type AppUserWithTenants = ServerUserContext["user"] & {
  tenants?: TenantRoleSummary[];
};

export async function getServerUser(): Promise<ServerUserContext | null> {
  const cookieStore = cookies();

  // ✅ READ-ONLY cookies – allowed in server components
  const userId = cookieStore.get(AUTH_COOKIE_NAME)?.value;
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
    user: {
      id: dbUser.id,
      email: dbUser.email,
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
