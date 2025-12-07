// app/login/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { getHostContext } from "@/lib/host";
import { prisma } from "@/lib/prisma";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Login | ThinkATS",
  description:
    "Login to ThinkATS to access your ATS workspace, roles, candidates and pipelines.",
};

export const dynamic = "force-dynamic";

export type LoginBrandConfig = {
  isPrimaryHost: boolean;
  tenantSlug: string | null;
  tenantName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  tagline: string;
  heading: string;
  subheading: string;
};

async function getBrandConfigForRequest(): Promise<LoginBrandConfig> {
  const { isPrimaryHost, tenantSlugFromHost } = getHostContext();

  // 🔹 Primary host (thinkats.com / www.thinkats.com)
  if (isPrimaryHost || !tenantSlugFromHost) {
    return {
      isPrimaryHost: true,
      tenantSlug: null,
      tenantName: null,
      logoUrl: null,
      primaryColor: "#1E40AF",
      accentColor: "#38BDF8",
      tagline: "THINKATS · LOGIN",
      heading: "Log in to your ThinkATS workspace",
      subheading:
        "Access roles, candidates, hiring pipelines and client workspaces in one ATS.",
    };
  }

  // 🔹 Tenant host (slug.thinkats.com)
  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlugFromHost },
    select: {
      id: true,
      name: true,
    },
  });

  const settings = tenant
    ? await prisma.careerSiteSettings.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const tenantName = tenant?.name ?? tenantSlugFromHost;

  return {
    isPrimaryHost: false,
    tenantSlug: tenantSlugFromHost,
    tenantName,
    logoUrl: settings?.logoUrl ?? null,
    primaryColor: settings?.primaryColorHex ?? "#172965",
    accentColor: settings?.accentColorHex ?? "#FFC000",
    tagline: `${tenantName.toUpperCase()} · LOGIN`,
    heading: `Log in to ${tenantName} hiring workspace`,
    subheading:
      "Admins and hiring managers can access their ATS dashboard here. Candidates should use the careers and jobs pages.",
  };
}

export default async function LoginPage() {
  const brand = await getBrandConfigForRequest();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
          Loading login…
        </div>
      }
    >
      <LoginPageClient brand={brand} />
    </Suspense>
  );
}
