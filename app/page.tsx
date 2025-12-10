// app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import CareersShell from "@/components/careers/CareersShell";
import CareersPageRenderer from "@/components/careers/CareersPageRenderer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS | Multi-tenant ATS & hiring hubs",
  description:
    "Build modern hiring hubs for every client: shared ATS workspace, white-label career sites and structured pipelines.",
};

type PublicJobsArgs = {
  tenantId: string;
  clientCompanyId?: string | null;
};

async function getPublicJobsForCareersSite({
  tenantId,
  clientCompanyId,
}: PublicJobsArgs) {
  const where: any = {
    tenantId,
    status: "open",
    visibility: "public",
    OR: [{ internalOnly: false }, { internalOnly: null }],
  };

  if (clientCompanyId) {
    where.clientCompanyId = clientCompanyId;
  }

  return prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      clientCompany: true,
    },
  });
}

function normaliseWebsiteUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export default async function RootPage() {
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

  // 1) Careersite-ish host but no tenant/client → soft "not configured"
  if (isCareersiteHost && !tenant && !clientCompany) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <h1 className="text-lg font-semibold">
            This hub isn&apos;t configured yet
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            We couldn&apos;t find a live hiring hub for{" "}
            <span className="font-mono text-slate-200">{host}</span>. If you
            expected to see open roles here, please contact ThinkATS support.
          </p>
        </div>
      </main>
    );
  }

  // 2) Tenant / client host → tenant hub at https://slug.thinkats.com
  if (tenant) {
    const displayName =
      clientCompany?.name || tenant.name || tenant.slug || host;

    const logoUrl =
      (careerSiteSettings as any)?.logoUrl ||
      clientCompany?.logoUrl ||
      tenant.logoUrl ||
      null;

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
          slug: "careers-home",
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
      themeAny?.tokens?.colors?.primary ||
      settingsAny?.primaryColorHex ||
      settingsAny?.primaryColor ||
      "#172965";

    const accentColor =
      themeAny?.tokens?.colors?.accent ||
      settingsAny?.accentColorHex ||
      settingsAny?.accentColor ||
      "#0ea5e9";

    const heroBackground =
      themeAny?.tokens?.colors?.heroBackground ||
      settingsAny?.heroBackgroundHex ||
      "#F9FAFB";

    const planTier = (tenant.planTier || "STARTER").toUpperCase();

    const websiteRaw =
      (clientCompany as any)?.website || tenant.websiteUrl || null;
    const websiteUrl = normaliseWebsiteUrl(websiteRaw);

    const linkedinUrl = settingsAny?.linkedinUrl ?? null;
    const twitterUrl = settingsAny?.twitterUrl ?? null;
    const instagramUrl = settingsAny?.instagramUrl ?? null;

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
        linkedinUrl={linkedinUrl}
        twitterUrl={twitterUrl}
        instagramUrl={instagramUrl}
        activeNav="home"
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

  // 3) App host / default → ThinkATS marketing homepage
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        {/* Hero */}
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Multi-tenant ATS · client hubs · white-label careers
          </div>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Build a hiring hub for every client.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-slate-300">
              ThinkATS gives you shared ATS workspaces, branded hubs on{" "}
              <span className="font-mono text-sky-400">
                slug.thinkats.com
              </span>{" "}
              and structured pipelines for jobs, candidates and interviews.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center rounded-full bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-950 hover:bg-slate-200"
            >
              Login to ATS
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-[11px] font-semibold text-slate-100 hover:border-slate-500"
            >
              Talk to us
            </Link>
          </div>
        </section>

        {/* Pillars */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Shared ATS
            </p>
            <p className="mt-2 text-sm font-medium text-slate-50">
              One workspace for all clients
            </p>
            <p className="mt-2">
              Centralise jobs, candidates, interview notes and email in one
              multi-tenant ATS built for agencies and HR teams.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Client hubs
            </p>
            <p className="mt-2 text-sm font-medium text-slate-50">
              Branded hiring hubs per client
            </p>
            <p className="mt-2">
              Give every client a hub on{" "}
              <span className="font-mono text-[11px] text-sky-400">
                slug.thinkats.com
              </span>{" "}
              with jobs, story and candidate experience tailored to them.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Careers & jobs
            </p>
            <p className="mt-2 text-sm font-medium text-slate-50">
              Jobs marketplace when you&apos;re ready
            </p>
            <p className="mt-2">
              Start with client hubs first, then fan out into a group-wide
              marketplace to surface roles across all tenants.
            </p>
          </div>
        </section>

        {/* Explainer */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-300">
          <p className="font-medium text-slate-100">
            How URLs behave once everything is wired:
          </p>
          <ul className="mt-2 space-y-1.5 list-disc pl-5">
            <li>
              <span className="font-mono text-sky-400">
                slug.thinkats.com
              </span>{" "}
              – client hub home (sidebar, overview, jobs entry).
            </li>
            <li>
              <span className="font-mono text-sky-400">
                slug.thinkats.com/jobs
              </span>{" "}
              – jobs listing for that tenant.
            </li>
            <li>
              <span className="font-mono text-sky-400">
                www.thinkats.com
              </span>{" "}
              – your own product & marketing site.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
