// app/login/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Login | ThinkATS",
  description:
    "Log in to access your hiring workspace, roles, candidates and pipelines.",
};

type LoginBrandConfig = {
  context: "primary" | "tenant";
  pillLabel: string;
  heading: string;
  description: string;
  tenantName: string | null;
  tenantSlug: string | null;
};

async function getBrandConfigForRequest(): Promise<LoginBrandConfig> {
  const { isPrimaryHost, tenantSlugFromHost } = getHostContext();

  // 🔹 Primary host – global ThinkATS admin login
  if (isPrimaryHost || !tenantSlugFromHost) {
    return {
      context: "primary",
      pillLabel: "THINKATS · ADMIN LOGIN",
      heading: "Log in to your ThinkATS workspace",
      description:
        "Access roles, candidates, hiring pipelines and client workspaces in one ATS built for recruitment teams and agencies.",
      tenantName: null,
      tenantSlug: null,
    };
  }

  // 🔹 Tenant subdomain – client hiring workspace login
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlugFromHost },
    select: {
      name: true,
      slug: true,
    },
  });

  const tenantName =
    tenant?.name || tenant?.slug || tenantSlugFromHost || "Your organisation";

  return {
    context: "tenant",
    pillLabel: `${tenantName} · Hiring workspace`,
    heading: `Log in to ${tenantName}'s hiring workspace`,
    description:
      "Access roles, candidates and pipelines for this organisation. Only authorised admins and recruiters can log in here.",
    tenantName,
    tenantSlug: tenant?.slug ?? tenantSlugFromHost,
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
