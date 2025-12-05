// lib/tenant.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Canonical tenant shape used across the app (camelCase),
// with optional snake_case fields kept for any legacy callers.
export type TenantRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  primaryContactEmail: string | null;
  internalNotes: string | null;
  logoUrl: string | null;
  plan: string;            // 👈 NEW: expose plan on the typed row
  createdAt: string;
  updatedAt: string;

  // Legacy snake_case fields (optional, for older callers if any)
  primary_contact_email?: string | null;
  notes?: string | null;
  logo_url?: string | null;
  plan_raw?: string | null; // optional legacy mirror if you ever need it
  created_at?: string;
  updated_at?: string;
};

const RESOURCIN_TENANT_SLUG =
  process.env.RESOURCIN_TENANT_SLUG || "resourcin";

/**
 * Single-tenant helper for now.
 * Finds the Resourcin tenant by slug using Supabase directly,
 * and normalises field names to camelCase.
 */
export async function getResourcinTenant(): Promise<TenantRow> {
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select(
      `
      id,
      slug,
      name,
      status,
      primary_contact_email,
      notes,
      logo_url,
      plan,
      created_at,
      updated_at
    `,
    )
    .eq("slug", RESOURCIN_TENANT_SLUG)
    .single();

  if (error || !data) {
    console.error("Failed to load tenant from Supabase", {
      slug: RESOURCIN_TENANT_SLUG,
      error,
    });
    throw new Error("Resourcin tenant not found");
  }

  const raw = data as any;

  const tenant: TenantRow = {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    status: raw.status,

    // Canonical camelCase
    primaryContactEmail: raw.primary_contact_email ?? null,
    internalNotes: raw.notes ?? null,
    logoUrl: raw.logo_url ?? null,
    plan: raw.plan ?? "free", // 👈 default if null / missing
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,

    // Legacy snake_case mirrors (in case any code still uses them)
    primary_contact_email: raw.primary_contact_email ?? null,
    notes: raw.notes ?? null,
    logo_url: raw.logo_url ?? null,
    plan_raw: raw.plan ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };

  return tenant;
}

/**
 * For now, “current tenant” = Resourcin.
 * This keeps existing callers happy (/ats/*, /jobs/*).
 */
export async function getCurrentTenantId(): Promise<string> {
  const tenant = await getResourcinTenant();
  return tenant.id;
}
