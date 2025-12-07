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
 * - If there is *no* Supabase session (AuthSessionMissingError), we simply
 *   return everything as null instead of throwing/logging loudly.
 *
 * Safe to use from:
 * - Route handlers in app/api
 * - Server components (pages/layouts) in the app router
 */
export async function getServerUser(): Promise<ServerUserContext> {
  const supabase = createSupabaseRouteClient();

  let supabaseUser: any | null = null;
  let authError: any | null = null;

  // Wrap auth.getUser() so "Auth session missing" is treated as "logged out"
  try {
    const { data, error } = await supabase.auth.getUser();
    supabaseUser = data?.user ?? null;
    authError = error ?? null;
  } catch (err: any) {
    authError = err;
  }

  if (authError) {
    const name = authError?.name ?? "";
    const message = authError?.message ?? "";

    // Normal anonymous state: no Supabase session cookie.
    if (
      name === "AuthSessionMissingError" ||
      message.includes("Auth session missing")
    ) {
      return {
        supabaseUser: null,
        user: null,
        isSuperAdmin: false,
        primaryTenant: null,
        tenant: null,
      };
    }

    // Anything else is unexpected – log once and treat as logged-out.
    console.error(
      "Supabase auth.getUser unexpected error in getServerUser",
      authError,
    );

    return {
      supabaseUser: null,
      user: null,
      isSuperAdmin: false,
      primaryTenant: null,
      tenant: null,
    };
  }

  // No error, but also no user/email → logged out
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

  // Supabase user exists but no Prisma user row yet
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
    supabaseUser, // raw Supabase user
    user: appUser, // Prisma User
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
