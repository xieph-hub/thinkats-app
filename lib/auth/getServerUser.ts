// lib/auth/getServerUser.ts
import { prisma } from "@/lib/prisma";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

/**
 * Server-side helper to:
 * - Read the current Supabase auth user
 * - Map to our Prisma User row
 * - Resolve primary tenant + SUPER_ADMIN flag
 *
 * Safe to use from:
 * - Route handlers in app/api
 * - Server components (pages/layouts) in the app router
 */
export async function getServerUser() {
  const supabase = createSupabaseRouteClient();

  const {
    data: { user: supabaseUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !supabaseUser || !supabaseUser.email) {
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
    supabaseUser,    // raw Supabase user
    user: appUser,   // Prisma User
    isSuperAdmin,    // boolean
    primaryTenant,   // Tenant | null
    tenant: primaryTenant, // alias, in case we destructure as { tenant }
  };
}

/**
 * Convenience helper if you want to *require* auth in some endpoints.
 * Throws if there is no logged-in user.
 */
export async function requireServerUser() {
  const ctx = await getServerUser();
  if (!ctx.user) {
    throw new Error("UNAUTHENTICATED");
  }
  return ctx;
}
