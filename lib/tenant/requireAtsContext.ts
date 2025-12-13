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
  return SUPERADMIN_EMAILS.includes(e);
}

/**
 * Resolves tenant + enforces membership.
 * Tenant resolution order:
 * 1) tenant slug from host (slug.thinkats.com)
 * 2) ats_tenant_id cookie (for main domain /ats)
 */
export async function requireAtsContext() {
  const authUser = await getServerUser();
  if (!authUser?.email) redirect("/login");

  const email = authUser.email.toLowerCase();

  // Ensure we have an app-level user row (by email)
  const appUser =
    (await prisma.user.findUnique({ where: { email } })) ??
    (await prisma.user.create({ data: { email } }));

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
    where: { tenantId_userId: { tenantId, userId: appUser.id } },
    select: { role: true, status: true },
  });

  const superAdmin = isSuperAdminEmail(email) || member?.role === "SUPERADMIN";

  if (!superAdmin) {
    if (!member || member.status !== "ACTIVE") {
      // You can replace this redirect with a nice 403 page if you prefer
      redirect("/ats/tenants?error=no_access");
    }
  }

  return {
    tenantId,
    userId: appUser.id,
    email,
    role: member?.role ?? (superAdmin ? "SUPERADMIN" : null),
    isSuperAdmin: superAdmin,
  };
}
