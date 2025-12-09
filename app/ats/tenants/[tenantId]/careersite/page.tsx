// app/ats/tenants/[tenantId]/careersite/page.tsx
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Local helper to mirror the base-domain logic in lib/host.ts
 * without creating any circular imports.
 */
function getBaseDomainFromEnv(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_DOMAIN;
  if (explicit) {
    return explicit.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (siteUrl) {
    try {
      const url = new URL(siteUrl);
      return url.host.replace(/^www\./, "");
    } catch {
      return siteUrl.replace(/^https?:\/\//, "").replace(/^www\./, "");
    }
  }

  return "thinkats.com";
}

type PageProps = {
  params: {
    tenantId: string;
  };
};

export const dynamic = "force-dynamic";

export default async function TenantCareersiteRedirect({ params }: PageProps) {
  const { tenantId } = params;

  // Look up the tenant by ID
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!tenant || !tenant.slug) {
    // If the tenant doesn't exist, this really is a 404
    notFound();
  }

  const baseDomain = getBaseDomainFromEnv();

  // Canonical careers URL for this tenant:
  //   <slug>.thinkats.com/careers
  const targetUrl = `https://${tenant.slug}.${baseDomain}/careers`;

  // 🚀 Redirect to the public careers site, which is rendered by app/careers/page.tsx
  redirect(targetUrl);
}
