// lib/tenant.ts
//
// Central place to resolve "who is the current tenant?".
//
// For now, this is always Resourcin, looked up by slug.
// Env:
//   RESOURCIN_TENANT_SLUG = "resourcin"   (or whatever you set in Vercel)

import { supabaseAdmin } from "@/lib/supabaseAdmin";

let tenantIdPromise: Promise<string> | null = null;

/**
 * Resolve the current tenant id from the `tenants` table based on slug.
 * Cached after the first call.
 */
export async function getCurrentTenantId(): Promise<string> {
  if (tenantIdPromise) return tenantIdPromise;

  tenantIdPromise = (async () => {
    const slug =
      process.env.RESOURCIN_TENANT_SLUG?.trim().toLowerCase() ||
      "resourcin";

    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      console.error("getCurrentTenantId: could not resolve tenant", {
        slug,
        error,
      });
      throw new Error("Tenant not configured for Resourcin");
    }

    return data.id as string;
  })();

  return tenantIdPromise;
}

/**
 * Legacy-style helper – if any old code still expects a "tenant object".
 * Prefer using getCurrentTenantId() directly going forward.
 */
export async function getDefaultTenant() {
  const id = await getCurrentTenantId();
  const slug =
    process.env.RESOURCIN_TENANT_SLUG?.trim().toLowerCase() ||
    "resourcin";

  return {
    id,
    name: "Resourcin",
    slug,
  };
}
