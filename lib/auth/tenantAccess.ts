import { getServerUser } from "@/lib/auth/getServerUser";
import { getHostContext } from "@/lib/host";
import { prisma } from "@/lib/prisma";

export async function getAllowedTenantIdsForRequest(): Promise<{
  allowedTenantIds: string[];
  isSuperAdmin: boolean;
  activeTenantId: string | null; // if tenant host forces one
}> {
  const ctx = await getServerUser();
  if (!ctx) return { allowedTenantIds: [], isSuperAdmin: false, activeTenantId: null };

  const { isPrimaryHost, tenantSlugFromHost } = await getHostContext();
  const isSuperAdmin = !!ctx.isSuperAdmin;

  // Super admin: allow all tenants (but still optionally lock to tenant host)
  if (isSuperAdmin) {
    if (!isPrimaryHost && tenantSlugFromHost) {
      const t = await prisma.tenant.findUnique({
        where: { slug: tenantSlugFromHost },
        select: { id: true },
      });
      const forced = t?.id ?? null;
      return { allowedTenantIds: forced ? [forced] : [], isSuperAdmin, activeTenantId: forced };
    }
    // all tenants
    const all = await prisma.tenant.findMany({ select: { id: true } });
    return { allowedTenantIds: all.map((t) => t.id), isSuperAdmin, activeTenantId: null };
  }

  // Normal user: tenants they belong to
  const roleTenantIds = ctx.tenantRoles.map((r) => r.tenantId);

  // On tenant host: force just that tenant (and ensure they belong)
  if (!isPrimaryHost && tenantSlugFromHost) {
    const t = await prisma.tenant.findUnique({
      where: { slug: tenantSlugFromHost },
      select: { id: true },
    });
    const forced = t?.id ?? null;

    if (!forced) return { allowedTenantIds: [], isSuperAdmin, activeTenantId: null };
    if (!roleTenantIds.includes(forced)) return { allowedTenantIds: [], isSuperAdmin, activeTenantId: forced };

    return { allowedTenantIds: [forced], isSuperAdmin, activeTenantId: forced };
  }

  // Primary host: allow all user tenants
  return { allowedTenantIds: roleTenantIds, isSuperAdmin, activeTenantId: null };
}
