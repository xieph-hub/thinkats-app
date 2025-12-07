// app/ats/tenants/[tenantId]/careersite/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tenant career site | ThinkATS",
  description:
    "Configure how this tenant's public careers page looks and whether its jobs appear in Jobs on ThinkATS.",
};

type PageProps = {
  params: { tenantId: string };
  searchParams?: {
    updated?: string;
    error?: string;
  };
};

function normaliseStatus(status: string | null | undefined): string {
  return (status || "").toLowerCase();
}

// 🔹 NEW: derive base domain from NEXT_PUBLIC_SITE_URL
function getBaseDomainFromEnv(): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkats.com";
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return "thinkats.com";
  }
}

export default async function TenantCareerSitePage({
  params,
  searchParams,
}: PageProps) {
  const tenantId = params.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  const settings = await prisma.careerSiteSettings.findFirst({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });

  // 🔹 NEW: canonical careers URL on tenant subdomain
  const baseDomain = getBaseDomainFromEnv();
  const careersUrl = tenant.slug
    ? `https://${tenant.slug}.${baseDomain}/careers`
    : null;

  const tenantStatus = normaliseStatus(tenant.status);
  const isActive = tenantStatus === "active";

  const isPublic = settings?.isPublic ?? true;
  const includeInMarketplace = settings?.includeInMarketplace ?? false;

  const primaryColor = settings?.primaryColorHex || "#172965"; // deep blue
  const accentColor = settings?.accentColorHex || "#FFC000"; // yellow
  const heroBackground = settings?.heroBackgroundHex || "#F9FAFB"; // soft grey

  const logoUrl = settings?.logoUrl || null;

  // Banners from API redirect query params
  const updated = searchParams?.updated === "1";
  const errorCode = searchParams?.error;

  let errorMessage: string | null = null;
  if (errorCode === "tenant_not_found") {
    errorMessage = "Tenant not found. Please refresh and try again.";
  } else if (errorCode === "save_failed") {
    errorMessage =
      "Something went wrong while saving careersite settings. Please try again.";
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 lg:px-0">
      {/* Page header */}
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          ATS · Tenant settings
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Career site for {tenant.name || "Tenant"}
        </h1>
        <p className="text-xs text-slate-600">
          Control how this tenant&apos;s public careers page looks and whether
          its jobs appear in{" "}
          <span className="font-medium">Jobs on ThinkATS</span>.
        </p>
      </header>

      {/* Alerts */}
      {updated && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
          Career site settings updated successfully.
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Public URLs & visibility */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Public URLs & visibility
            </p>
            <p className="mt-1 text-xs text-slate-600">
              This tenant&apos;s jobs can show up in two places:
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          {/* Careers site row */}
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-slate-700">
                Branded careers site
              </p>
              <p className="text-[11px] text-slate-500">
                Public page with this tenant&apos;s logo, copy and job listing.
                This is the link they can share with candidates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {careersUrl ? (
                <a
                  href={careersUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-[#172965] hover:bg-slate-100"
                >
                  {careersUrl}
                  <span className="ml-1 text-[10px] opacity-70">↗</span>
                </a>
              ) : (
                <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
                  No slug configured yet
                </span>
              )}
            </div>
          </div>

          {/* Jobs on ThinkATS explanation */}
          <div className="flex flex-col items-start justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] sm:flex-row sm:items-center">
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium text-slate-700">
                Jobs on ThinkATS (global marketplace)
              </p>
              <p className="text-[11px] text-slate-500">
                When{" "}
                <span className="font-medium">
                  &quot;Show this tenant&apos;s jobs in Jobs on ThinkATS&quot;
                </span>{" "}
                is on, eligible roles are surfaced in the global listing at{" "}
                <code className="rounded bg-slate-50 px-1.5 py-0.5">
                  /jobs
                </code>
                .
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-medium ${
                includeInMarketplace
                  ? "bg-[#E9F7EE] text-[#306B34] border border-[#C5E7CF]"
                  : "bg-slate-50 text-slate-500 border border-slate-200"
              }`}
            >
              Jobs on ThinkATS:{" "}
              <span className="ml-1 font-semibold">
                {includeInMarketplace ? "Included" : "Hidden"}
              </span>
            </span>
          </div>

          {/* Tenant status chip */}
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-[11px] text-slate-500">Tenant status:</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                isActive
                  ? "bg-[#E9F7EE] text-[#306B34] border border-[#C5E7CF]"
                  : "bg-slate-50 text-slate-500 border border-slate-200"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>

            <span className="ml-auto flex items-center gap-2 text-[10px] text-slate-400">
              <span
                className="inline-block h-3 w-3 rounded-full border border-slate-200"
                style={{ backgroundColor: heroBackground }}
              />
              <span>Hero background preview</span>
            </span>
          </div>
        </div>
      </section>

      {/* Branding & content form */}
      <form
        method="POST"
        action={`/api/ats/tenants/${tenantId}/careersite`}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        {/* ...rest of your form stays exactly as you pasted... */}
        {/* (I didn't change anything below this comment) */}

        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Branding & content
          </p>
          <p className="text-xs text-slate-600">
            Update the headline, brand colours and about section that candidates
            see on the public careers page.
          </p>
        </div>

        {/* (keep your existing form body exactly as-is) */}
        {/* ... */}
      </form>
    </div>
  );
}
