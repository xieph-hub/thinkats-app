// app/careers/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import CareersShell from "@/components/careers/CareersShell";
import CareersPageRenderer from "@/components/careers/CareersPageRenderer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers | ThinkATS",
  description:
    "Explore roles hosted by ThinkATS clients, with white-label careers sites on dedicated subdomains.",
};

async function getPublicJobsForCareersSite(args: {
  tenantId: string;
  clientCompanyId?: string | null;
}) {
  const where: any = {
    tenantId: args.tenantId,
    status: "open",
    visibility: "public",
    OR: [{ internalOnly: false }, { internalOnly: null }],
  };

  if (args.clientCompanyId) {
    where.clientCompanyId = args.clientCompanyId;
  }

  return prisma.job.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      clientCompany: true,
    },
  });
}

function normaliseWebsiteUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // If already absolute (http/https), just return
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Otherwise, treat it as a bare domain and make it https://
  return `https://${trimmed}`;
}

export default async function CareersPage() {
  const hostContext = await getHostContext();
  const {
    isAppHost,
    isCareersiteHost,
    tenant,
    clientCompany,
    careerSiteSettings,
    host,
    baseDomain,
  } = hostContext as any;

  // 1) Careersite-ish host but no tenant or client resolved → soft "not configured"
  if (isCareersiteHost && !tenant && !clientCompany) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <h1 className="text-lg font-semibold">
            This careers site isn&apos;t configured yet
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            We couldn&apos;t find a live careers configuration for{" "}
            <span className="font-mono text-slate-200">{host}</span>. If you
            expected to see open roles here, please contact ThinkATS support.
          </p>
        </div>
      </main>
    );
  }

  // 2) Main app host with no tenant → global entry point / marketplace shell
  if (!tenant && isAppHost) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Careers powered by ThinkATS
            </h1>
            <p className="text-sm text-slate-400">
              This is the global careers entry point for roles managed on
              ThinkATS. Individual client careers sites live on their own
              subdomains, for example{" "}
              <span className="font-mono text-sky-400">
                acme.thinkats.com/careers
              </span>
              .
            </p>
          </header>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
            <p>
              You can turn this page into a marketplace of featured roles later
              – for now, the primary experience is each client&apos;s own
              careers microsite on a dedicated host.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // 3) Tenant / client careersite host (subdomain or custom domain), or app host with a tenant resolved
  if (!tenant) {
    // If we somehow have no tenant at this point but also not an app host,
    // just reuse the soft "not configured" view.
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <h1 className="text-lg font-semibold">Careers site not available</h1>
          <p className="mt-3 text-sm text-slate-400">
            We couldn&apos;t resolve a careers configuration for this host. If
            you expected to see open roles here, please contact ThinkATS
            support.
          </p>
        </div>
      </main>
    );
  }

  const displayName =
    clientCompany?.name || tenant.name || tenant.slug || host;

  const logoUrl =
    (careerSiteSettings as any)?.logoUrl ||
    clientCompany?.logoUrl ||
    tenant.logoUrl ||
    null;

  // Theme + layout from dedicated tables
  const [theme, page, jobs] = await Promise.all([
    prisma.careerTheme.findFirst({
      where: {
        tenantId: tenant.id,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.careerPage.findFirst({
      where: {
        tenantId: tenant.id,
        clientCompanyId: clientCompany?.id ?? null,
        slug: "careers-home",
        isPublished: true, // <-- use the actual field on CareerPage
      },
      orderBy: { updatedAt: "desc" },
    }),
    getPublicJobsForCareersSite({
      tenantId: tenant.id,
      clientCompanyId: clientCompany?.id ?? null,
    }),
  ]);

  const themeAny = theme as any;
  const settingsAny = careerSiteSettings as any;

  const primaryColor =
    themeAny?.primaryColorHex ||
    settingsAny?.primaryColorHex ||
    settingsAny?.primaryColor ||
    "#172965";

  const accentColor =
    themeAny?.accentColorHex ||
    settingsAny?.accentColorHex ||
    settingsAny?.accentColor ||
    "#0ea5e9";

  const heroBackground =
    themeAny?.heroBackgroundHex ||
    settingsAny?.heroBackgroundHex ||
    "#F9FAFB";

  const planTier = (tenant.planTier || "STARTER").toUpperCase();

  const websiteRaw = (clientCompany as any)?.website || tenant.websiteUrl || null;
  const websiteUrl = normaliseWebsiteUrl(websiteRaw);

  const assetBaseUrl =
    process.env.NEXT_PUBLIC_CAREERS_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    null;

  return (
    <CareersShell
      displayName={displayName}
      logoUrl={logoUrl}
      host={host}
      baseDomain={baseDomain}
      planTier={planTier}
      primaryColor={primaryColor}
      accentColor={accentColor}
      heroBackground={heroBackground}
      websiteUrl={websiteUrl}
      activeNav="careers"
    >
      <CareersPageRenderer
        displayName={displayName}
        settings={careerSiteSettings}
        theme={theme}
        layout={(page?.layout as any) ?? null}
        jobs={jobs}
        primaryColor={primaryColor}
        accentColor={accentColor}
        assetBaseUrl={assetBaseUrl}
      />
    </CareersShell>
  );
}
