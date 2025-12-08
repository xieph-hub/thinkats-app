// lib/auth/getServerUser.ts
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export type ServerUserContext = {
  supabaseUser: any | null; // Supabase user (or null)
  user: any | null; // Prisma User (or null)
  isSuperAdmin: boolean;
  primaryTenant: any | null;
  tenant: any | null; // alias for primaryTenant
};

function parseEmailList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,\s]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Server-side helper to:
 * - Read the current Supabase auth user
 * - Map to our Prisma User row
 * - Resolve primary tenant + SUPER_ADMIN flag
 *
 * IMPORTANT:
 * - If there is *no* Supabase session, we treat it as "logged out"
 *   and do NOT log errors.
 */
export async function getServerUser(): Promise<ServerUserContext> {
  const supabase = createSupabaseRouteClient();

  let supabaseUser: any | null = null;

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user || !data.user.email) {
      // Logged out / no session – totally normal
      return {
        supabaseUser: null,
        user: null,
        isSuperAdmin: false,
        primaryTenant: null,
        tenant: null,
      };
    }

    supabaseUser = data.user;
  } catch {
    // Any unexpected auth error is treated as "no session"
    return {
      supabaseUser: null,
      user: null,
      isSuperAdmin: false,
      primaryTenant: null,
      tenant: null,
    };
  }

  const email = supabaseUser.email.toLowerCase();

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

  // Super admin via Prisma role OR env-based override lists
  const envSupers = [
    ...parseEmailList(process.env.THINKATS_SUPER_ADMINS),
    ...parseEmailList(process.env.THINKATS_ENTERPRISE_ADMINS),
    ...parseEmailList(process.env.THINKATS_OVERRIDE_EMAILS),
  ];

  const emailIsEnvSuper = envSupers.includes(email);
  const isSuperAdmin =
    emailIsEnvSuper || appUser?.globalRole === "SUPER_ADMIN";

  // Compute primary tenant (if any)
  let primaryTenant: any | null = null;

  if (appUser?.userTenantRoles && appUser.userTenantRoles.length > 0) {
    const primaryRole =
      appUser.userTenantRoles.find((r: any) => r.isPrimary) ??
      appUser.userTenantRoles[0];

    primaryTenant = primaryRole?.tenant ?? null;
  }

  return {
    supabaseUser,
    user: appUser ?? null,
    isSuperAdmin,
    primaryTenant,
    tenant: primaryTenant,
  };
}

/**
 * Convenience helper if you want to *require* a Prisma User row.
 * Throws if there is no logged-in app user.
 */
export async function requireServerUser() {
  const ctx = await getServerUser();
  if (!ctx.user) {
    throw new Error("UNAUTHENTICATED");
  }
  return ctx;
}
