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
  role: string | null;
  isSuperAdmin: boolean;
};

/**
 * Strict tenant context:
 * - Tenant host (slug.thinkats.com) wins
 * - Else cookie-selected tenant id
 * - Else FAIL (redirect to tenant picker)
 *
 * No env fallback. No primaryTenant fallback. Ever.
 */
export async function requireAtsTenant(): Promise<AtsTenantContext> {
  const ctx = await getServerUser();
  if (!ctx) redirect("/login");

  const host = getHost();
  const slug = getTenantSlugFromHost(host);

  let tenantId: string | null = null;

  // 1) Tenant host
  if (slug) {
    const t = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!t) notFound();
    tenantId = t.id;
  } else {
    // 2) Cookie only
    tenantId = readTenantIdCookie();
  }

  // 3) No tenant context => fail
  if (!tenantId) redirect("/ats/tenants?error=select_tenant");

  const isSuperAdmin = ctx.isSuperAdmin || ctx.user.globalRole === "SUPER_ADMIN";

  // Optional defense: always ensure tenant exists (even for super admin)
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true, name: true, status: true, planTier: true },
  });
  if (!tenant) notFound();

  // Optional: block inactive tenants
  if ((tenant.status || "").toLowerCase() !== "active") {
    redirect("/ats/tenants?error=tenant_inactive");
  }

  // Membership enforcement (unless super admin)
  const roleFromList =
    ctx.tenantRoles.find((r) => r.tenantId === tenantId)?.role ?? null;

  if (!isSuperAdmin) {
    if (!roleFromList) redirect("/ats/tenants?error=no_access");

    const membership = await prisma.userTenantRole.findFirst({
      where: { userId: ctx.user.id, tenantId },
      select: { role: true },
    });

    if (!membership) redirect("/ats/tenants?error=no_access");
  }

  return {
    tenant,
    user: ctx.user,
    role: isSuperAdmin ? roleFromList ?? "SUPER_ADMIN" : roleFromList,
    isSuperAdmin,
  };
}
