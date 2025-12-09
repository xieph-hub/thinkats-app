// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs | ThinkATS",
  description:
    "Browse open roles managed on ThinkATS, filtered per tenant and client careers sites.",
};

type JobsPageSearchParams = {
  q?: string | string[];
  location?: string | string[];
};

function normaliseParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: JobsPageSearchParams;
}) {
  const q = normaliseParam(searchParams?.q);
  const locationFilter = normaliseParam(searchParams?.location);

  const hostCtx = await getHostContext();
  const {
    isAppHost,
    tenant,
    clientCompany,
    host,
    baseDomain,
  } = hostCtx;

  // ────────────────────────────────────────────────────────────────
  // If we have a tenant (subdomain or custom careers domain),
  // render tenant-scoped public jobs under the tenant shell.
  // ────────────────────────────────────────────────────────────────
  if (tenant && !isAppHost) {
    const displayName =
      clientCompany?.name || tenant.name || tenant.slug || host;

    const logoUrl =
      (hostCtx.careerSiteSettings as any)?.logoUrl ||
      clientCompany?.logoUrl ||
      tenant.logoUrl ||
      null;

    const primaryColor =
      (hostCtx.careerSiteSettings as any)?.primaryColorHex || "#172965";
    const accentColor =
      (hostCtx.careerSiteSettings as any)?.accentColorHex || "#0ea5e9";
    const heroBackground =
      (hostCtx.careerSiteSettings as any)?.heroBackgroundHex || "#F9FAFB";

    // Plan + domain based “Powered by ThinkATS”
    const isUnderMainDomain =
      host === baseDomain || host.endsWith(`.${baseDomain}`);
    const planTier = (tenant.planTier || "").toUpperCase();
    const isEnterprisePlan = planTier === "ENTERPRISE";
    const canRemoveBranding = isEnterprisePlan && !isUnderMainDomain;
    const showPoweredBy = !canRemoveBranding;

    // Build where clause for this tenant / client
    const where: any = {
      tenantId: tenant.id,
      status: "open",
      visibility: "public",
      OR: [{ internalOnly: false }, { internalOnly: null }],
    };

    if (clientCompany) {
      where.clientCompanyId = clientCompany.id;
    }

    const andFilters: any[] = [];

    if (q) {
      andFilters.push({
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { department: { contains: q, mode: "insensitive" as const } },
          { location: { contains: q, mode: "insensitive" as const } },
          {
            shortDescription: {
              contains: q,
              mode: "insensitive" as const,
            },
          },
          { overview: { contains: q, mode: "insensitive" as const } },
        ],
      });
    }

    if (locationFilter) {
      andFilters.push({
        location: {
          contains: locationFilter,
          mode: "insensitive" as const,
        },
      });
    }

    if (andFilters.length) {
      where.AND = andFilters;
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
                  <p className="text-[11px] text-slate-500">Open roles</p>
                </div>
              </div>

              {/* Tenant mini-nav (no ThinkATS marketing nav here) */}
              <nav className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
                <a href="/" className="hover:text-slate-900">
                  Hiring home
                </a>
                <a
                  href="/careers"
                  className="hover:text-slate-900"
                >
                  Careers
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

            {/* Jobs list content */}
            <div className="px-6 py-7 lg:px-8 lg:py-9">
              {/* Simple search row (host-scoped) */}
              <form className="mb-5 flex flex-wrap items-center gap-3 text-[11px]">
                <input
                  type="text"
                  name="q"
                  defaultValue={q || ""}
                  placeholder="Search by title, team or keyword"
                  className="w-full flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-0 sm:max-w-xs"
                />
                <input
                  type="text"
                  name="location"
                  defaultValue={locationFilter || ""}
                  placeholder="Location (e.g. Lagos, Remote)"
                  className="w-full flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-0 sm:max-w-xs"
                />
                <button
                  type="submit"
                  className="rounded-full bg-slate-900 px-4 py-2 text-[11px] font-semibold text-white hover:bg-slate-800"
                >
                  Filter
                </button>
              </form>

              {jobs.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-[11px] text-slate-500">
                  No open roles found right now. Check back soon or reach out to
                  the team directly.
                </div>
              ) : (
                <ul className="space-y-3">
                  {jobs.map((job) => {
                    const jobSlug = job.slug || job.id;
                    return (
                      <li
                        key={job.id}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-700 shadow-sm hover:border-slate-300"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <Link
                              href={`/jobs/${encodeURIComponent(jobSlug)}`}
                              className="text-sm font-semibold text-slate-900 hover:underline"
                            >
                              {job.title}
                            </Link>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {job.department && (
                                <span>{job.department} · </span>
                              )}
                              {job.location || "Location flexible"}
                            </p>
                          </div>
                          <div className="text-right text-[10px] text-slate-500">
                            <p>
                              Posted{" "}
                              <span className="font-medium">
                                {formatDate(job.createdAt as Date)}
                              </span>
                            </p>
                            {job.employmentType && (
                              <p>{job.employmentType}</p>
                            )}
                          </div>
                        </div>

                        {job.shortDescription && (
                          <p className="mt-2 text-[11px] text-slate-600">
                            {job.shortDescription}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

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

  // ────────────────────────────────────────────────────────────────
  // Global marketplace at thinkats.com/jobs
  // (only roles opted into the marketplace)
  // ────────────────────────────────────────────────────────────────
  const where: any = {
    status: "open",
    visibility: "public",
    OR: [{ internalOnly: false }, { internalOnly: null }],
    tenant: {
      careerSiteSettings: {
        some: {
          includeInMarketplace: true,
          isPublic: true,
        },
      },
    },
  };

  const andFilters: any[] = [];

  if (q) {
    andFilters.push({
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { department: { contains: q, mode: "insensitive" as const } },
        { location: { contains: q, mode: "insensitive" as const } },
        {
          shortDescription: {
            contains: q,
            mode: "insensitive" as const,
          },
        },
        { overview: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }

  if (locationFilter) {
    andFilters.push({
      location: {
        contains: locationFilter,
        mode: "insensitive" as const,
      },
    });
  }

  if (andFilters.length) {
    where.AND = andFilters;
  }

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tenant: true,
      clientCompany: true,
    },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Jobs on ThinkATS
          </h1>
          <p className="text-sm text-slate-400">
            Selected roles shared by our tenants and their clients. Each role
            runs in a dedicated hiring workspace.
          </p>
        </header>

        <form className="mb-5 flex flex-wrap items-center gap-3 text-[11px]">
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Search by title, company or keyword"
            className="w-full flex-1 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500 focus:border-slate-400 focus:bg-slate-900 focus:ring-0 sm:max-w-xs"
          />
          <input
            type="text"
            name="location"
            defaultValue={locationFilter || ""}
            placeholder="Location (e.g. Lagos, Remote)"
            className="w-full flex-1 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none placeholder:text-slate-500 focus:border-slate-400 focus:bg-slate-900 focus:ring-0 sm:max-w-xs"
          />
          <button
            type="submit"
            className="rounded-full bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-900 hover:bg-white"
          >
            Filter
          </button>
        </form>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-6 text-center text-[11px] text-slate-400">
            No marketplace roles are live right now.
          </div>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => {
              const jobSlug = job.slug || job.id;
              const companyName =
                job.clientCompany?.name ||
                job.tenant?.name ||
                job.tenant?.slug;

              return (
                <li
                  key={job.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-[11px] text-slate-200 hover:border-slate-600"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link
                        href={`/jobs/${encodeURIComponent(jobSlug)}`}
                        className="text-sm font-semibold text-slate-50 hover:underline"
                      >
                        {job.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {companyName && <span>{companyName} · </span>}
                        {job.location || "Location flexible"}
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      <p>
                        Posted{" "}
                        <span className="font-medium">
                          {formatDate(job.createdAt as Date)}
                        </span>
                      </p>
                      {job.employmentType && <p>{job.employmentType}</p>}
                    </div>
                  </div>

                  {job.shortDescription && (
                    <p className="mt-2 text-[11px] text-slate-300">
                      {job.shortDescription}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
