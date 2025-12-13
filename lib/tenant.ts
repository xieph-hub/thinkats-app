// lib/tenant.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import { requireTenantMembership } from "@/lib/requireTenantMembership";

/**
 * Cookie name used on PRIMARY HOST (thinkats.com) to remember the selected tenant.
 * You can change it, but keep it consistent everywhere.
 */
export const ATS_TENANT_COOKIE = "ats_tenant_id";

/**
 * A typed error you can catch in pages/routes if you want to redirect
 * (e.g., to /ats/select-tenant) instead of throwing a generic 500.
 */
export class TenantContextError extends Error {
  code:
    | "MISSING_TENANT_CONTEXT"
    | "TENANT_NOT_FOUND"
    | "TENANT_SLUG_NOT_FOUND";
  constructor(
    code:
      | "MISSING_TENANT_CONTEXT"
      | "TENANT_NOT_FOUND"
      | "TENANT_SLUG_NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "TenantContextError";
    this.code = code;
  }
}

type AtsTenantContext = {
  isPrimaryHost: boolean;
  tenantSlugFromHost: string | null;
  /**
   * Explicit tenant identifier for the request:
   * - subdomain host => derived from slug
   * - primary host   => cookie or explicit URL param
   */
  tenantId: string;
  tenant: {
    id: string;
    slug: string;
    name: string;
    status: string;
    logoUrl: string | null;
  };
};

type ResolveOpts = {
  /**
   * Use this when a page explicitly passes ?tenantId=... (or similar).
   * If provided, it overrides the cookie on primary host.
   */
  tenantIdFromUrl?: string | null;

  /**
   * If true, membership is enforced on primary host.
   * (On tenant subdomain, membership is enforced in app/ats/layout.tsx already.)
   */
  enforceMembershipOnPrimaryHost?: boolean;
};

/**
 * STRICT resolver:
 * - Tenant subdomain => tenantSlugFromHost is REQUIRED, resolves tenant by slug.
 * - Primary host     => tenantId is REQUIRED (URL param OR cookie).
 *
 * NO ENV FALLBACKS. NO DB FIRST TENANT FALLBACKS.
 */
export async function getAtsTenantContext(
  opts: ResolveOpts = {},
): Promise<AtsTenantContext> {
  const { isPrimaryHost, tenantSlugFromHost } = await getHostContext();
  const enforceMembershipOnPrimaryHost =
    opts.enforceMembershipOnPrimaryHost ?? true;

  // -----------------------------
  // 1) TENANT SUBDOMAIN HOST
  // -----------------------------
  // Example: acme.thinkats.com
  if (!isPrimaryHost) {
    if (!tenantSlugFromHost) {
      throw new TenantContextError(
        "MISSING_TENANT_CONTEXT",
        "Tenant host detected but no tenant slug was found in the hostname.",
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlugFromHost },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        logoUrl: true,
      },
    });

    if (!tenant) {
      throw new TenantContextError(
        "TENANT_SLUG_NOT_FOUND",
        `No tenant exists for slug: ${tenantSlugFromHost}`,
      );
    }

    return {
      isPrimaryHost,
      tenantSlugFromHost,
      tenantId: tenant.id,
      tenant,
    };
  }

  // -----------------------------
  // 2) PRIMARY HOST (thinkats.com)
  // -----------------------------
  const cookieTenantId = cookies().get(ATS_TENANT_COOKIE)?.value ?? null;
  const requestedTenantId = (opts.tenantIdFromUrl ?? "").trim() || cookieTenantId;

  if (!requestedTenantId) {
    throw new TenantContextError(
      "MISSING_TENANT_CONTEXT",
      `No tenant selected. Provide an explicit tenantId (URL) or set the ${ATS_TENANT_COOKIE} cookie.`,
    );
  }

  // Enforce membership unless you intentionally want public multi-tenant admin access (not recommended)
  if (enforceMembershipOnPrimaryHost) {
    await requireTenantMembership(requestedTenantId);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: requestedTenantId },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      logoUrl: true,
    },
  });

  if (!tenant) {
    throw new TenantContextError(
      "TENANT_NOT_FOUND",
      `No tenant exists for id: ${requestedTenantId}`,
    );
  }

  return {
    isPrimaryHost,
    tenantSlugFromHost,
    tenantId: tenant.id,
    tenant,
  };
}

/**
 * Convenience helper for pages/routes that want "optional" context
 * (e.g., global super-admin pages like /ats/tenants).
 *
 * It returns null instead of throwing when the tenant context is missing.
 * NOTE: Still no fallback to env/first tenant.
 */
export async function getAtsTenantContextOrNull(
  opts: ResolveOpts = {},
): Promise<AtsTenantContext | null> {
  try {
    return await getAtsTenantContext(opts);
  } catch (e: any) {
    if (e?.name === "TenantContextError" && e?.code === "MISSING_TENANT_CONTEXT") {
      return null;
    }
    throw e;
  }
}

// Re-export so existing imports don’t break
export { requireTenantMembership };
