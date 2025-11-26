// lib/tenant.ts
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const RESOURCIN_TENANT_SLUG =
  process.env.RESOURCIN_TENANT_SLUG || "resourcin";

export const getTenantBySlug = cache(async (slug: string) => {
  let tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) {
    // Auto-provision the Resourcin tenant if it's missing
    tenant = await prisma.tenant.create({
      data: {
        slug,
        name: "Resourcin",
      },
    });
  }

  return tenant;
});

export const getResourcinTenant = cache(async () => {
  return getTenantBySlug(RESOURCIN_TENANT_SLUG);
});
