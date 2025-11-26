// lib/tenant.ts
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const RESOURCIN_TENANT_SLUG = process.env.RESOURCIN_TENANT_SLUG;

if (!RESOURCIN_TENANT_SLUG) {
  throw new Error("RESOURCIN_TENANT_SLUG is not set in environment variables");
}

export const getTenantBySlug = cache(async (slug: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) {
    throw new Error(`Tenant not found for slug: ${slug}`);
  }

  return tenant;
});

export const getResourcinTenant = cache(async () => {
  return getTenantBySlug(RESOURCIN_TENANT_SLUG!);
});
