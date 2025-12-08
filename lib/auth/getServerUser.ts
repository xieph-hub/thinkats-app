// lib/auth/getServerUser.ts
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type {
  User as PrismaUser,
  Tenant,
  UserTenantRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export type AppUserWithTenants = PrismaUser & {
  userTenantRoles: (UserTenantRole & { tenant: Tenant | null })[];
};

export type ServerUserContext = {
  supabaseUser: SupabaseUser | null;
  user: AppUserWithTenants | null;
  isSuperAdmin: boolean;
  primaryTenant: Tenant | null;
  tenant: Tenant | null;
};

/**
 * Utility to normalise a comma-separated list of emails or domains
 * from environment variables.
 */
function parseEnvList(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function getServerUser(): Promise<ServerUserContext> {
  const supabase = createSupabaseRouteClient();

  const {
    data,
    error,
  } = await supabase.auth.getUser();

  const supabaseUser = error ? null : data.user;

  // If there is no Supabase user or no email, treat as logged out.
  if (!supabaseUser || !supabaseUser.email) {
    return {
      supabaseUser: null,
      user: null,
      isSuperAdmin: false,
      primaryTenant: null,
      tenant: null,
    };
  }

  const email = supabaseUser.email.toLowerCase();

  // Fetch Prisma User with tenant roles
  const appUser = await prisma.user.findUnique({
    where: { email },
    include: {
      userTenantRoles: {
        include: {
          tenant: true,
        },
      },
    },
  });

  // If no app-level user yet, we still return the Supabase user
  if (!appUser) {
    return {
      supabaseUser,
      user: null,
      isSuperAdmin: false,
      primaryTenant: null,
      tenant: null,
    };
  }

  // Gather env-based super admin / override emails
  const envSupers = [
    ...parseEnvList(process.env.THINKATS_SUPER_ADMINS),
    ...parseEnvList(process.env.THINKATS_ENTERPRISE_ADMINS),
    ...parseEnvList(process.env.THINKATS_OVERRIDE_EMAILS),
  ];

  const emailIsEnvSuper = envSupers.includes(email);
  const isSuperAdmin =
    emailIsEnvSuper || appUser.globalRole === "SUPER_ADMIN";

  // Resolve primary tenant
  const primaryRole =
    appUser.userTenantRoles.find((r) => r.isPrimary) ??
    appUser.userTenantRoles[0];

  const primaryTenant = primaryRole?.tenant ?? null;

  return {
    supabaseUser,
    user: appUser as AppUserWithTenants,
    isSuperAdmin,
    primaryTenant,
    tenant: primaryTenant,
  };
}
