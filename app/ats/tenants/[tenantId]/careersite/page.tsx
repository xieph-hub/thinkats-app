// app/ats/tenants/[tenantId]/careersite/page.tsx
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Local helper – mirrors the logic in app/ats/tenants/page.tsx
 * for building tenantSlug.thinkats.com style URLs.
 */
function getBaseDomainFromEnv(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkats.com";
  try {
    const hostname = new URL(siteUrl).hostname;
    return hostname.replace(/^www\./i, "");
  } catch {
    return "thinkats.com";
  }
}

type PageProps = {
  params: {
    tenantId: string;
  };
};

export const dynamic = "force-dynamic";

export default async function TenantCareersiteRedirect({ params }: PageProps) {
  const { tenantId } = params;

  // 1) Look up the tenant by ID
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      slug: true,
    },
  });

  // If the tenant truly doesn't exist, this *should* be a 404
  if (!tenant) {
    notFound();
  }

  // If there is no slug yet, we can't build a subdomain URL
  if (!tenant.slug) {
    // You can swap this to a soft page if you prefer,
    // but notFound() keeps the behaviour honest.
    notFound();
  }

  const baseDomain = getBaseDomainFromEnv();

  // Canonical public careers URL for this tenant:
  //   https://<slug>.<baseDomain>/careers
  const targetUrl = `https://${tenant.slug}.${baseDomain}/careers`;

  // 🔁 Redirect to the public careers site, which is rendered by app/careers/page.tsx
  redirect(targetUrl);
}
