// lib/tenant.ts

// Hard-coded fallback: the Resourcin tenant ID in Supabase.tenants
const FALLBACK_RESOURCIN_TENANT_ID =
  "3fe28b51-7e27-4d8a-b1e3-dab3966450e1";

/**
 * The current Resourcin tenant ID.
 * You can optionally override this via RESOURCIN_TENANT_ID in your env.
 */
const RESOURCIN_TENANT_ID =
  process.env.RESOURCIN_TENANT_ID ?? FALLBACK_RESOURCIN_TENANT_ID;

/**
 * Returns the current tenant ID.
 * For now, we default to the Resourcin tenant.
 *
 * Later, this can evolve to:
 * - resolve from auth (ats_users)
 * - resolve from domain (tenant_domains)
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
