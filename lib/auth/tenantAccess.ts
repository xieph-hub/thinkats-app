// lib/auth/tenantAccess.ts
import { getServerUser } from "@/lib/auth/getServerUser";
import { getHostContext } from "@/lib/host";
import { prisma } from "@/lib/prisma";

export type AtsTenantScope = {
  isSuperAdmin: boolean;
  allowedTenantIds: string[] | null; // null => unrestricted
  activeTenantId: string | null;
  activeTenantSlug: string | null;
};

export async function getAtsTenantScope(): Promise<AtsTenantScope> {
  const ctx = await getServerUser();

  // Not logged in
  if (!ctx?.user?.id) {
    return {
      isSuperAdmin: false,
      allowedTenantIds: [],
      activeTenantId: null,
      activeTenantSlug: null,
    };
  }

  const isSuperAdmin = !!ctx.isSuperAdmin;

  // Super admin: can access all tenants, but still needs an "active" tenant
  // for pages that require one.
  const tenantRoles = ctx.tenantRoles || [];
  const primaryRole = tenantRoles.find((r) => r.isPrimary) || tenantRoles[0] || null;

  const { isPrimaryHost, tenantSlugFromHost } = await getHostContext();

  // Determine activeTenant by host
  let activeTenantId: string | null = null;
  let activeTenantSlug: string | null = null;

  if (!isPrimaryHost && tenantSlugFromHost) {
    // Tenant host dictates the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlugFromHost },
      select: { id: true, slug: true },
    });

    activeTenantId = tenant?.id ?? null;
    activeTenantSlug = tenant?.slug ?? tenantSlugFromHost;
  } else {
    // Primary host: use user's primary tenant (or first)
    activeTenantId = primaryRole?.tenantId ?? null;
    activeTenantSlug = primaryRole?.tenantSlug ?? null;
  }

  // Allowed tenant ids
  const allowedTenantIds = isSuperAdmin
    ? null
    : tenantRoles.map((r) => r.tenantId).filter(Boolean);

  return {
    isSuperAdmin,
    allowedTenantIds,
    activeTenantId,
    activeTenantSlug,
  };
}

/**
 * Backwards compatible exports (you had callers using these names).
 */
export async function getAllowedTenantIdsForRequest() {
  const scope = await getAtsTenantScope();
  return {
    isSuperAdmin: scope.isSuperAdmin,
    allowedTenantIds: scope.allowedTenantIds,
  };
}
