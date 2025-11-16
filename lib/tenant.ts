// lib/tenant.ts
import { prisma } from "./prisma";

const DEFAULT_TENANT_SLUG =
  process.env.RESOURCIN_TENANT_SLUG || "resourcin";

export async function getDefaultTenant() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
  });

  if (!tenant) {
    throw new Error(
      `Tenant with slug "${DEFAULT_TENANT_SLUG}" not found. Make sure you've seeded it in the database.`
    );
  }

  return tenant;
}
