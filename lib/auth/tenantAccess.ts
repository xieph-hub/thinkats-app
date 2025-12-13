// lib/auth/tenantAccess.ts
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";
import { getHostContext } from "@/lib/host";

/**
 * Canonical tenant selection rules (until you build a tenant switcher):
 * - If on tenant host (slug.thinkats.com): force that tenant
 * - Else (primary host thinkats.com): use user's primary tenant
 * - Super admin: can see everything on primary host, but on tenant host still forced
 */
export async function getAtsTenantScope() {
  const ctx = await getServerUser();
  if (!ctx?.user?.id) redirect("/login?returnTo=/ats");

  const { isPrimaryHost, tenantSlugFromHost } = await getHostContext();

  const isSuperAdmin = !!ctx.isSuperAdmin;
  const tenantRoles = ctx.tenantRoles || [];

  // Tenant host: force tenant from host (unless missing / unknown => deny)
  if (!isPrimaryHost && tenantSlugFromHost) {
    const match = tenantRoles.find((r) => r.tenantSlug === tenantSlugFromHost);

    if (!match && !isSuperAdmin) {
      redirect("/access-denied?reason=tenant_mismatch");
    }

    // On tenant host, even super admin should be scoped to that tenant UI context
    const forcedTenantId = match?.tenantId ?? null;
    return {
      isSuperAdmin,
      activeTenantId: forcedTenantId,
      allowedTenantIds: forcedTenantId ? [forcedTenantId] : [],
    };
  }

  // Primary host:
  if (isSuperAdmin) {
    // super admin can see cross-tenant in admin views if desired
    const allTenantIds = Array.from(new Set(tenantRoles.map((r) => r.tenantId)));
    return {
      isSuperAdmin,
      activeTenantId: ctx.primaryTenantId ?? (allTenantIds[0] ?? null),
      allowedTenantIds: allTenantIds,
    };
  }

  // Normal user on primary host: keep it simple — primary tenant only
  const activeTenantId = ctx.primaryTenantId ?? (tenantRoles[0]?.tenantId ?? null);

  return {
    isSuperAdmin,
    activeTenantId,
    allowedTenantIds: activeTenantId ? [activeTenantId] : [],
  };
}
