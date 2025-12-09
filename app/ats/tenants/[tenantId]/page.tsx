// app/ats/tenants/[tenantId]/page.tsx
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: {
    tenantId: string;
  };
};

// Reuse base-domain logic so you respect NEXT_PUBLIC_SITE_URL
function getBaseDomainFromEnv(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkats.com";
  try {
    const host = new URL(siteUrl).hostname; // e.g. "thinkats.com" or "www.thinkats.com"
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return "thinkats.com";
  }
}

export default async function TenantRedirectPage({ params }: PageProps) {
  const { tenantId } = params;
  const baseDomain = getBaseDomainFromEnv();

  // Look up the tenant by its internal ID
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      slug: true,
    },
  });

  if (!tenant || !tenant.slug) {
    // If we can't find it, render a 404
    notFound();
  }

  // Build the public workspace URL for this tenant
  // NOTE: no /careers here – root of the mini ATS
  const tenantRootUrl = `https://${tenant.slug}.${baseDomain}`;

  // Redirect the admin straight to the tenant's mini ATS root
  redirect(tenantRootUrl);
}
