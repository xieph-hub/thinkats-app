// lib/ats/getAtsTenant.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getAtsTenant() {
  const cookieStore = cookies();
  const activeTenantId = cookieStore.get("ats_tenant_id")?.value || null;

  if (!activeTenantId) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: activeTenantId },
  });

  return tenant || null;
}
