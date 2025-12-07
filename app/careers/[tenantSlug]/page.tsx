// app/careers/[tenantSlug]/page.tsx
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBaseDomain } from "@/lib/tenantHost";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers | ThinkATS",
  description: "Company careers sites powered by ThinkATS.",
};

type PageProps = {
  params: { tenantSlug: string };
};

export default async function CareersSlugRedirectPage({ params }: PageProps) {
  const slug = decodeURIComponent(params.tenantSlug || "").trim();

  if (!slug) {
    notFound();
  }

  // Only redirect if there is a PUBLIC careers site for an ACTIVE tenant
  const settings = await prisma.careerSiteSettings.findFirst({
    where: {
      isPublic: true,
      tenant: {
        slug,
        status: "active",
      },
    },
    select: {
      tenant: {
        select: {
          slug: true,
        },
      },
    },
  });

  const tenantSlug = settings?.tenant?.slug;

  if (!tenantSlug) {
    notFound();
  }

  const baseDomain = getBaseDomain();
  const target = `https://${tenantSlug}.${baseDomain}/careers`;

  redirect(target);
}
