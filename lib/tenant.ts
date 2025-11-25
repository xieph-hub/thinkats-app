// lib/tenant.ts

// The Resourcin tenant ID in Supabase.tenants
const RESOURCIN_TENANT_ID = "54286a10-0503-409b-a9d4-a324e9283c1c";

/**
 * Returns the current tenant ID.
 * For now, we default to the Resourcin tenant.
 */
export function getCurrentTenantId(): string {
  return RESOURCIN_TENANT_ID;
}

/**
 * Legacy fallback for older code that expects getDefaultTenant().
 * You can safely remove this once all files import getCurrentTenantId instead.
 */
export function getDefaultTenant() {
  return {
    id: RESOURCIN_TENANT_ID,
    name: "Resourcin",
    slug: "resourcin",
  };
}
