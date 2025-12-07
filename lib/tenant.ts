// lib/tenant.ts
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/tenantHost";

/**
 * Canonical tenant shape used across the app (camelCase),
 * with optional snake_case fields kept for any legacy callers.
 */
export type TenantRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  primaryContactEmail: string | null;
  internalNotes: string | null;
  logoUrl: string | null;
  plan: string; // e.g. "free", "pro", "enterprise"
  createdAt: string;
  updatedAt: string;

  // Legacy snake_case fields (optional, for older callers if any)
  primary_contact_email?: string | null;
  notes?: string | null;
  logo_url?: string | null;
  plan_raw?: string | null;
  created_at?: string;
  updated_at?: string;
};

const RESOURCIN_TENANT_SLUG =
  process.env.RESOURCIN_TENANT_SLUG || "resourcin";

/**
 * Internal helper: normalise a Prisma Tenant into TenantRow.
 */
function mapTenant(raw: any): TenantRow {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    status: raw.status,

    // Canonical camelCase
    primaryContactEmail: raw.primaryContactEmail ?? null,
    internalNotes: raw.internalNotes ?? null,
    logoUrl: raw.logoUrl ?? null,
    plan: raw.plan ?? "free",
    createdAt: raw.createdAt?.toISOString?.() ?? String(raw.createdAt),
    updatedAt: raw.updatedAt?.toISOString?.() ?? String(raw.updatedAt),

    // Legacy snake_case mirrors
    primary_contact_email: raw.primaryContactEmail ?? null,
    notes: raw.internalNotes ?? null,
    logo_url: raw.logoUrl ?? null,
    plan_raw: raw.plan ?? null,
    created_at: raw.createdAt?.toISOString?.() ?? String(raw.createdAt),
    updated_at: raw.updatedAt?.toISOString?.() ?? String(raw.updatedAt),
  };
}

/**
 * Generic loader: get tenant by slug using Prisma.
 */
export async function getTenantBySlug(slug: string): Promise<TenantRow> {
  const trimmed = slug.trim();
  if (!trimmed) {
    throw new Error("getTenantBySlug called with empty slug");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: trimmed },
  });

  if (!tenant) {
    throw new Error(`Tenant not found for slug: ${trimmed}`);
  }

  return mapTenant(tenant);
}

/**
 * Compatibility helper:
 * For now, “Resourcin tenant” = whatever you’ve configured as RESOURCIN_TENANT_SLUG.
 */
export async function getResourcinTenant(): Promise<TenantRow> {
  return getTenantBySlug(RESOURCIN_TENANT_SLUG);
}

/**
 * Host-aware loader:
 * - If we’re on resourcin.thinkats.com → load the “resourcin” tenant.
 * - If we’re on acme.thinkats.com → load “acme” tenant.
 * - If no subdomain / primary host → returns null.
 */
export async function getTenantForHost(): Promise<TenantRow | null> {
  const { tenantSlugFromHost } = getHostContext();

  if (!tenantSlugFromHost) {
    return null;
  }

  try {
    return await getTenantBySlug(tenantSlugFromHost);
  } catch (err) {
    console.error("getTenantForHost failed", {
      hostSlug: tenantSlugFromHost,
      error: err,
    });
    return null;
  }
}

/**
 * “Current tenant” helper:
 *
 * - On a tenant subdomain (slug.thinkats.com), it returns that tenant’s id.
 * - On the primary domain (thinkats.com / www.thinkats.com),
 *   it falls back to Resourcin for now to keep existing callers happy.
 *
 * This keeps the old behaviour working while making it safe to
 * gradually move /ats/* to be truly multi-tenant + host-aware.
 */
export async function getCurrentTenantId(): Promise<string> {
  const hostTenant = await getTenantForHost();
  if (hostTenant) {
    return hostTenant.id;
  }

  const fallback = await getResourcinTenant();
  return fallback.id;
}
