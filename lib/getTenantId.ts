// lib/getTenantId.ts
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Resolve the active tenant ID (UUID) for Resourcin / ThinkATS.
 *
 * Priority:
 * 1) If RESOURCIN_TENANT_ID is set, use that directly (real UUID).
 * 2) Otherwise, look up the tenant by RESOURCIN_TENANT_SLUG in Supabase.
 */
export async function getTenantId(): Promise<string> {
  // Fast path: if you later add RESOURCIN_TENANT_ID, we skip the lookup
  if (process.env.RESOURCIN_TENANT_ID) {
    return process.env.RESOURCIN_TENANT_ID;
  }

  const slug = process.env.RESOURCIN_TENANT_SLUG;

  if (!slug) {
    console.error("RESOURCIN_TENANT_SLUG is not set in environment");
    throw new Error("Tenant slug not configured");
  }

  // ⚠️ If your table is named "Tenant" or "organizations", change "tenants" below.
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error || !data?.id) {
    console.error("Failed to resolve tenant ID from slug", {
      slug,
      error,
    });
    throw new Error("Unable to resolve tenant for jobs listing");
  }

  return data.id as string; // UUID that matches jobs.tenant_id
}
