// lib/auth/getServerUser.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// 🔐 Shared cookie name for auth ONLY
export const AUTH_COOKIE_NAME = "thinkats_user_id";

export type TenantRoleSummary = {
  tenantId: string;
  tenantSlug: string | null;
  role: string;
  isPrimary: boolean;
  planTier: string | null;
};

export type ServerUserContext = {
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

  if (!dbUser || !dbUser.isActive) return null;

  const email = normalizeEmail(dbUser.email);

  const tenantRoles: TenantRoleSummary[] = dbUser.userTenantRoles.map((utr) => ({
    tenantId: utr.tenantId,
    tenantSlug: utr.tenant.slug,
    role: utr.role,
    isPrimary: utr.isPrimary,
    planTier: utr.tenant.planTier,
  }));

  const primary = tenantRoles.find((r) => r.isPrimary) || tenantRoles[0] || null;
  const isSuperAdmin = dbUser.globalRole === "SUPER_ADMIN";

  return {
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
