// app/ats/settings/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getResourcinTenant } from "@/lib/tenant";
import { getServerUser } from "@/lib/auth/getServerUser";
import ScoringSettingsCard from "@/components/ats/settings/ScoringSettingsCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Settings",
  description:
    "Configure your ATS workspace, notifications, security and data.",
};

const PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter",
  GROWTH: "Growth",
  AGENCY: "Agency (multi-tenant)",
  ENTERPRISE: "Enterprise",
};

const PLAN_FEATURE_BLURB: Record<string, string> = {
  STARTER:
    "Core ATS: jobs, candidates, applications and basic pipelines for a single workspace.",
  GROWTH:
    "Adds multi-tenant readiness, richer careers sites and scoring controls for growing teams.",
  AGENCY:
    "Designed for agencies: multiple client workspaces, shared pipelines and marketplace-ready jobs.",
  ENTERPRISE:
    "Everything in Agency, plus SSO, higher seat limits and custom controls for larger organisations.",
};

type SettingsSearchParams = {
  updated?: string;
  error?: string;
};

export default async function AtsSettingsPage({
  searchParams,
}: {
  searchParams?: SettingsSearchParams;
}) {
  const updatedSection = searchParams?.updated;
  const errorMessage = searchParams?.error;

  const { isSuperAdmin } = await getServerUser();
  const tenant = await getResourcinTenant();

  if (!tenant) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900">
          Settings unavailable
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No default workspace tenant is configured. Check{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_ID
          </code>{" "}
          or{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
            RESOURCIN_TENANT_SLUG
          </code>{" "}
          in your environment before using ATS settings.
        </p>
      </div>
    );
  }

  const anyTenant = tenant as any;

  const [careerSettings, totalWorkspaces, allTenantsForBilling] =
    await Promise.all([
      prisma.careerSiteSettings.findFirst({
        where: { tenantId: tenant.id },
      }),
      prisma.tenant.count(),
      isSuperAdmin
        ? prisma.tenant.findMany({
            orderBy: { name: "asc" },
          })
        : Promise.resolve([]),
    ]);

  const defaultTimezone: string =
    anyTenant.defaultTimezone || "Africa/Lagos";
  const defaultCurrency: string = anyTenant.defaultCurrency || "USD";

  const planTier: string = (anyTenant.planTier as string) || "GROWTH";
  const planLabel =
    PLAN_LABELS[planTier] ||
    anyTenant.planName ||
    anyTenant.plan ||
    "Growth";

  const planBlurb =
    PLAN_FEATURE_BLURB[planTier] ||
    "Core ATS with multi-tenant agency features as you grow.";

  const seats: number | null =
    typeof anyTenant.seats === "number" ? anyTenant.seats : null;
  const maxSeats: number | null =
    typeof anyTenant.maxSeats === "number" ? anyTenant.maxSeats : null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const tenantSlug: string = anyTenant.slug || tenant.id;
  const careersPath = `/careers/${encodeURIComponent(tenantSlug)}`;
  const careersUrl = baseUrl ? `${baseUrl}${careersPath}` : careersPath;

  const isCareersPublic = careerSettings?.isPublic ?? true;
  const includeInMarketplace =
    (careerSettings as any)?.includeInMarketplace ?? false;

  const workspaceName = tenant.name || "ATS workspace";

  // ... ⬇️ keep the rest of your existing JSX exactly as you pasted before
  // (no other behavioural changes needed – only the membership restriction is gone)
}
