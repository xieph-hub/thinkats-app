// app/careers/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import CareersSitePage from "@/components/careers/CareersSitePage";

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
  });
}

export default async function CareersPage() {
  const hostCtx = await getHostContext();
  const {
    isAppHost,
    isCareersiteHost,
    tenant,
    clientCompany,
    careerSiteSettings,
    host,
    baseDomain,
  } = hostCtx;

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

  // 2) Tenant / client careersite host (subdomain or custom domain)
  if (tenant && (isCareersiteHost || !isAppHost)) {
    const displayName =
      clientCompany?.name || tenant.name || tenant.slug || host;

    const logoUrl =
      (careerSiteSettings as any)?.logoUrl ||
      clientCompany?.logoUrl ||
      tenant.logoUrl ||
      null;

    const primaryColor =
      (careerSiteSettings as any)?.primaryColorHex || "#172965";
    const accentColor =
      (careerSiteSettings as any)?.accentColorHex || "#0ea5e9";
    const heroBackground =
      (careerSiteSettings as any)?.heroBackgroundHex || "#F9FAFB";

    // Plan + domain based “Powered by ThinkATS”
    const isUnderMainDomain =
      host === baseDomain || host.endsWith(`.${baseDomain}`);
    const planTier = (tenant.planTier || "").toUpperCase();
    const isEnterprisePlan = planTier === "ENTERPRISE";
    const canRemoveBranding = isEnterprisePlan && !isUnderMainDomain;
    const showPoweredBy = !canRemoveBranding;

    const jobs = await getPublicJobsForCareersSite({
      tenantId: tenant.id,
      clientCompanyId: clientCompany?.id ?? null,
    });

    return (
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-10 lg:py-16">
          <div
            className="overflow-hidden rounded-3xl border bg-white shadow-xl"
            style={{
              borderColor: primaryColor,
              boxShadow: "0 22px 60px rgba(15,23,42,0.16)",
            }}
          >
            {/* Top bar: logo + tenant mini-nav */}
            <div
              className="flex flex-col gap-4 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              style={{ background: heroBackground }}
            >
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                    <img
                      src={logoUrl}
                      alt={displayName}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-slate-500">Careers</p>
                </div>
              </div>

              {/* Tenant mini-nav (no ThinkATS marketing nav here) */}
              <nav className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
                <a href="/careers" className="hover:text-slate-900">
                  Careers home
                </a>
                <a href="/jobs" className="hover:text-slate-900">
                  Open roles
                </a>
                {tenant.websiteUrl && (
                  <a
                    href={tenant.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-slate-900"
                  >
                    Company site
                  </a>
                )}
                <a
                  href="/login"
                  className="rounded-full border px-3 py-1 text-[11px] font-semibold"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  Admin login
                </a>
              </nav>
            </div>

            {/* Main careers microsite content */}
            <div className="px-6 py-7 lg:px-8 lg:py-9">
              <CareersSitePage
                tenant={tenant}
                clientCompany={clientCompany}
                settings={careerSiteSettings}
                jobs={jobs}
              />

              {showPoweredBy && (
                <footer className="mt-6 border-t border-slate-200 pt-3 text-[10px] text-slate-400">
                  Powered by{" "}
                  <span className="font-medium text-slate-500">
                    ThinkATS
                  </span>
                  .
                </footer>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 3) Main app host (thinkats.com/careers) – simple global entry point
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
            You can turn this page into a marketplace of featured roles
            later – for now, the primary experience is each client&apos;s
            own careers microsite on a dedicated host.
          </p>
        </div>
      </div>
    </main>
  );
}
