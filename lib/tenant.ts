// lib/tenant.ts

// The real tenant ID for Resourcin (from Supabase.tenants)
const RESOURCIN_TENANT_ID = "3fe28b51-7e27-4d8a-b1e3-dab3966450e1"

/**
 * Returns the current tenant ID.
 * In v1, this always returns the Resourcin tenant.
 * Later, we’ll update it to resolve dynamically
 * via subdomain or user session.
 */
export function getCurrentTenantId(): string {
  return RESOURCIN_TENANT_ID
}
