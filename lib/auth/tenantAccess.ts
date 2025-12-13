// lib/auth/tenantAccess.ts
import { getServerUser } from "@/lib/auth/getServerUser";

export type AtsTenantScope = {
  isSuperAdmin: boolean;
  allowedTenantIds: string[] | null; // null => unrestricted
};

/**
 * Canonical tenant scope for the current server request.
 * - Super admin: allowedTenantIds = null (no restriction)
 * - Normal user: allowedTenantIds = [tenantIds they belong to]
 * - Not logged in: allowedTenantIds = []
 */
export async function getAllowedTenantIdsForRequest(): Promise<AtsTenantScope> {
  const ctx = await getServerUser();

  if (!ctx?.user?.id) {
    return { isSuperAdmin: false, allowedTenantIds: [] };
  }

  if (ctx.isSuperAdmin) {
    return { isSuperAdmin: true, allowedTenantIds: null };
  }

  const allowedTenantIds =
    (ctx.tenantRoles || []).map((r) => r.tenantId).filter(Boolean) || [];

  return { isSuperAdmin: false, allowedTenantIds };
}

/**
 * ✅ Backwards-compatible name (some files still import this).
 * Keep this until you've refactored callers.
 */
export async function getAtsTenantScope(): Promise<AtsTenantScope> {
  return getAllowedTenantIdsForRequest();
}

/**
 * Convenience helper for "must have access".
 */
export async function requireAllowedTenantIdsForRequest(): Promise<AtsTenantScope> {
  const scope = await getAllowedTenantIdsForRequest();
  if (!scope.isSuperAdmin && (!scope.allowedTenantIds || scope.allowedTenantIds.length === 0)) {
    return { isSuperAdmin: false, allowedTenantIds: [] };
  }
  return scope;
}
