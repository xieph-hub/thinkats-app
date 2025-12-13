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
  if (clean === ROOT_DOMAIN) return null;
  if (!clean.endsWith(`.${ROOT_DOMAIN}`) && !clean.endsWith(ROOT_DOMAIN)) return null;

  const parts = clean.split(".");
  const rootParts = ROOT_DOMAIN.split(".");
  const subdomainParts = parts.slice(0, parts.length - rootParts.length);

  if (subdomainParts.length < 1) return null;

  const slug = subdomainParts.join(".");
  if (!slug || slug === "www" || slug === "app") return null;

  return slug;
}

function isSuperAdminEmail(email: string) {
  return SUPERADMIN_EMAILS.includes((email || "").toLowerCase());
}

/**
 * Resolves tenant + enforces membership.
 * Tenant resolution order:
 * 1) tenant slug from host (slug.thinkats.com)
 * 2) ats_tenant_id cookie (for main domain /ats)
 */
export async function requireAtsContext() {
  const auth = await getServerUser();

  // getServerUser() returns { user: { email } }, not auth.email
  const email = auth?.user?.email?.toLowerCase() || null;
  const userId = auth?.user?.id || null;

  if (!email || !userId) redirect("/login");

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

  // Membership check
  const member = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
    select: { role: true, status: true },
  });

  // Superadmin rules:
  // - globalRole SUPER_ADMIN from the DB user (auth.isSuperAdmin)
  // - OR in env SUPERADMIN_EMAILS
  // - OR tenant member has role SUPERADMIN
  const superAdmin =
    Boolean(auth?.isSuperAdmin) ||
    isSuperAdminEmail(email) ||
    member?.role === "SUPERADMIN";

  if (!superAdmin) {
    if (!member || member.status !== "ACTIVE") {
      redirect("/ats/tenants?error=no_access");
    }
  }

  return {
    tenantId,
    userId,
    email,
    role: member?.role ?? (superAdmin ? "SUPERADMIN" : null),
    isSuperAdmin: superAdmin,
    tenantSlug: slug, // useful for UI/logging (optional)
  };
}
