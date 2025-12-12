// app/jobs/page.tsx
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  MapPin,
  Building2,
  Clock,
  BriefcaseBusiness,
  Filter,
  Share2,
  Linkedin,
  Twitter,
  Link2,
  MessageCircle,
  Tag as TagIcon,
} from "lucide-react";
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
    (careerSiteSettings as any) ?? tenant?.careerSiteSettings?.[0] ?? null;

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

  // Brand-aligned highlight (match /jobs/[slug] feel)
  const accentColor: string =
    (primarySettings as any)?.accentColorHex ||
    (primarySettings as any)?.accentColor ||
    "#2563EB"; // Electric blue (overridden by settings when present)

  const isTenantScoped = Boolean(tenant);
  const isClientScoped = Boolean(clientCompany);

  const contextLabel = isClientScoped
    ? clientCompany!.name
    : isTenantScoped
      ? tenant!.name || tenant!.slug
      : baseDomain || "ThinkATS";

  const totalJobs = jobs.length;

  // Share URLs (for the board itself)
  const currentPath = "/jobs";
  const hostName = host || baseDomain || "";
  const currentUrl = hostName ? `https://${hostName}${currentPath}` : currentPath;
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedMessage = encodeURIComponent(
    `Check out these open roles: ${currentUrl}`,
  );

  const whatsappShareUrl = `https://wa.me/?text=${encodedMessage}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}`;

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900">
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
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-slate-800">
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

        {/* Main content: refine sidebar + jobs panel */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,260px),1fr]">
          {/* LEFT: refine jobs + social share */}
          <aside className="space-y-4">
            {/* Refine jobs card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-700 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] text-slate-800">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Refine jobs
                  </p>
                  <p className="text-[11px] font-medium text-slate-900">
                    Narrow down roles that match your profile.
                  </p>
                </div>
              </div>
              <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600">
                <li>• Use keyword search for title, team or function.</li>
                <li>• Filter by location or department to focus results.</li>
                <li>• Combine filters to discover the most relevant roles.</li>
              </ul>
            </div>

            {/* Share board card – styled like the job detail share pill */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-700 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] text-slate-800">
                  <Share2 className="h-3.5 w-3.5 text-slate-500" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Share this board
                  </p>
                  <p className="text-[11px] text-slate-700">
                    Send these roles to a colleague or your network.
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-[11px] text-slate-600 shadow-sm">
                  <span className="hidden font-medium text-slate-600 sm:inline">
                    Share
                  </span>
                  <a
                    href={linkedinShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100"
                    aria-label="Share on LinkedIn"
                  >
                    <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
                  </a>
                  <a
                    href={twitterShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100"
                    aria-label="Share on X"
                  >
                    <Twitter className="h-3.5 w-3.5 text-slate-900" />
                  </a>
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100"
                    aria-label="Share on WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                  </a>
                </div>

                <div className="text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Link2 className="h-3 w-3 text-slate-400" />
                    <span className="truncate">{currentUrl}</span>
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT: filters + jobs list */}
          <div className="space-y-4">
            {/* Search / filters */}
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
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:ring-1 focus:ring-[#2563EB]"
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
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:ring-1 focus:ring-[#2563EB]"
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
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:ring-1 focus:ring-[#2563EB]"
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

            {/* Jobs list – cards styled like detail page */}
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

                    const locationLabel =
                      job.location || "Location not specified";
                    const employmentLabel =
                      job.employmentType || job.workMode || null;
                    const locationTypeLabel =
                      job.locationType || job.location_type;

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

                    const tags: string[] = Array.isArray(job.tags)
                      ? (job.tags as string[])
                      : [];

                    const cardStyle: CSSProperties = {
                      ["--jobs-accent" as any]: accentColor,
                    };

                    return (
                      <li key={job.id}>
                        <Link
                          href={jobUrl}
                          className="group block rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--jobs-accent)] hover:shadow-md"
                          style={cardStyle}
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
                                <h2 className="text-sm font-semibold text-slate-900 group-hover:text-[var(--jobs-accent)]">
                                  {job.title}
                                </h2>
                                {postedLabel && (
                                  <span className="text-[10px] text-slate-500">
                                    Posted {postedLabel}
                                  </span>
                                )}
                              </div>

                              {/* Company + meta pills (location, job type, work mode) */}
                              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                                {/* Company (plain text + icon) */}
                                <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                  {companyLabel}
                                </span>

                                {/* Location pill – primary tone (#172965) */}
                                <span
                                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                                  style={{
                                    borderColor: "#172965",
                                    backgroundColor: "#1729650d",
                                    color: "#172965",
                                  }}
                                >
                                  <MapPin
                                    className="h-3.5 w-3.5"
                                    style={{ color: "#172965" }}
                                  />
                                  <span>{locationLabel}</span>
                                </span>

                                {/* Job type pill – subtle neutral, coloured icon */}
                                {employmentLabel && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                    <BriefcaseBusiness className="h-3.5 w-3.5 text-amber-600" />
                                    <span>{employmentLabel}</span>
                                  </span>
                                )}

                                {/* Work mode pill – subtle neutral, different accent */}
                                {locationTypeLabel && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                    <Clock className="h-3.5 w-3.5 text-sky-600" />
                                    <span>{locationTypeLabel}</span>
                                  </span>
                                )}
                              </div>

                              {/* Short description */}
                              {shortDescription && (
                                <p className="line-clamp-2 text-[11px] text-slate-600">
                                  {shortDescription}
                                </p>
                              )}

                              {/* Tags row */}
                              {tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">
                                    <TagIcon className="h-3 w-3 text-slate-400" />
                                    Tags
                                  </span>
                                  {tags.map((tag: string) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center rounded-full bg-[#E5F0FF] px-2 py-0.5 text-[10px] font-medium text-slate-700"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Right CTA – visible on all screen sizes */}
                            <div className="flex items-center self-start pt-2 pl-0 text-[11px] font-medium text-[var(--jobs-accent)] sm:self-auto sm:pt-0 sm:pl-3">
                              <span className="inline-flex items-center gap-1">
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

            {/* Subtle footer – quiet ThinkATS tag only */}
            <footer className="mt-2 flex items-center justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-500">
              <span>
                Jobs powered by{" "}
                <span className="font-semibold text-slate-700">
                  ThinkATS
                </span>
                .
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
        </section>
      </div>
    </main>
  );
}
