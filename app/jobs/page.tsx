// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import CareersShell from "@/components/careers/CareersShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs | ThinkATS",
  description:
    "Browse open roles hosted by ThinkATS tenants, from a tenant-branded careers site or the global marketplace.",
};

type SearchParams = {
  q?: string | string[];
  location?: string | string[];
  department?: string | string[];
  workMode?: string | string[];
  tenantSlug?: string | string[];
};

function asStringParam(
  value: string | string[] | undefined,
  fallback = "",
): string {
  if (!value) return fallback;
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value;
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

function formatDate(date: Date | string): string {
  try {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

async function getTenantJobs(args: {
  tenantId: string;
  clientCompanyId?: string | null;
  searchParams?: SearchParams;
}) {
  const { tenantId, clientCompanyId, searchParams } = args;

  const q = asStringParam(searchParams?.q);
  const location = asStringParam(searchParams?.location);
  const department = asStringParam(searchParams?.department);
  const workMode = asStringParam(searchParams?.workMode);

  const where: any = {
    tenantId,
    status: "open",
    visibility: "public",
    OR: [{ internalOnly: false }, { internalOnly: null }],
  };

  if (clientCompanyId) {
    where.clientCompanyId = clientCompanyId;
  }

  if (q) {
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
          { overview: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }

  if (department) {
    where.department = { contains: department, mode: "insensitive" };
  }

  if (workMode) {
    where.workMode = workMode;
  }

  return prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

async function getMarketplaceJobs(searchParams?: SearchParams) {
  const q = asStringParam(searchParams?.q);
  const location = asStringParam(searchParams?.location);
  const department = asStringParam(searchParams?.department);
  const workMode = asStringParam(searchParams?.workMode);

  const where: any = {
    status: "open",
    visibility: "public",
    OR: [{ internalOnly: false }, { internalOnly: null }],
    tenant: {
      careerSiteSettings: {
        some: {
          isPublic: true,
          includeInMarketplace: true,
        },
      },
    },
  };

  if (q) {
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
          { overview: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }

  if (department) {
    where.department = { contains: department, mode: "insensitive" };
  }

  if (workMode) {
    where.workMode = workMode;
  }

  return prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      tenant: true,
      clientCompany: true,
    },
  });
}

function TenantJobsList(props: {
  jobs: any[];
  displayName: string;
  accentColor: string;
  q: string;
  location: string;
}) {
  const { jobs, displayName, accentColor, q, location } = props;
  const hasJobs = jobs.length > 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Open roles at {displayName}
          </h1>
          <p className="text-xs text-slate-500">
            Browse currently open opportunities and apply in a few clicks.
          </p>
        </div>

        {(q || location) && (
          <div className="rounded-full bg-slate-50 px-3 py-1 text-[10px] text-slate-500">
            Filters:
            {q && (
              <span className="ml-1">
                <span className="font-medium">Search</span> “{q}”
              </span>
            )}
            {location && (
              <span className="ml-1">
                <span className="font-medium">Location</span> “{location}”
              </span>
            )}
          </div>
        )}
      </header>

      {!hasJobs ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
          There are no live openings right now. Please check back soon or follow{" "}
          {displayName} on their channels for updates.
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const slugOrId = job.slug || job.id;

            return (
              <article
                key={job.id}
                className="group flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 transition hover:border-slate-200 hover:bg-white"
              >
                <div className="flex-1 space-y-1.5">
                  <h2 className="text-sm font-semibold text-slate-900 group-hover:underline">
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <a href={`/jobs/${slugOrId}`}>{job.title}</a>
                  </h2>

                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                    {job.location && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {job.location}
                      </span>
                    )}
                    {job.department && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {job.department}
                      </span>
                    )}
                    {job.employmentType && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {job.employmentType}
                      </span>
                    )}
                    {job.experienceLevel && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {job.experienceLevel}
                      </span>
                    )}
                  </div>

                  {job.shortDescription && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                      {job.shortDescription}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end justify-between gap-2 text-right">
                  <p className="text-[11px] text-slate-400">
                    Posted {formatDate(job.createdAt)}
                  </p>
                  <a
                    href={`/jobs/${slugOrId}`}
                    className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm"
                    style={{ backgroundColor: accentColor, color: "#0f172a" }}
                  >
                    View role
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GlobalJobsMarketplace(props: { jobs: any[]; q: string; location: string }) {
  const { jobs, q, location } = props;
  const hasJobs = jobs.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-400">
            ThinkATS · Jobs marketplace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Discover open roles across ThinkATS tenants
          </h1>
          <p className="text-sm text-slate-400">
            These roles come from tenants who have opted into the global
            marketplace. Each application still goes directly to the hiring
            company.
          </p>
          {(q || location) && (
            <p className="text-[11px] text-slate-400">
              Filters:
              {q && (
                <span className="ml-1">
                  <span className="font-medium text-slate-200">Search</span> “
                  {q}”
                </span>
              )}
              {location && (
                <span className="ml-1">
                  <span className="font-medium text-slate-200">Location</span> “
                  {location}”
                </span>
              )}
            </p>
          )}
        </header>

        {!hasJobs ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
            There are no marketplace roles available yet. Tenants can opt into
            the marketplace from their careers site settings.
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const slugOrId = job.slug || job.id;
              const companyName =
                job.clientCompany?.name || job.tenant?.name || job.tenant?.slug;

              return (
                <article
                  key={job.id}
                  className="group flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4 transition hover:border-sky-500/60 hover:bg-slate-900"
                >
                  <div className="flex-1 space-y-1.5">
                    <h2 className="text-sm font-semibold text-slate-50 group-hover:text-sky-300">
                      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                      <a href={`/jobs/${slugOrId}`}>{job.title}</a>
                    </h2>

                    {companyName && (
                      <p className="text-[11px] font-medium text-slate-400">
                        {companyName}
                      </p>
                    )}

                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      {job.location && (
                        <span className="rounded-full bg-slate-800/80 px-2 py-0.5">
                          {job.location}
                        </span>
                      )}
                      {job.department && (
                        <span className="rounded-full bg-slate-800/80 px-2 py-0.5">
                          {job.department}
                        </span>
                      )}
                      {job.employmentType && (
                        <span className="rounded-full bg-slate-800/80 px-2 py-0.5">
                          {job.employmentType}
                        </span>
                      )}
                    </div>

                    {job.shortDescription && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-300">
                        {job.shortDescription}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between gap-2 text-right">
                    <p className="text-[11px] text-slate-500">
                      Posted {formatDate(job.createdAt)}
                    </p>
                    <a
                      href={`/jobs/${slugOrId}`}
                      className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold text-slate-900"
                      style={{ backgroundColor: "#e5e7eb" }}
                    >
                      View role
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const hostContext = await getHostContext();
  const {
    isAppHost,
    isCareersiteHost,
    tenant: hostTenant,
    clientCompany: hostClientCompany,
    careerSiteSettings: hostCareerSettings,
    host,
    baseDomain,
  } = hostContext as any;

  const q = asStringParam(searchParams?.q);
  const location = asStringParam(searchParams?.location);

  let tenant = hostTenant as any;
  let clientCompany = hostClientCompany as any;
  let careerSiteSettings = hostCareerSettings as any;

  const tenantSlugParam = asStringParam(searchParams?.tenantSlug);

  // If no tenant from host, but a tenantSlug is provided in query, resolve it
  if (!tenant && tenantSlugParam) {
    tenant = await prisma.tenant.findFirst({
      where: { slug: tenantSlugParam },
    });

    if (tenant && !careerSiteSettings) {
      careerSiteSettings = await prisma.careerSiteSettings.findFirst({
        where: { tenantId: tenant.id },
      });
    }
  }

  // 1) Careersite-ish host but no tenant/client → soft "not configured"
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

  // 2) Global app host with no tenant → marketplace view
  if (!tenant && isAppHost) {
    const jobs = await getMarketplaceJobs(searchParams);
    return <GlobalJobsMarketplace jobs={jobs} q={q} location={location} />;
  }

  // 3) Non-app host but still no tenant → generic "not available"
  if (!tenant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <h1 className="text-lg font-semibold">Jobs page not available</h1>
          <p className="mt-3 text-sm text-slate-400">
            We couldn&apos;t resolve a tenant for this host. If you expected to
            see open roles here, please contact ThinkATS support.
          </p>
        </div>
      </main>
    );
  }

  // 4) Tenant / client-specific jobs list (subdomain or resolved via tenantSlug)
  if (!careerSiteSettings) {
    careerSiteSettings = await prisma.careerSiteSettings.findFirst({
      where: { tenantId: tenant.id },
    });
  }

  const [theme, jobs] = await Promise.all([
    prisma.careerTheme.findFirst({
      where: {
        tenantId: tenant.id,
        clientCompanyId: clientCompany?.id ?? null,
      },
      orderBy: { updatedAt: "desc" },
    }),
    getTenantJobs({
      tenantId: tenant.id,
      clientCompanyId: clientCompany?.id ?? null,
      searchParams,
    }),
  ]);

  const displayName =
    clientCompany?.name || tenant.name || tenant.slug || host;

  const logoUrl =
    (careerSiteSettings as any)?.logoUrl ||
    clientCompany?.logoUrl ||
    tenant.logoUrl ||
    null;

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

  const websiteRaw =
    (clientCompany as any)?.website ||
    tenant.websiteUrl ||
    null;

  const websiteUrl = normaliseWebsiteUrl(websiteRaw);

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
      activeNav="jobs"
    >
      <TenantJobsList
        jobs={jobs}
        displayName={displayName}
        accentColor={accentColor}
        q={q}
        location={location}
      />
    </CareersShell>
  );
}
