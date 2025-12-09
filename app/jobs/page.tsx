// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open roles | ThinkATS",
  description:
    "Browse open roles managed through ThinkATS and its tenant workspaces.",
};

type JobsPageSearchParams = {
  q?: string | string[];
  location?: string | string[];
  department?: string | string[];
  employmentType?: string | string[];
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

async function getPublicJobsForTenant(args: {
  tenantId: string;
  clientCompanyId?: string | null;
  q?: string;
  location?: string;
  department?: string;
  employmentType?: string;
}) {
  const {
    tenantId,
    clientCompanyId,
    q,
    location,
    department,
    employmentType,
  } = args;

  const where: any = {
    tenantId,
    status: "open",
    visibility: "public",
    // internalOnly != true → show external-facing roles only
    NOT: { internalOnly: true },
  };

  const andFilters: any[] = [];

  if (clientCompanyId) {
    andFilters.push({ clientCompanyId });
  }

  if (q) {
    andFilters.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (location) {
    andFilters.push({
      location: { contains: location, mode: "insensitive" },
    });
  }

  if (department) {
    andFilters.push({
      department: { contains: department, mode: "insensitive" },
    });
  }

  if (employmentType) {
    andFilters.push({
      employmentType: { contains: employmentType, mode: "insensitive" },
    });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  return prisma.job.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });
}

function formatDate(date: Date): string {
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

export default async function JobsPage({
  searchParams,
}: {
  searchParams: JobsPageSearchParams;
}) {
  const hostCtx = await getHostContext();
  const {
    isAppHost,
    tenant,
    clientCompany,
    careerSiteSettings,
    host,
    baseDomain,
  } = hostCtx;

  const q = firstParam(searchParams.q);
  const locationFilter = firstParam(searchParams.location);
  const departmentFilter = firstParam(searchParams.department);
  const employmentTypeFilter = firstParam(searchParams.employmentType);

  // ---------------------------------------------------------------------------
  // 1) Tenant / client careersite host (subdomain or custom domain)
  //    Example: human-capital-partners.thinkats.com/jobs
  // ---------------------------------------------------------------------------
  if (tenant && !isAppHost) {
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

    const isUnderMainDomain =
      host === baseDomain || host.endsWith(`.${baseDomain}`);
    const planTier = (tenant.planTier || "").toUpperCase();
    const isEnterprisePlan = planTier === "ENTERPRISE";
    const canRemoveBranding = isEnterprisePlan && !isUnderMainDomain;
    const showPoweredBy = !canRemoveBranding;

    const jobs = await getPublicJobsForTenant({
      tenantId: tenant.id,
      clientCompanyId: clientCompany?.id ?? null,
      q,
      location: locationFilter,
      department: departmentFilter,
      employmentType: employmentTypeFilter,
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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

              {/* Tenant mini-nav – no ThinkATS marketing nav here */}
              <nav className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
                <a href="/careers" className="hover:text-slate-900">
                  Careers home
                </a>
                <a
                  href="/jobs"
                  className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-900 shadow-sm"
                >
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

            {/* Main content: filters + job list */}
            <div className="px-6 py-7 lg:px-8 lg:py-9">
              <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                    Open roles
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Browse live opportunities at {displayName}. Use the filters
                    to quickly find roles that match your experience and
                    interests.
                  </p>
                </div>

                {/* Simple server-side search/filter form */}
                <form
                  className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  method="get"
                >
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder="Search by title, team, location..."
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 sm:w-60"
                  />
                  <input
                    name="location"
                    defaultValue={locationFilter}
                    placeholder="Location"
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 sm:w-40"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Filter roles
                  </button>
                </form>
              </header>

              {/* Jobs list */}
              {jobs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                  There are no open roles listed right now. Please check back
                  soon or follow {displayName} on social media for updates.
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job: any) => {
                    const slugOrId = job.slug || job.id;

                    return (
                      <article
                        key={job.id}
                        className="group flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 transition hover:border-slate-200 hover:bg-white"
                      >
                        <div className="flex-1 space-y-1.5">
                          <h2 className="text-sm font-semibold text-slate-900 group-hover:underline">
                            <Link href={`/jobs/${slugOrId}`}>{job.title}</Link>
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
                          <Link
                            href={`/jobs/${slugOrId}`}
                            className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold"
                            style={{
                              backgroundColor: accentColor,
                              color: "#0f172a",
                            }}
                          >
                            View role
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
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

  // ---------------------------------------------------------------------------
  // 2) Main app host (thinkats.com/jobs) – simple global entry point for now
  // ---------------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Open roles powered by ThinkATS
          </h1>
          <p className="text-sm text-slate-400">
            This is the global jobs entry point for roles managed on ThinkATS.
            Individual client careers sites and job pages live on their own
            subdomains, for example{" "}
            <span className="font-mono text-sky-400">
              acme.thinkats.com/jobs
            </span>
            .
          </p>
        </header>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          <p>
            You can evolve this into a marketplace of featured roles across all
            tenants later. For now, candidates will typically discover jobs
            via each client&apos;s white-labeled careers microsite.
          </p>
        </div>
      </div>
    </main>
  );
}
