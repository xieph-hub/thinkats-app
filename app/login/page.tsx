// app/login/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/tenantHost";
import LoginPageClient from "./LoginPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login | ThinkATS",
  description:
    "Login to access your ATS workspace, roles, candidates and pipelines.",
};

type LoginBrandConfig = {
  mode: "tenant" | "multi";
  tenantName?: string | null;
  tenantSlug?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  accentColor: string;
};

function normaliseHex(input: string | null | undefined, fallback: string) {
  if (!input) return fallback;
  const trimmed = input.trim();
  if (!trimmed) return fallback;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

async function getBrandConfigForRequest(): Promise<LoginBrandConfig> {
  const { tenantSlugFromHost, isPrimary } = getHostContext();

  // If we're on a tenant subdomain (e.g. acme.thinkats.com),
  // try to load that tenant + its careersite settings.
  if (tenantSlugFromHost && !isPrimary) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlugFromHost },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        status: true,
      },
    });

    if (tenant && tenant.status === "active") {
      const settings = await prisma.careerSiteSettings.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
      });

      const primaryColor = normaliseHex(
        (settings as any)?.primaryColorHex ?? null,
        "#172965", // deep blue fallback
      );

      const accentColor = normaliseHex(
        (settings as any)?.accentColorHex ?? null,
        "#FFC000", // yellow fallback
      );

      const logoUrl =
        (settings as any)?.logoUrl ??
        (tenant.logoUrl as string | null) ??
        null;

      return {
        mode: "tenant",
        tenantName: tenant.name || tenant.slug,
        tenantSlug: tenant.slug,
        logoUrl,
        primaryColor,
        accentColor,
      };
    }
  }

  // Fallback: generic ThinkATS login (main domain or tenant not found)
  return {
    mode: "multi",
    tenantName: null,
    tenantSlug: null,
    logoUrl: null,
    primaryColor: "#172965",
    accentColor: "#FFC000",
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
