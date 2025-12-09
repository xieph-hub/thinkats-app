// app/tenants/[tenantSlug]/careers/page.tsx
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: {
    tenantSlug: string;
  };
};

function getBaseDomainFromEnv(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkats.com";
  try {
    const host = new URL(siteUrl).hostname; // e.g. "thinkats.com" or "www.thinkats.com"
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return "thinkats.com";
  }
}

export default async function TenantPublicCareersRedirectPage({
  params,
}: PageProps) {
  const { tenantSlug } = params;
  const baseDomain = getBaseDomainFromEnv();

  // Look up tenant by slug
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: {
      slug: true,
      status: true,
    },
  });

  if (!tenant || !tenant.slug) {
    notFound();
  }

  // Optional: block inactive tenants
  // const isActive = (tenant.status || "").toLowerCase() === "active";
  // if (!isActive) notFound();

  const careersUrl = `https://${tenant.slug}.${baseDomain}/careers`;

  redirect(careersUrl);
}
