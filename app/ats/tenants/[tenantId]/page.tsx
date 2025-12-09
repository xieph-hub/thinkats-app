// app/ats/tenants/[tenantId]/page.tsx
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: {
    tenantId: string;
  };
};

export default async function TenantRedirectPage({ params }: PageProps) {
  const { tenantId } = params;

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

  // Build the public careers URL for this tenant
  const careersUrl = `https://${tenant.slug}.thinkats.com/careers`;

  // Redirect the admin straight to the tenant's public careers site
  redirect(careersUrl);
}
