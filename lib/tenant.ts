// lib/tenant.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Shape of the row in your Supabase `tenants` table
export type TenantRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  primary_contact_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const RESOURCIN_TENANT_SLUG =
  process.env.RESOURCIN_TENANT_SLUG || "resourcin";

/**
 * Single-tenant helper for now.
 * Finds the Resourcin tenant by slug using Supabase directly.
 */
export async function getResourcinTenant(): Promise<TenantRow> {
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("*")
    .eq("slug", RESOURCIN_TENANT_SLUG)
    .single();

  if (error || !data) {
    console.error("Failed to load tenant from Supabase", {
      slug: RESOURCIN_TENANT_SLUG,
      error,
    });
    throw new Error("Resourcin tenant not found");
  }

  return data as TenantRow;
}

/**
 * For now, “current tenant” = Resourcin.
 * This keeps existing callers happy (/ats/*, /jobs/*).
 */
export async function getCurrentTenantId(): Promise<string> {
  const tenant = await getResourcinTenant();
  return tenant.id;
}
