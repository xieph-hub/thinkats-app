// app/login/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import LoginPageClient from "./LoginPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login | ThinkATS",
  description:
    "Secure login to ATS workspaces for hiring teams and agencies.",
};

export type LoginBrandConfig = {
  brandName: string;
  headline: string;
  subcopy: string;
  badgeLabel: string;
  primaryColorHex: string;
  accentColorHex: string;
  logoUrl: string | null;
  isPrimaryHost: boolean;
};

async function getBrandConfigForRequest(): Promise<LoginBrandConfig> {
  // ✅ use the correct property name from getHostContext()
  const { tenantSlugFromHost, isPrimaryHost } = getHostContext();

  // If we're on a tenant subdomain (e.g. resourcin.thinkats.com),
  // try to load that tenant + its careersite settings for branding.
  if (!isPrimaryHost && tenantSlugFromHost) {
    const tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlugFromHost },
      select: {
        name: true,
        slug: true,
        logoUrl: true,
        careerSiteSettings: {
          select: {
            primaryColorHex: true,
            accentColorHex: true,
            heroTitle: true,
          },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (tenant) {
      const settings = tenant.careerSiteSettings[0] || null;
      const brandName = tenant.name || tenantSlugFromHost || "Client";

      return {
        brandName,
        headline:
          settings?.heroTitle || `Log in to ${brandName} ATS workspace`,
        subcopy:
          "Sign in to manage roles, candidates and hiring pipelines for your organisation.",
        badgeLabel: `${brandName} ATS`,
        primaryColorHex: settings?.primaryColorHex || "#172965",
        accentColorHex: settings?.accentColorHex || "#FFC000",
        logoUrl: tenant.logoUrl || null,
        isPrimaryHost: false,
      };
    }
  }

  // Fallback: primary host (thinkats.com / www.thinkats.com) → platform login
  return {
    brandName: "ThinkATS",
    headline: "Log in to your ThinkATS workspace",
    subcopy:
      "Sign in to manage roles, candidates and hiring pipelines across all your clients.",
    badgeLabel: "ThinkATS",
    primaryColorHex: "#172965",
    accentColorHex: "#FFC000",
    logoUrl: null,
    isPrimaryHost: true,
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
