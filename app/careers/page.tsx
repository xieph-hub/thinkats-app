// app/careers/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Branded careers pages for employers powered by ThinkATS.",
};

// Normalise base domain from NEXT_PUBLIC_SITE_URL, stripping leading "www."
function getBaseDomainFromEnv(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkats.com";
  try {
    const host = new URL(siteUrl).hostname; // e.g. "thinkats.com" or "www.thinkats.com"
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return "thinkats.com";
  }
}

type TenantWithSettings = {
  id: string;
  name: string | null;
  slug: string | null;
  status: string | null;
  settings: {
    heroTitle: string | null;
    heroSubtitle: string | null;
    primaryColorHex: string | null;
    accentColorHex: string | null;
    heroBackgroundHex: string | null;
    logoUrl: string | null;
    aboutHtml: string | null;
    isPublic: boolean | null;
  } | null;
};

async function resolveTenantForHost(): Promise<{
  host: string;
  baseDomain: string;
  tenant: TenantWithSettings | null;
}> {
  const hdrs = headers();
  const host =
    hdrs.get("host") ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ??
    "thinkats.com";

  const baseDomain = getBaseDomainFromEnv();

  const hostLower = host.toLowerCase();
  const baseLower = baseDomain.toLowerCase();
  const wwwBaseLower = `www.${baseLower}`;

  // If we're on the apex (thinkats.com / www.thinkats.com), we don't have a tenant slug.
  if (hostLower === baseLower || hostLower === wwwBaseLower) {
    return { host, baseDomain, tenant: null };
  }

  // If host ends with ".thinkats.com", assume "<slug>.thinkats.com"
  let tenantSlug: string | null = null;
  if (hostLower.endsWith(`.${baseLower}`)) {
    tenantSlug = hostLower.slice(0, hostLower.length - baseLower.length - 1); // strip ".thinkats.com"
  }

  if (!tenantSlug) {
    return { host, baseDomain, tenant: null };
  }

  const tenantRow = await prisma.tenant.findFirst({
    where: { slug: tenantSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  });

  if (!tenantRow) {
    return { host, baseDomain, tenant: null };
  }

  const settings = await prisma.careerSiteSettings.findFirst({
    where: { tenantId: tenantRow.id },
    orderBy: { createdAt: "asc" },
    select: {
      heroTitle: true,
      heroSubtitle: true,
      primaryColorHex: true,
      accentColorHex: true,
      heroBackgroundHex: true,
      logoUrl: true,
      aboutHtml: true,
      isPublic: true,
      includeInMarketplace: true, // not strictly needed for this page yet
    },
  });

  return {
    host,
    baseDomain,
    tenant: {
      id: tenantRow.id,
      name: tenantRow.name,
      slug: tenantRow.slug,
      status: tenantRow.status,
      settings: settings
        ? {
            heroTitle: settings.heroTitle,
            heroSubtitle: settings.heroSubtitle,
            primaryColorHex: settings.primaryColorHex,
            accentColorHex: settings.accentColorHex,
            heroBackgroundHex: settings.heroBackgroundHex,
            logoUrl: settings.logoUrl,
            aboutHtml: settings.aboutHtml,
            isPublic: settings.isPublic,
          }
        : null,
    },
  };
}

export default async function CareersPage() {
  const { host, baseDomain, tenant } = await resolveTenantForHost();

  // If we're on apex host (thinkats.com) with no tenant context,
  // show a simple explainer instead of 404.
  if (!tenant) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            ThinkATS · Careers
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            Careers pages powered by ThinkATS
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            This URL is meant to serve employer-branded careers pages on
            subdomains like{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">
              yourcompany.{baseDomain}/careers
            </code>
            .
          </p>
          <p className="mt-3 text-sm text-slate-600">
            If you followed a link that should point to a specific employer&apos;s
            careers page, please contact{" "}
            <span className="font-medium">ThinkATS support</span> so we can help
            you find the right link.
          </p>

          <div className="mt-6">
            <Link
              href="/jobs"
              className="inline-flex items-center rounded-full bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#121f4f]"
            >
              View open roles on ThinkATS
            </Link>
          </div>

          <p className="mt-6 text-[11px] text-slate-400">
            Host: <code>{host}</code> · Base domain detected:{" "}
            <code>{baseDomain}</code>
          </p>
        </div>
      </main>
    );
  }

  const { id: tenantId, name, slug, status, settings } = tenant;

  const isActive = (status || "").toLowerCase() === "active";
  const isPublic = settings?.isPublic ?? true;

  const heroTitle =
    settings?.heroTitle ||
    `Careers at ${name || slug || "this organisation"}`;
  const heroSubtitle =
    settings?.heroSubtitle ||
    "Explore open roles and join a team building meaningful work.";
  const primaryColor = settings?.primaryColorHex || "#172965";
  const accentColor = settings?.accentColorHex || "#FFC000";
  const heroBackground = settings?.heroBackgroundHex || "#F5F6FA";
  const logoUrl = settings?.logoUrl || null;

  // If tenant is inactive or careers not public, keep it dark but don't 404.
  if (!isActive || !isPublic) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {name || slug || "Employer"} · Careers
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            Careers page not currently public
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            This employer&apos;s careers page is not currently available. They
            may be hiring privately or have paused recruitment.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            If you received this link from a recruiter, please reach out to
            them or to <span className="font-medium">ThinkATS support</span> for
            an updated link.
          </p>
        </div>
      </main>
    );
  }

  // Load jobs for this tenant (simple filter: tenantId + isPublished)
  const jobs = await prisma.job.findMany({
    where: {
      tenantId,
      isPublished: true,
    },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      slug: true,
      title: true,
      location: true,
      employmentType: true,
      seniority: true,
      summary: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Hero */}
      <section
        className="border-b border-slate-200"
        style={{ backgroundColor: heroBackground }}
      >
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={`${name || slug || "Employer"} logo`}
                    className="h-full w-full object-contain p-1.5"
                  />
                ) : (
                  <span
                    className="text-lg font-semibold"
                    style={{ color: primaryColor }}
                  >
                    {(name || slug || "T").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: accentColor }}
                >
                  Careers
                </p>
                <h1
                  className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
                  style={{ color: primaryColor }}
                >
                  {heroTitle}
                </h1>
                <p className="mt-2 max-w-xl text-sm text-slate-700">
                  {heroSubtitle}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col items-start gap-2 text-[11px] text-slate-500 md:items-end">
              <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                Powered by ThinkATS
              </span>
              <span>
                Host: <code>{host}</code>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
          {/* Jobs list */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Open roles
            </h2>

            {jobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
                No open roles are currently listed for this employer. Check back
                later or follow them on LinkedIn to hear about future
                opportunities.
              </div>
            ) : (
              <ul className="space-y-3">
                {jobs.map((job) => {
                  const jobPath = job.slug
                    ? `/jobs/${encodeURIComponent(job.slug)}`
                    : `/jobs/${job.id}`;

                  return (
                    <li
                      key={job.id}
                      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >
                      <Link href={jobPath} className="block">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-[#172965]">
                              {job.title}
                            </h3>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {job.location || "Location flexible"}
                              {job.seniority
                                ? ` • ${job.seniority.toString()}`
                                : ""}
                              {job.employmentType
                                ? ` • ${job.employmentType.toString()}`
                                : ""}
                            </p>
                            {job.summary && (
                              <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                                {job.summary}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white group-hover:bg-[#172965]">
                            View role
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* About / sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <h2 className="text-sm font-semibold text-slate-900">
                About the organisation
              </h2>
              {settings?.aboutHtml ? (
                <div
                  className="prose prose-sm mt-2 max-w-none text-slate-700 prose-p:mb-2 prose-p:mt-0"
                  dangerouslySetInnerHTML={{
                    __html: settings.aboutHtml,
                  }}
                />
              ) : (
                <p className="mt-2 text-xs text-slate-600">
                  This employer hasn&apos;t added an about section yet. Once
                  they do, you&apos;ll see more about their mission, culture and
                  team here.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
