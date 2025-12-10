// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import type { Prisma } from "@prisma/client";
import {
  MapPin,
  Briefcase,
  Globe2,
  Building2,
  Clock,
  Filter,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs | ThinkATS",
  description:
    "Browse open roles managed on ThinkATS across tenants and clients.",
};

type JobsPageSearchParams = {
  q?: string | string[];
  location?: string | string[];
  workMode?: string | string[];
  employmentType?: string | string[];
};

type HostContext = {
  isAppHost: boolean;
  isCareersiteHost: boolean;
  tenant?: {
    id: string;
    name?: string | null;
    slug?: string | null;
    logoUrl?: string | null;
  } | null;
  clientCompany?: {
    id: string;
    name: string;
    slug?: string | null;
    logoUrl?: string | null;
  } | null;
};

type JobWithRelations = Prisma.JobGetPayload<{
  include: { tenant: true; clientCompany: true };
}>;

function asStringParam(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function formatEmploymentType(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.toLowerCase();
  if (value === "full_time" || value === "full-time") return "Full-time";
  if (value === "part_time" || value === "part-time") return "Part-time";
  if (value === "contract") return "Contract";
  if (value === "internship") return "Internship";
  if (value === "temporary") return "Temporary";
  return raw;
}

function formatWorkMode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.toLowerCase();
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  if (value === "onsite" || value === "on_site") return "Onsite";
  return raw;
}

function getLogoUrl(job: JobWithRelations): string | null {
  return (
    (job.clientCompany as any)?.logoUrl ||
    (job.tenant as any)?.logoUrl ||
    null
  );
}

function getDisplayCompany(job: JobWithRelations): string | null {
  return (
    (job.clientCompany && job.clientCompany.name) ||
    (job.tenant && (job.tenant.name || (job.tenant as any).slug)) ||
    null
  );
}

