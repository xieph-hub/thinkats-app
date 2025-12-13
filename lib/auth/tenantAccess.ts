// lib/auth/tenantAccess.ts
import { getServerUser } from "@/lib/auth/getServerUser";

/**
 * Canonical tenant scope for the current server request.
 * - Super admin: all tenants (returns null meaning "no restriction")
 * - Normal user: returns allowed tenantIds
 */
export async function getAllowedTenantIdsForRequest(): Promise<{
  isSuperAdmin: boolean;
  allowedTenantIds: string[] | null;
}> {
  const ctx = await getServerUser();

  if (!ctx?.user?.id) {
    // Not logged in: no access
    return { isSuperAdmin: false, allowedTenantIds: [] };
  }

  if (ctx.isSuperAdmin) {
    // No tenant restriction for super admins
    return { isSuperAdmin: true, allowedTenantIds: null };
  }

  const allowedTenantIds =
    (ctx.tenantRoles || [])
      .map((r) => r.tenantId)
      .filter(Boolean) || [];

  return { isSuperAdmin: false, allowedTenantIds };
}

/**
 * Convenience helper: throw/deny when user has no tenants.
 */
export async function requireAllowedTenantIdsForRequest(): Promise<{
  isSuperAdmin: boolean;
  allowedTenantIds: string[] | null;
}> {
  const scope = await getAllowedTenantIdsForRequest();

  if (!scope.isSuperAdmin && (!scope.allowedTenantIds || scope.allowedTenantIds.length === 0)) {
    return { isSuperAdmin: false, allowedTenantIds: [] };
  }

  return scope;
}
