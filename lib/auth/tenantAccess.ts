// lib/auth/tenantAccess.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/getServerUser";

export type AtsTenantScope = {
  userId: string;
  isSuperAdmin: boolean;
  activeTenantId: string | null;
  allowedTenantIds: string[];
};

/**
 * Single source of truth for ATS tenant scoping.
 *
 * Today: active tenant = primaryTenantId from DB.
 * Future: add a workspace-switcher cookie, e.g. "thinkats_active_tenant",
 * and validate it against allowedTenantIds.
 */
export async function getAtsTenantScope(opts?: {
  requireAuth?: boolean; // default true
  requireTenant?: boolean; // default true
}): Promise<AtsTenantScope> {
  const requireAuth = opts?.requireAuth ?? true;
  const requireTenant = opts?.requireTenant ?? true;

  const ctx = await getServerUser();

  if (!ctx?.user?.id) {
    if (requireAuth) redirect("/login?returnTo=/ats");
    return {
      userId: "",
      isSuperAdmin: false,
      activeTenantId: null,
      allowedTenantIds: [],
    };
  }

  const allowedTenantIds = (ctx.tenantRoles ?? []).map((r) => r.tenantId);

  // Current standard: primary tenant from DB context
  let activeTenantId = ctx.primaryTenantId ?? null;

  // OPTIONAL future switcher (safe validation) — keep disabled unless you add UI:
  // const cookieTenantId = cookies().get("thinkats_active_tenant")?.value?.trim();
  // if (cookieTenantId && allowedTenantIds.includes(cookieTenantId)) {
  //   activeTenantId = cookieTenantId;
  // }

  if (requireTenant && !activeTenantId && !ctx.isSuperAdmin) {
    redirect("/access-denied?reason=no_active_tenant");
  }

  // Membership enforcement (unless super admin)
  if (
    activeTenantId &&
    !ctx.isSuperAdmin &&
    !allowedTenantIds.includes(activeTenantId)
  ) {
    redirect("/access-denied?reason=tenant_forbidden");
  }

  return {
    userId: ctx.user.id,
    isSuperAdmin: ctx.isSuperAdmin,
    activeTenantId,
    allowedTenantIds,
  };
}

/**
 * If you still have older imports expecting this name, keep this alias.
 * (Your build log shows older references.)
 */
export async function getAllowedTenantIdsForRequest() {
  const scope = await getAtsTenantScope({ requireAuth: true, requireTenant: false });
  return scope.allowedTenantIds;
}
