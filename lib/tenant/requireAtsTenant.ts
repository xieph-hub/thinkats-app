// lib/tenant/requireAtsTenant.ts
import "server-only";

import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

const ROOT_DOMAIN = (process.env.TENANT_ROOT_DOMAIN || "thinkats.com")
  .toLowerCase()
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

const TENANT_COOKIE_NAMES = ["thinkats_tenant_id", "ats_tenant_id"];

function getHost() {
  return headers().get("host")?.split(":")[0].toLowerCase() ?? null;
}

function getTenantSlugFromHost(host: string | null) {
  if (!host) return null;
  if (host === "localhost") return null;

  // only treat subdomains of ROOT_DOMAIN as tenant slugs
  if (!host.endsWith(ROOT_DOMAIN)) return null;

  const parts = host.split(".");
  const rootParts = ROOT_DOMAIN.split(".");
  const subdomainParts = parts.slice(0, parts.length - rootParts.length);

  if (subdomainParts.length < 1) return null;

  const slug = subdomainParts.join(".");
  if (!slug || slug === "www" || slug === "app") return null;

  return slug;
}

function readTenantIdCookie() {
  const store = cookies();
  for (const name of TENANT_COOKIE_NAMES) {
    const v = store.get(name)?.value?.trim();
    if (v) return v;
  }
  return null;
}

export type AtsTenantContext = {
  tenant: {
    id: string;
    slug: string;
    name: string;
    status: string;
    planTier: string;
  };
  user: {
    id: string;
    email: string | null;
    fullName: string | null;
    globalRole: string;
  };
  role: string | null; // tenant role (from UserTenantRole)
  isSuperAdmin: boolean;
};

/**
 * Resolves an active tenant and enforces membership (UserTenantRole),
 * with explicit SUPER_ADMIN override.
 *
 * Resolution order:
 * 1) tenant slug from host (slug.thinkats.com)
 * 2) tenant id cookie (thinkats_tenant_id / ats_tenant_id)
 * 3) user's primary tenant (from getServerUser)
 */
export async function requireAtsTenant(): Promise<AtsTenantContext> {
  const ctx = await getServerUser();
  if (!ctx) redirect("/login");

  const host = getHost();
  const slug = getTenantSlugFromHost(host);

  const cookieTenantId = readTenantIdCookie();
  let tenantId: string | null = null;

  // 1) Host-based tenant
  if (slug) {
    const t = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!t) notFound();
    tenantId = t.id;
  } else {
    // 2) Cookie-based tenant
    tenantId = cookieTenantId || ctx.primaryTenantId || null;
  }

  if (!tenantId) redirect("/ats/tenants");

  const isSuperAdmin = ctx.isSuperAdmin || ctx.user.globalRole === "SUPER_ADMIN";

  // Membership enforcement (unless SUPER_ADMIN)
  const roleFromList =
    ctx.tenantRoles.find((r) => r.tenantId === tenantId)?.role ?? null;

  if (!isSuperAdmin) {
    // If cookie was tampered (tenant not in user roles), fall back safely to primary tenant.
    if (!roleFromList) {
      if (!slug && ctx.primaryTenantId) {
        tenantId = ctx.primaryTenantId;
      } else {
        redirect("/ats/tenants?error=no_access");
      }
    }

    // Final “real” membership verification in DB (defense in depth)
    const membership = await prisma.userTenantRole.findFirst({
      where: { userId: ctx.user.id, tenantId },
      select: { role: true },
    });

    if (!membership) redirect("/ats/tenants?error=no_access");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true, name: true, status: true, planTier: true },
  });

  if (!tenant) notFound();

  // Optional: block inactive tenants
  if ((tenant.status || "").toLowerCase() !== "active") {
    redirect("/ats/tenants?error=tenant_inactive");
  }

  return {
    tenant,
    user: ctx.user,
    role: isSuperAdmin
      ? roleFromList ?? "SUPER_ADMIN"
      : roleFromList ?? null,
    isSuperAdmin,
  };
}
