// lib/tenant/requireAtsContext.ts
import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth/getServerUser";

// Normalize ROOT_DOMAIN (no leading dot, lowercase)
const ROOT_DOMAIN = (process.env.TENANT_ROOT_DOMAIN || "thinkats.com")
  .trim()
  .replace(/^\./, "")
  .toLowerCase();

const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function getTenantSlugFromHost(host: string | null) {
  if (!host) return null;

  const clean = host.split(":")[0].toLowerCase();

  // local/dev
  if (clean === "localhost" || clean === "127.0.0.1") return null;

  // Only treat subdomains of ROOT_DOMAIN as tenant slugs
  // i.e. slug.thinkats.com -> slug
  if (clean === ROOT_DOMAIN) return null;
  if (!clean.endsWith(`.${ROOT_DOMAIN}`)) return null;

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
  return SUPERADMIN_EMAILS.includes(e);
}

/**
 * Resolves tenant + enforces membership.
 * Tenant resolution order:
 * 1) tenant slug from host (slug.thinkats.com)
 * 2) ats_tenant_id cookie (for main domain /ats)
 *
 * Membership source:
 * - UserTenantRole (your schema) already loaded via getServerUser().tenantRoles
 */
export async function requireAtsContext() {
  const auth = await getServerUser();

  const userId = auth?.user?.id ?? null;
  const email = auth?.user?.email?.toLowerCase() ?? null;

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

  if (!tenantId) redirect("/ats/tenants");

  // Superadmin rules
  const superAdmin = Boolean(auth?.isSuperAdmin) || isSuperAdminEmail(email);

  // Membership check using roles already loaded by getServerUser()
  const memberRole =
    auth?.tenantRoles?.find((r) => r.tenantId === tenantId)?.role ?? null;

  if (!superAdmin && !memberRole) {
    redirect("/ats/tenants?error=no_access");
  }

  return {
    tenantId,
    userId,
    email,
    role: memberRole ?? (superAdmin ? "SUPERADMIN" : null),
    isSuperAdmin: superAdmin,
    tenantSlug: slug,
  };
}
