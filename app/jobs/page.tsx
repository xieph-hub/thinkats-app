// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Building2, Clock, BriefcaseBusiness } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs | ThinkATS",
  description:
    "Live roles managed on ThinkATS, filtered by tenant or client based on the current host.",
};

type JobsPageSearchParams = {
  q?: string | string[];
  location?: string | string[];
  department?: string | string[];
  employmentType?: string | string[];
};

function asStringParam(
  value: string | string[] | undefined,
  fallback: string | null = null,
): string | null {
  if (!value) return fallback;
  if (Array.isArray(value)) return value[0] ?? fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function buildJobSearchWhere(args: {
  tenantId?: string | null;
  clientCompanyId?: string | null;
  q?: string | null;
  location?: string | null;
  department?: string | null;
  employmentType?: string | null;
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

  const orFilters: any[] = [];

  if (args.q) {
    orFilters.push(
      { title: { contains: args.q, mode: "insensitive" } },
      { department: { contains: args.q, mode: "insensitive" } },
      { location: { contains: args.q, mode: "insensitive" } },
    );
  }

  if (args.location) {
    orFilters.push({
      location: { contains: args.location, mode: "insensitive" },
    });
  }

  if (args.department) {
    orFilters.push({
      department: { contains: args.department, mode: "insensitive" },
    });
  }

  if (args.employmentType) {
    where.employmentType = args.employmentType;
  }

  if (orFilters.length > 0) {
    where.AND = where.AND || [];
    where.AND.push({ OR: orFilters });
  }

  return where;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: JobsPageSearchParams;
}) {
  const hostContext = await getHostContext();
  const {
    isAppHost,
    tenant,
    clientCompany,
    host,
    baseDomain,
    careerSiteSettings,
  } = hostContext as any;

  const q = asStringParam(searchParams?.q);
  const location = asStringParam(searchParams?.location);
  const department = asStringParam(searchParams?.department);
  const employmentType = asStringParam(searchParams?.employmentType);

  const where = buildJobSearchWhere({
    tenantId: tenant?.id ?? null,
    clientCompanyId: clientCompany?.id ?? null,
    q,
    location,
    department,
    employmentType,
  });

  // Keep this loosely typed to avoid Prisma TS mismatches
  const jobs = (await prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      clientCompany: true,
      tenant: {
        include: {
          careerSiteSettings: true,
        },
      },
    },
  })) as any[];

  const primarySettings =
    (careerSiteSettings as any) ??
    tenant?.careerSiteSettings?.[0] ??
    null;

  const displayName =
    clientCompany?.name ||
    tenant?.name ||
    tenant?.slug ||
    host ||
    "Jobs";

  const logoFromSettings =
    (primarySettings as any)?.logoUrl ||
    (primarySettings as any)?.logo_url ||
    null;

  const headerLogoUrl =
    clientCompany?.logoUrl || logoFromSettings || tenant?.logoUrl || null;

  const primaryColor =
    (primarySettings as any)?.primaryColorHex ||
    (primarySettings as any)?.primaryColor ||
    "#172965";

  const accentColor =
    (primarySettings as any)?.accentColorHex ||
    (primarySettings as any)?.accentColor ||
    "#0f766e"; // calm teal-ish accent

  const isTenantScoped = Boolean(tenant);
  const isClientScoped = Boolean(clientCompany);

  const contextLabel = isClientScoped
    ? clientCompany!.name
    : isTenantScoped
      ? tenant!.name || tenant!.slug
      : baseDomain || "ThinkATS";

  const totalJobs = jobs.length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header / Context */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {headerLogoUrl ? (
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={headerLogoUrl}
                  alt={displayName}
                  className="h-8 w-8 object-contain"
                />
              </div>
            ) : (
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Jobs
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                Roles at {displayName}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                {isClientScoped
                  ? "These are live roles for this client, powered by ThinkATS."
                  : isTenantScoped
                    ? "Open roles managed under this tenant’s workspace."
                    : "Marketplace view of open roles managed on ThinkATS."}
              </p>
            </div>
          </div>

          {/* Context pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-800">
              {totalJobs}
            </span>
            <span className="truncate">
              {totalJobs === 1 ? "Open role" : "Open roles"} ·{" "}
              <span className="font-medium text-slate-900">
                {contextLabel}
              </span>
            </span>
          </div>
        </header>

        {/* Search / filters (matches clean detail UX but lightweight) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-[11px] text-slate-700 shadow-sm">
          <form className="grid gap-3 md:grid-cols-[2fr,1fr,1fr]">
            <div className="space-y-1">
              <label
                htmlFor="q"
                className="block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500"
              >
                Keyword
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search by title, team or keyword…"
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="location"
                className="block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500"
              >
                Location
              </label>
              <input
                id="location"
                name="location"
                defaultValue={location ?? ""}
                placeholder="e.g. Lagos, Remote"
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="department"
                className="block text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500"
              >
                Department
              </label>
              <input
                id="department"
                name="department"
                defaultValue={department ?? ""}
                placeholder="e.g. Sales, Operations"
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Actions row */}
            <div className="md:col-span-3 mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-500">
              <span>
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {totalJobs}
                </span>{" "}
                {totalJobs === 1 ? "role" : "roles"}.
              </span>
              <button
                type="submit"
                className="inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                Update filters
              </button>
            </div>
          </form>
        </section>

        {/* Jobs list – cards styled like detail page, with icons + tiny logo */}
        <section className="space-y-3">
          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-[11px] text-slate-500">
              <p className="font-medium text-slate-900">
                No open roles right now.
              </p>
              <p className="mt-1">
                Check back later or follow this organisation on their social
                channels for future updates.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {jobs.map((rawJob) => {
                const job = rawJob as any;

                const jobUrl = `/jobs/${encodeURIComponent(
                  job.slug || job.id,
                )}`;

                const jobTenant = job.tenant as any;
                const jobSettings =
                  (jobTenant?.careerSiteSettings &&
                    jobTenant.careerSiteSettings[0]) ||
                  null;

                const cardLogoUrl =
                  (job.clientCompany as any)?.logoUrl ||
                  (job.clientCompany as any)?.logo_url ||
                  (jobSettings as any)?.logoUrl ||
                  (jobSettings as any)?.logo_url ||
                  jobTenant?.logoUrl ||
                  null;

                const companyLabel =
                  (job.clientCompany as any)?.name ||
                  jobTenant?.name ||
                  jobTenant?.slug ||
                  displayName;

                const locationLabel = job.location || "Location not specified";
                const employmentLabel =
                  job.employmentType || job.workMode || null;
                const locationTypeLabel = job.locationType || job.location_type;

                const createdAt = job.createdAt
                  ? new Date(job.createdAt)
                  : null;

                const postedLabel = createdAt
                  ? createdAt.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : null;

                const shortDescription =
                  job.shortDescription || job.short_description || null;

                return (
                  <li key={job.id}>
                    <Link
                      href={jobUrl}
                      className="group block rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-[1px] hover:border-emerald-600/70 hover:shadow-md"
                    >
                      <div className="flex gap-3">
                        {/* Tiny logo avatar on the left of the title */}
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          {cardLogoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cardLogoUrl}
                              alt={companyLabel}
                              className="h-8 w-8 object-contain"
                            />
                          ) : (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              {companyLabel.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          {/* Title + posted */}
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                            <h2 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                              {job.title}
                            </h2>
                            {postedLabel && (
                              <span className="text-[10px] text-slate-500">
                                Posted {postedLabel}
                              </span>
                            )}
                          </div>

                          {/* Company + meta icons */}
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                              <Building2 className="h-3.5 w-3.5 text-slate-400" />
                              {companyLabel}
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {locationLabel}
                            </span>

                            {employmentLabel && (
                              <span className="inline-flex items-center gap-1">
                                <BriefcaseBusiness className="h-3.5 w-3.5 text-slate-400" />
                                {employmentLabel}
                              </span>
                            )}

                            {locationTypeLabel && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {locationTypeLabel}
                              </span>
                            )}
                          </div>

                          {/* Short description */}
                          {shortDescription && (
                            <p className="line-clamp-2 text-[11px] text-slate-600">
                              {shortDescription}
                            </p>
                          )}
                        </div>

                        {/* Right CTA */}
                        <div className="hidden items-center pl-3 text-[11px] font-medium text-emerald-700 sm:flex">
                          <span className="flex items-center gap-1">
                            View job
                            <span aria-hidden>↗</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Subtle footer – no big ThinkATS nav, just a quiet tag */}
        <footer className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-500">
          <span>
            Jobs powered by{" "}
            <span className="font-semibold text-slate-700">ThinkATS</span>.
          </span>
          {baseDomain && (
            <span className="hidden sm:inline">
              Host:{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px]">
                {host}
              </code>
            </span>
          )}
        </footer>
      </div>
    </main>
  );
}
