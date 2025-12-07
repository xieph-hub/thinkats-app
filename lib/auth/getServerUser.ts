// lib/auth/getServerUser.ts
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export type ServerUserContext = {
  supabaseUser: any | null; // Supabase user (or null)
  user: any | null;         // Prisma User (or null)
  isSuperAdmin: boolean;
  primaryTenant: any | null;
  tenant: any | null;       // alias for primaryTenant
};

/**
 * Server-side helper to:
 * - Read the current Supabase auth user
 * - Map to our Prisma User row
 * - Resolve primary tenant + SUPER_ADMIN flag
 *
 * IMPORTANT:
 * - If there is *no* Supabase session (AuthSessionMissingError or similar),
 *   we *silently* treat it as "logged out" and DO NOT log anything.
 */
export async function getServerUser(): Promise<ServerUserContext> {
  const supabase = createSupabaseRouteClient();

  let supabaseUser: any | null = null;

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user || !data.user.email) {
      // Logged out / no session – totally normal, no logging
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
    // Any error from auth.getUser is treated as "no session"
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

  if (!appUser) {
    // Supabase user exists but no Prisma user row yet
    return {
      supabaseUser,
      user: null,
      isSuperAdmin: false,
      primaryTenant: null,
      tenant: null,
    };
  }

  const isSuperAdmin = appUser.globalRole === "SUPER_ADMIN";

  const primaryRole =
    appUser.userTenantRoles.find((r) => r.isPrimary) ??
    appUser.userTenantRoles[0];

  const primaryTenant = primaryRole?.tenant ?? null;

  return {
    supabaseUser,  // raw Supabase user
    user: appUser, // Prisma User row
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
