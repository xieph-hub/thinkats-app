// lib/tenant.ts
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import { requireTenantMembership } from "@/lib/requireTenantMembership";

/**
 * Resolve the active tenant for the current request.
 *
 * Priority:
 *  1. Tenant subdomain (slug.thinkats.com) → by slug
 *  2. Primary host + ?tenantId=...        → by id, with membership check
 *  3. ENV defaults (RESOURCIN_TENANT_ID / RESOURCIN_TENANT_SLUG)
 *  4. First tenant in DB (dev fallback)
 */
export async function getResourcinTenant(
  tenantIdFromUrl?: string | null,
) {
  // 🔧 FIX: getHostContext is async
  const { isPrimaryHost, tenantSlugFromHost } = await getHostContext();

  // 1) Tenant subdomain – host wins, membership already enforced in AtsLayout.
  if (!isPrimaryHost && tenantSlugFromHost) {
    const tenantBySlug = await prisma.tenant.findUnique({
      where: { slug: tenantSlugFromHost },
    });
    if (tenantBySlug) {
      return tenantBySlug;
    }
  }

  // 2) Primary host with explicit tenantId in the URL.
  if (isPrimaryHost && tenantIdFromUrl) {
    // Enforce membership; redirects if unauthenticated / not allowed.
    await requireTenantMembership(tenantIdFromUrl);

    const tenantById = await prisma.tenant.findUnique({
      where: { id: tenantIdFromUrl },
    });
    if (tenantById) {
      return tenantById;
    }
  }

  // 3) Fallback to ENV-configured default tenant.
  const envId = process.env.RESOURCIN_TENANT_ID;
  const envSlug = process.env.RESOURCIN_TENANT_SLUG;

  if (envId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: envId },
    });
    if (tenant) {
      return tenant;
    }
  }

  if (envSlug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: envSlug },
    });
    if (tenant) {
      return tenant;
    }
  }

  // 4) Final safety net: first tenant in DB (useful in local dev)
  const fallback = await prisma.tenant.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!fallback) {
    throw new Error(
      "No tenant configured. Create at least one tenant or set RESOURCIN_TENANT_ID / RESOURCIN_TENANT_SLUG.",
    );
  }

  return fallback;
}

// Re-export so ATS surfaces can do:
// import { getResourcinTenant, requireTenantMembership } from "@/lib/tenant";
export { requireTenantMembership };
