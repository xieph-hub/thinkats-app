// lib/tenant/requireAtsContext.ts
import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

const ROOT_DOMAIN = process.env.TENANT_ROOT_DOMAIN || "thinkats.com";
const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function getTenantSlugFromHost(host: string | null) {
  if (!host) return null;
  const clean = host.split(":")[0].toLowerCase();

  // local/dev
  if (clean === "localhost") return null;

  // only treat subdomains of ROOT_DOMAIN as tenant slugs
  if (!clean.endsWith(ROOT_DOMAIN)) return null;

  const parts = clean.split(".");
  const rootParts = ROOT_DOMAIN.split(".");
  const subdomainParts = parts.slice(0, parts.length - rootParts.length);

  if (subdomainParts.length < 1) return null;

  const slug = subdomainParts.join(".");
  if (!slug || slug === "www" || slug === "app") return null;

  return slug;
}

function isSuperAdminEmail(email: string) {
  const e = (email || "").toLowerCase();
  return !!e && SUPERADMIN_EMAILS.includes(e);
}

/**
 * Resolves tenant + enforces membership.
 * Tenant resolution order:
 * 1) tenant slug from host (slug.thinkats.com)
 * 2) ats_tenant_id cookie (for main domain /ats)
 */
export async function requireAtsContext() {
  const ctx = await getServerUser();

  const userId = ctx?.user?.id ?? null;
  const email = (ctx?.user?.email ?? "").toLowerCase();

  if (!userId || !email) redirect("/login");

  // Resolve tenant by host subdomain or cookie
  const host = headers().get("host");
  const slug = getTenantSlugFromHost(host);

  let tenantId: string | null = null;

  if (slug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    tenantId = tenant?.id ?? null;
  } else {
    tenantId = cookies().get("ats_tenant_id")?.value ?? null;
  }

  if (!tenantId) redirect("/ats/tenants"); // choose a workspace

  // Optional: ensure tenant exists (and is active)
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true, status: true, planTier: true, name: true },
  });

  if (!tenant || (tenant.status || "").toLowerCase() !== "active") {
    redirect("/ats/tenants?error=tenant_missing");
  }

  // Membership check via UserTenantRole (your schema)
  const membership = await prisma.userTenantRole.findFirst({
    where: { tenantId, userId },
    select: { role: true, isPrimary: true },
  });

  const superAdmin =
    ctx.isSuperAdmin || isSuperAdminEmail(email) || membership?.role === "SUPERADMIN";

  if (!superAdmin && !membership) {
    redirect("/ats/tenants?error=no_access");
  }

  return {
    tenantId,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    tenantPlanTier: tenant.planTier,
    userId,
    email,
    role: membership?.role ?? (superAdmin ? "SUPERADMIN" : null),
    isSuperAdmin: superAdmin,
  };
}
