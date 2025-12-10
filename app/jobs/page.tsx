// app/jobs/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import CareersShell from "@/components/careers/CareersShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs | ThinkATS",
  description:
    "Browse open roles managed by ThinkATS and its clients across different industries and locations.",
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
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

async function getPublicJobs(args: {
  tenantId?: string;
  clientCompanyId?: string | null;
  q?: string;
  location?: string;
  department?: string;
  workMode?: string;
}) {
  const where: any = {
    status: "open",
    visibility: "public",
    OR: [{ internalOnly: false }, { internalOnly: null }],
  };

  if (args.tenantId) {
    where.tenantId = args.tenantId;
  }

  if (args.clientCompanyId) {
    where.clientCompanyId = args.clientCompanyId;
  }

  if (args.q) {
    where.OR = [
      ...(where.OR || []),
      { title: { contains: args.q, mode: "insensitive" } },
      { department: { contains: args.q, mode: "insensitive" } },
      { location: { contains: args.q, mode: "insensitive" } },
    ];
  }

  if (args.location) {
    where.location = { contains: args.location, mode: "insensitive" };
  }

  if (args.department) {
    where.department = { contains: args.department, mode: "insensitive" };
  }

  if (args.workMode) {
    where.workMode = args.workMode;
  }

  return prisma.job.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      clientCompany: true,
      tenant: true,
    },
  });
}

export default async function JobsPage(props: {
  searchParams?: RawSearchParams;
}) {
  const searchParams = props.searchParams || {};
  const q = getParam(searchParams.q);
  const location = getParam(searchParams.location);
  const department = getParam(searchParams.department);
  const workMode = getParam(searchParams.workMode);

  const hostContext = await getHostContext();
  const {
    isAppHost,
    isCareersiteHost,
    tenant,
    clientCompany,
    host,
    baseDomain,
    careerSiteSettings,
  } = hostContext;

  // Tenant / client microsite host → white-labeled board for that tenant
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

    const websiteUrl = clientCompany?.website ?? tenant.websiteUrl ?? null;

    const jobs = await getPublicJobs({
      tenantId: tenant.id,
      clientCompanyId: clientCompany?.id ?? null,
      q,
      location,
      department,
      workMode,
    });

    const hasFilters = Boolean(q || location || department || workMode);

    return (
      <CareersShell
        displayName={displayName}
        logoUrl={logoUrl}
        host={host}
        baseDomain={baseDomain}
        planTier={tenant.planTier}
        primaryColor={primaryColor}
        accentColor={accentColor}
        heroBackground={heroBackground}
        websiteUrl={websiteUrl}
        activeNav="jobs"
      >
        <div className="space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Open roles
              </h1>
              <p className="text-xs text-slate-500">
                Explore current opportunities at {displayName}.
              </p>
              {hasFilters && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Filtering jobs
                  {q && (
                    <>
                      {" "}
                      matching <span className="font-medium">“{q}”</span>
                    </>
                  )}
                  {location && (
                    <>
                      {" "}
                      in <span className="font-medium">{location}</span>
                    </>
                  )}
                  .
                </p>
              )}
            </div>

            <form className="flex flex-wrap gap-2 text-xs">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search roles"
                className="h-8 rounded-full border border-slate-200 px-3 text-xs outline-none focus:border-slate-400"
              />
              <input
                type="text"
                name="location"
                defaultValue={location}
                placeholder="Location"
                className="h-8 rounded-full border border-slate-200 px-3 text-xs outline-none focus:border-slate-400"
              />
              <button
                type="submit"
                className="h-8 rounded-full px-3 text-[11px] font-semibold shadow-sm"
                style={{ backgroundColor: accentColor, color: "#0f172a" }}
              >
                Apply filters
              </button>
            </form>
          </header>

          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No open roles match your filters right now. Please check back
              soon.
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const slugOrId = job.slug || job.id;
                const companyName =
                  job.clientCompany?.name || displayName || "Open role";

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
                      <p className="text-[11px] text-slate-500">
                        {companyName}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
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
                        style={{
                          backgroundColor: accentColor,
                          color: "#0f172a",
                        }}
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
      </CareersShell>
    );
  }

  // Global app host – marketplace-style listing across tenants
  const jobs = await getPublicJobs({
    q,
    location,
    department,
    workMode,
  });

  const hasFilters = Boolean(q || location || department || workMode);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Open roles across the ThinkATS network
            </h1>
            <p className="text-sm text-slate-400">
              Browse live mandates from employers and search firms powered by
              ThinkATS.
            </p>
            {hasFilters && (
              <p className="mt-1 text-xs text-slate-500">
                Filtering results
                {q && (
                  <>
                    {" "}
                    matching <span className="font-medium">“{q}”</span>
                  </>
                )}
                {location && (
                  <>
                    {" "}
                    in <span className="font-medium">{location}</span>
                  </>
                )}
                .
              </p>
            )}
          </div>

          <form className="flex flex-wrap gap-2 text-xs">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search titles, companies…"
              className="h-8 rounded-full border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-slate-400"
            />
            <input
              type="text"
              name="location"
              defaultValue={location}
              placeholder="Location"
              className="h-8 rounded-full border border-slate-700 bg-slate-900 px-3 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-slate-400"
            />
            <button
              type="submit"
              className="h-8 rounded-full bg-slate-100 px-3 text-[11px] font-semibold text-slate-900 shadow-sm"
            >
              Apply filters
            </button>
          </form>
        </header>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 px-4 py-6 text-center text-xs text-slate-400">
            No open roles match your filters right now. Try adjusting your
            search or check back soon.
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const slugOrId = job.slug || job.id;
              const companyName =
                job.clientCompany?.name ||
                job.tenant?.name ||
                job.tenant?.slug ||
                "Confidential client";

              return (
                <article
                  key={job.id}
                  className="group flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4 transition hover:border-slate-600 hover:bg-slate-900"
                >
                  <div className="flex-1 space-y-1.5">
                    <h2 className="text-sm font-semibold text-slate-50 group-hover:underline">
                      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                      <a href={`/jobs/${slugOrId}`}>{job.title}</a>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {companyName}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      {job.location && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5">
                          {job.location}
                        </span>
                      )}
                      {job.department && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5">
                          {job.department}
                        </span>
                      )}
                      {job.employmentType && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5">
                          {job.employmentType}
                        </span>
                      )}
                      {job.experienceLevel && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5">
                          {job.experienceLevel}
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
                      className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-900 shadow-sm"
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