function getInitials(label: string | null | undefined): string {
  if (!label) return "•";
  const parts = label.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.charAt(0)!.toUpperCase();
  return (
    (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase()
  );
}

async function fetchJobs(
  hostContext: HostContext,
  searchParams?: JobsPageSearchParams,
): Promise<JobWithRelations[]> {
  const q = asStringParam(searchParams?.q);
  const locationFilter = asStringParam(searchParams?.location);
  const workModeFilter = asStringParam(searchParams?.workMode);
  const employmentTypeFilter = asStringParam(searchParams?.employmentType);

  // Base where
  const where: Prisma.JobWhereInput = {
    status: "open",
    visibility: "public",
  };

  // Collect AND filters in a local array to keep TS happy
  const andFilters: Prisma.JobWhereInput[] = [];

  // internalOnly: false or null
  andFilters.push({
    OR: [{ internalOnly: false }, { internalOnly: null }],
  });

  // Scope to tenant if on tenant host
  if (hostContext.tenant?.id) {
    where.tenantId = hostContext.tenant.id;
  }

  if (q) {
    andFilters.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { responsibilities: { contains: q, mode: "insensitive" } },
        { requirements: { contains: q, mode: "insensitive" } },
        { aboutClient: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (locationFilter) {
    andFilters.push({
      location: { contains: locationFilter, mode: "insensitive" },
    });
  }

  if (workModeFilter) {
    andFilters.push({ workMode: workModeFilter });
  }

  if (employmentTypeFilter) {
    andFilters.push({ employmentType: employmentTypeFilter });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  return prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tenant: true,
      clientCompany: true,
    },
  });
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: JobsPageSearchParams;
}) {
  const hostContext = (await getHostContext()) as HostContext;
  const jobs = await fetchJobs(hostContext, searchParams);

  const q = asStringParam(searchParams?.q);
  const locationFilter = asStringParam(searchParams?.location);
  const workModeFilter = asStringParam(searchParams?.workMode);
  const employmentTypeFilter = asStringParam(searchParams?.employmentType);

  const isTenantScoped = Boolean(hostContext.tenant?.id);
  const tenantName =
    hostContext.clientCompany?.name ||
    hostContext.tenant?.name ||
    hostContext.tenant?.slug ||
    null;

  const pageTitle = isTenantScoped
    ? tenantName
      ? `${tenantName} · Jobs`
      : "Jobs"
    : "Jobs across ThinkATS tenants";

  const subtitle = isTenantScoped
    ? "Explore roles for this organisation, powered by ThinkATS."
    : "Discover open roles managed by ThinkATS for multiple clients and tenants.";

  return (
    <main className="min-h-screen bg-[#F9FAFB] px-4 py-8 lg:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        {/* LEFT: Filters / facets */}
        <aside className="w-full space-y-4 lg:w-64">
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E5F0FF]">
                <Filter className="h-3.5 w-3.5 text-[#2563EB]" />
              </span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4B5563]">
                Refine jobs
              </h2>
            </div>

            <form method="GET" className="space-y-3 text-xs text-[#4B5563]">
              <div className="space-y-1.5">
                <label
                  htmlFor="q"
                  className="block text-[11px] font-medium text-[#111827]"
                >
                  Search
                </label>
                <input
                  id="q"
                  name="q"
                  placeholder="Title, company, keyword…"
                  defaultValue={q}
                  className="w-full rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[11px] text-[#111827] outline-none ring-0 focus:border-[#2563EB] focus:bg-white focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="location"
                  className="block text-[11px] font-medium text-[#111827]"
                >
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  placeholder="e.g. Lagos, Remote"
                  defaultValue={locationFilter}
                  className="w-full rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[11px] text-[#111827] outline-none ring-0 focus:border-[#2563EB] focus:bg-white focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="workMode"
                  className="block text-[11px] font-medium text-[#111827]"
                >
                  Work mode
                </label>
                <select
                  id="workMode"
                  name="workMode"
                  defaultValue={workModeFilter || ""}
                  className="w-full rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[11px] text-[#111827] outline-none ring-0 focus:border-[#2563EB] focus:bg-white focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="">Any</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">Onsite</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="employmentType"
                  className="block text-[11px] font-medium text-[#111827]"
                >
                  Employment type
                </label>
                <select
                  id="employmentType"
                  name="employmentType"
                  defaultValue={employmentTypeFilter || ""}
                  className="w-full rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[11px] text-[#111827] outline-none ring-0 focus:border-[#2563EB] focus:bg-white focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="">Any</option>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-full bg-[#2563EB] px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
                >
                  Apply filters
                </button>
                <Link
                  href="/jobs"
                  className="text-[11px] font-medium text-[#6B7280] hover:text-[#111827]"
                >
                  Clear
                </Link>
              </div>
            </form>
          </section>

          <section className="hidden rounded-2xl border border-[#E5E7EB] bg-white p-4 text-xs text-[#4B5563] shadow-sm lg:block">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
              Quick insight
            </h3>
            <p className="mt-2 leading-relaxed">
              Roles listed here come directly from employer workspaces using
              ThinkATS. Each job card links to a detailed brief and application
              form.
            </p>
          </section>
        </aside>

        {/* CENTER: Job list */}
        <section className="flex-1 space-y-4">
          <header className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
              Jobs
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#111827]">
              {pageTitle}
            </h1>
            <p className="text-[13px] text-[#4B5563]">{subtitle}</p>
            <p className="mt-1 text-[11px] text-[#6B7280]">
              Showing{" "}
              <span className="font-semibold text-[#111827]">
                {jobs.length}
              </span>{" "}
              open role{jobs.length === 1 ? "" : "s"}
              {q && (
                <>
                  {" "}
                  for <span className="font-mono text-[#111827]">"{q}"</span>
                </>
              )}
              {locationFilter && (
                <>
                  {" "}
                  in{" "}
                  <span className="font-mono text-[#111827]">
                    {locationFilter}
                  </span>
                </>
              )}
            </p>
          </header>

          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-4 py-10 text-center text-sm text-[#6B7280]">
              No open jobs match these filters yet. Try clearing filters or
              checking back later.
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const logoUrl = getLogoUrl(job);
                const company = getDisplayCompany(job);
                const employmentTypeLabel = formatEmploymentType(
                  job.employmentType,
                );
                const workModeLabel = formatWorkMode(job.workMode);
                const href = `/jobs/${encodeURIComponent(
                  job.slug || job.id,
                )}`;

                return (
                  <Link
                    key={job.id}
                    href={href}
                    className="block rounded-2xl border border-[#E5E7EB] bg_white bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      {/* Left: Logo + title + meta */}
                      <div className="flex flex-1 gap-3">
                        {/* Tiny avatar / logo */}
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-[#E5E7EB] ring-1 ring-[#D1D5DB]">
                          {logoUrl ? (
                            <div
                              className="h-full w-full bg-cover bg-center"
                              style={{ backgroundImage: `url(${logoUrl})` }}
                            />
                          ) : (
                            <span className="text-xs font-semibold text-[#374151]">
                              {getInitials(company || job.title)}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-sm font-semibold text-[#111827]">
                              {job.title}
                            </h2>
                            {company && (
                              <span className="inline-flex items-center rounded-full bg-[#E5F0FF] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#2563EB]">
                                {company}
                              </span>
                            )}
                          </div>

                          {job.shortDescription && (
                            <p className="text-[12px] leading-snug text-[#4B5563]">
                              {job.shortDescription}
                            </p>
                          )}

                          {/* Meta row: location, work mode, type */}
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                            {job.location && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-medium text-[#B91C1C]">
                                <MapPin
                                  className="h-3.5 w-3.5"
                                  style={{ color: "#EF4444" }}
                                />
                                <span className="truncate">
                                  {job.location}
                                </span>
                              </span>
                            )}

                            {workModeLabel && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-medium text-[#92400E]">
                                <Globe2
                                  className="h-3.5 w-3.5"
                                  style={{ color: "#F59E0B" }}
                                />
                                <span>{workModeLabel}</span>
                              </span>
                            )}

                            {employmentTypeLabel && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-medium text-[#166534]">
                                <Briefcase
                                  className="h-3.5 w-3.5"
                                  style={{ color: "#16A34A" }}
                                />
                                <span>{employmentTypeLabel}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: quick facts */}
                      <div className="flex w-full flex-col items-end justify-between gap-2 text-[11px] text-[#6B7280] sm:w-52">
                        <div className="flex flex-wrap justify-end gap-2">
                          {job.department && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-medium text-[#4B5563]">
                              <Building2 className="h-3.5 w-3.5 text-[#6B7280]" />
                              <span>{job.department}</span>
                            </span>
                          )}
                          {job.experienceLevel && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#E5F0FF] px-2 py-0.5 text-[10px] font-medium text-[#1D4ED8]">
                              <Clock className="h-3.5 w-3.5 text-[#2563EB]" />
                              <span>{job.experienceLevel}</span>
                            </span>
                          )}
                        </div>

                        <span className="inline-flex items-center rounded-full bg-[#2563EB] px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                          View job
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* RIGHT: Extra context / guidance */}
        <aside className="mt-4 w-full space-y-4 lg:mt-0 lg:w-64">
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-xs text-[#4B5563] shadow-sm">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
              How this works
            </h2>
            <p className="mt-2 leading-relaxed">
              Each job links to a detailed brief with responsibilities,
              requirements and client context. You can apply directly from the
              job page – your application is tracked end-to-end in ThinkATS.
            </p>
          </section>

          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-xs text-[#4B5563] shadow-sm">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
              Tips for candidates
            </h2>
            <ul className="mt-2 space-y-1.5 list-disc pl-4">
              <li>Tailor your CV to the role’s key requirements.</li>
              <li>Add a short, specific note in your application.</li>
              <li>
                Highlight outcomes – not just responsibilities – in your
                experience.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
