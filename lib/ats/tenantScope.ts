// lib/ats/tenantScope.ts
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

type RoleLite = {
  tenantId?: string | null;
  tenant_id?: string | null;
  tenantSlug?: string | null;
  tenant_slug?: string | null;
  tenantName?: string | null;
  tenant_name?: string | null;
  role?: string | null;
  isPrimary?: boolean | null;
  is_primary?: boolean | null;
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function normalizeRoles(raw: any): Array<{
  tenantId: string;
  tenantSlug: string | null;
  tenantName: string | null;
  role: string;
  isPrimary: boolean;
}> {
  const arr: RoleLite[] = Array.isArray(raw) ? raw : [];
  return arr
    .map((t) => ({
      tenantId: String(t.tenantId || t.tenant_id || "").trim(),
      tenantSlug: (t.tenantSlug || t.tenant_slug || null) as string | null,
      tenantName: (t.tenantName || t.tenant_name || null) as string | null,
      role: String(t.role || "viewer").toLowerCase(),
      isPrimary: Boolean(t.isPrimary ?? t.is_primary ?? false),
    }))
    .filter((t) => !!t.tenantId);
}

export type AtsTenantScope = {
  ctx: any;
  isSuperAdmin: boolean;
  tenantId: string;
  role: string;
  tenantName: string;
  tenantSlug: string | null;
};

/**
 * Resolve a safe, authorized tenantId for the current user.
 * - requestedTenant can be UUID or slug (from URL or query)
 * - If user is NOT super admin, requestedTenant is only accepted if it matches their memberships.
 */
export async function getAtsTenantScope(opts?: {
  requestedTenant?: string | null;
  strict?: boolean; // if true: reject unauthorized requestedTenant instead of falling back
}): Promise<AtsTenantScope> {
  const requestedTenant = String(opts?.requestedTenant || "").trim();
  const strict = Boolean(opts?.strict);

  const ctx: any = await getServerUser();
  const isSuperAdmin = Boolean(ctx?.isSuperAdmin);

  const roles = normalizeRoles(ctx?.user?.tenants);

  if (!isSuperAdmin && roles.length === 0) {
    // no membership → block
    throw new Error("TENANT_ACCESS_DENIED");
  }

  // Prefer primary tenant, else first
  const primary = roles.find((r) => r.isPrimary) || roles[0] || null;

  // If nothing requested, use primary/first
  if (!requestedTenant) {
    if (!primary) throw new Error("TENANT_ACCESS_DENIED");
    return {
      ctx,
      isSuperAdmin,
      tenantId: primary.tenantId,
      role: primary.role,
      tenantName: primary.tenantName || primary.tenantSlug || "Workspace",
      tenantSlug: primary.tenantSlug || null,
    };
  }

  // If requested is UUID: check membership (unless super admin)
  if (isUuid(requestedTenant)) {
    const match = roles.find((r) => r.tenantId === requestedTenant);
    if (!match && !isSuperAdmin) {
      if (strict) throw new Error("TENANT_FORBIDDEN");
      if (!primary) throw new Error("TENANT_ACCESS_DENIED");
      return {
        ctx,
        isSuperAdmin,
        tenantId: primary.tenantId,
        role: primary.role,
        tenantName: primary.tenantName || primary.tenantSlug || "Workspace",
        tenantSlug: primary.tenantSlug || null,
      };
    }

    // For super admin (or matched member), fetch tenant name/slug safely
    const t = await prisma.tenant.findUnique({
      where: { id: requestedTenant },
      select: { id: true, name: true, slug: true },
    });
    if (!t) throw new Error("TENANT_NOT_FOUND");

    return {
      ctx,
      isSuperAdmin,
      tenantId: t.id,
      role: match?.role || (isSuperAdmin ? "admin" : "viewer"),
      tenantName: t.name || t.slug,
      tenantSlug: t.slug,
    };
  }

  // Otherwise treat requested as slug
  // Non-super admin: only accept slug if it matches one of their roles (avoid leaking tenant existence)
  const slugLower = requestedTenant.toLowerCase();
  const matchBySlug = roles.find((r) => (r.tenantSlug || "").toLowerCase() === slugLower);

  if (!matchBySlug && !isSuperAdmin) {
    if (strict) throw new Error("TENANT_FORBIDDEN");
    if (!primary) throw new Error("TENANT_ACCESS_DENIED");
    return {
      ctx,
      isSuperAdmin,
      tenantId: primary.tenantId,
      role: primary.role,
      tenantName: primary.tenantName || primary.tenantSlug || "Workspace",
      tenantSlug: primary.tenantSlug || null,
    };
  }

  // Super admin: resolve slug via DB. Member: use their tenantId directly.
  if (matchBySlug) {
    return {
      ctx,
      isSuperAdmin,
      tenantId: matchBySlug.tenantId,
      role: matchBySlug.role,
      tenantName: matchBySlug.tenantName || matchBySlug.tenantSlug || "Workspace",
      tenantSlug: matchBySlug.tenantSlug,
    };
  }

  const t = await prisma.tenant.findUnique({
    where: { slug: requestedTenant },
    select: { id: true, name: true, slug: true },
  });
  if (!t) throw new Error("TENANT_NOT_FOUND");

  return {
    ctx,
    isSuperAdmin,
    tenantId: t.id,
    role: "admin",
    tenantName: t.name || t.slug,
    tenantSlug: t.slug,
  };
}
