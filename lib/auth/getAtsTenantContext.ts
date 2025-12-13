import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function getAtsTenantContext() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Unauthenticated");

  const appUser = await prisma.user.findUnique({
    where: { email: user.email.toLowerCase() },
    select: { id: true, globalRole: true },
  });
  if (!appUser) throw new Error("User not provisioned in app DB");

  // User’s memberships
  const roles = await prisma.userTenantRole.findMany({
    where: { userId: appUser.id },
    include: { tenant: true },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });

  if (appUser.globalRole === "SUPER_ADMIN") {
    // SUPER_ADMIN can view all, but still needs an active tenant for scoped pages
    const active = cookies().get("ats_active_tenant")?.value;
    if (active) {
      const tenant = await prisma.tenant.findUnique({ where: { id: active } });
      if (tenant) return { userId: appUser.id, globalRole: appUser.globalRole, tenant, roles };
    }
    // fallback: pick first tenant if exists, else null
    return { userId: appUser.id, globalRole: appUser.globalRole, tenant: roles[0]?.tenant ?? null, roles };
  }

  // Non-super admins: must have membership
  const active = cookies().get("ats_active_tenant")?.value;
  if (active) {
    const match = roles.find(r => r.tenantId === active);
    if (match) return { userId: appUser.id, globalRole: appUser.globalRole, tenant: match.tenant, roles };
  }

  const primary = roles.find(r => r.isPrimary) ?? roles[0];
  if (!primary) throw new Error("No tenant membership");
  return { userId: appUser.id, globalRole: appUser.globalRole, tenant: primary.tenant, roles };
}
