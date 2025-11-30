// app/jobs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open roles | Resourcin & ThinkATS",
  description:
    "Explore open roles curated by Resourcin and its clients across Nigeria, Africa and beyond.",
};

interface JobsPageSearchParams {
  q?: string | string[];
  location?: string | string[];
  department?: string | string[];
  workMode?: string | string[];
  src?: string | string[]; // 👈 carry tracking source through
}

function formatWorkMode(value?: string | null) {
  if (!value) return "";
  const map: Record<string, string> = {
    onsite: "Onsite",
    hybrid: "Hybrid",
    remote: "Remote",
    field_based: "Field-based",
  };
  const key = value.toLowerCase();
  return map[key] || value;
}

function formatEmploymentType(value?: string | null) {
  if (!value) return "";
  const map: Record<string, string> = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract",
    temporary: "Temporary",
    internship: "Internship",
    consulting: "Consulting / Advisory",
  };
  const key = value.toLowerCase();
  return map[key] || value;
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PublicJobsPage({
  searchParams,
}: {
  searchParams?: JobsPageSearchParams;
}) {
  const rawQ = searchParams?.q ?? "";
  const q =
    Array.isArray(rawQ) && rawQ.length > 0
      ? rawQ[0]
      : typeof rawQ === "string"
      ? rawQ
      : "";

  const rawLocation = searchParams?.location ?? "all";
  const locationFilter =
    Array.isArray(rawLocation) && rawLocation.length > 0
      ? rawLocation[0]
      : typeof rawLocation === "string"
      ? rawLocation
      : "all";

  const rawDepartment = searchParams?.department ?? "all";
  const departmentFilter =
    Array.isArray(rawDepartment) && rawDepartment.length > 0
      ? rawDepartment[0]
      : typeof rawDepartment === "string"
      ? rawDepartment
      : "all";

  const rawWorkMode = searchParams?.workMode ?? "all";
  const workModeFilter =
    Array.isArray(rawWorkMode) && rawWorkMode.length > 0
      ? rawWorkMode[0]
      : typeof rawWorkMode === "string"
      ? rawWorkMode
      : "all";

  // 🔹 Tracking source (for multi-tenant / attribution)
  const rawSrcParam =
    typeof searchParams?.src === "string"
      ? searchParams.src
      : Array.isArray(searchParams?.src)
      ? searchParams.src[0]
      : undefined;

  const trackingSourceParam =
    rawSrcParam && rawSrcParam.trim().length > 0
      ? rawSrcParam.trim().toUpperCase()
      : undefined;

  // -----------------------------
  // Load all public + open jobs
  // -----------------------------
  const jobs = await prisma.job.findMany({
    where: {
      status: "open",
      visibility: "public",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      clientCompany: true,
      tenant: true, // 👈 so we can show tenant logos & names
    },
  });

  // Build filter options
  const locations = Array.from(
    new Set(
      jobs
        .map((job) => job.location || "")
        .filter((loc) => loc.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const departments = Array.from(
    new Set(
      jobs
        .map((job: any) => (job.department as string | null) || "")
        .filter((d) => d.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const workModes = Array.from(
    new Set(
      jobs
        .map(
          (job: any) =>
            (job.workMode as string | null) || job.locationType || "",
        )
        .filter((wm) => wm.trim().length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  // -----------------------------
  // Apply filters in-memory
  // -----------------------------
  const filteredJobs = jobs.filter((job: any) => {
    let ok = true;

    if (locationFilter !== "all") {
      ok = ok && job.location === locationFilter;
    }

    if (departmentFilter !== "all") {
      ok = ok && job.department === departmentFilter;
    }

    if (workModeFilter !== "all") {
      const wm = (job.workMode as string | null) || job.locationType || "";
      ok = ok && wm === workModeFilter;
    }

    if (q) {
      const haystack = (
        job.title +
        " " +
        (job.location || "") +
        " " +
        (job.department || "") +
        " " +
        (job.clientCompany?.name || "") +
        " " +
        (job.overview || "") +
        " " +
        (job.description || "")
      ).toLowerCase();
      ok = ok && haystack.includes(q.toLowerCase());
    }

    return ok;
  });

  const totalJobs = jobs.length;
  const visibleJobs = filteredJobs.length;

  // Helper for public URL (slug if present, else id) + carry src if set
  function jobPublicUrl(job: any) {
    const basePath = job.slug
      ? `/jobs/${encodeURIComponent(job.slug)}`
      : `/jobs/${job.id}`;

    if (!trackingSourceParam) return basePath;

    const connector = basePath.includes("?") ? "&" : "?";
    return `${basePath}${connector}src=${encodeURIComponent(
      trackingSourceParam,
    )}`;
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-0">
        {/* Hero */}
        <section className="mb-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFC000]">
                Careers
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-[#172965] sm:text-3xl">
                Roles curated by Resourcin &amp; ThinkATS
              </h1>
              <p className="mt-3 text-sm text-slate-600">
                Live mandates across Nigeria, Africa and beyond. These roles
                have been vetted with hiring teams and come with clear
                expectations, transparent processes and support from our talent
                advisors.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {visibleJobs} of {totalJobs} open roles currently visible based
                on your filters.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl bg-[#172965] px-4 py-3 text-xs text-slate-100 sm:w-64">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FFC000]">
                How we work with candidates
              </p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                  <span>
                    No blanket “CV pools” – you&apos;re considered for real
                    roles.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                  <span>
                    Structured interview processes with clear feedback paths.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-[#64C247]" />
                  <span>We never share your details without your consent.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <form
            method="GET"
            className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="flex-1">
                <label
                  htmlFor="q"
                  className="mb-1 block text-[11px] font-medium text-slate-600"
                >
                  Search roles
                </label>
                <div className="relative">
                  <input
                    id="q"
                    name="q"
                    type="text"
                    defaultValue={q}
                    placeholder="Search by title, company, location or keywords..."
                    className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px] text-slate-400">
                    ⌕
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="sm:w-40">
                <label
                  htmlFor="location"
                  className="mb-1 block text-[11px] font-medium text-slate-600"
                >
                  Location
                </label>
                <select
                  id="location"
                  name="location"
                  defaultValue={locationFilter || "all"}
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                >
                  <option value="all">All locations</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div className="sm:w-40">
                <label
                  htmlFor="department"
                  className="mb-1 block text-[11px] font-medium text-slate-600"
                >
                  Function
                </label>
                <select
                  id="department"
                  name="department"
                  defaultValue={departmentFilter || "all"}
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                >
                  <option value="all">All functions</option>
                  {departments.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work mode */}
              <div className="sm:w-40">
                <label
                  htmlFor="workMode"
                  className="mb-1 block text-[11px] font-medium text-slate-600"
                >
                  Work style
                </label>
                <select
                  id="workMode"
                  name="workMode"
                  defaultValue={workModeFilter || "all"}
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-[#172965] focus:bg-white focus:ring-1 focus:ring-[#172965]"
                >
                  <option value="all">All styles</option>
                  {workModes.map((wm) => (
                    <option key={wm} value={wm}>
                      {formatWorkMode(wm)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-[#172965] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#12204d]"
              >
                Apply filters
              </button>

              {(q ||
                locationFilter !== "all" ||
                departmentFilter !== "all" ||
                workModeFilter !== "all") && (
                <Link
                  href="/jobs"
                  className="text-[11px] text-slate-500 hover:text-slate-800"
                >
                  Clear all
                </Link>
              )}
            </div>
          </form>
        </section>

        {/* Jobs list */}
        {visibleJobs === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            <p>No roles match the current filters.</p>
            <p className="mt-1 text-[11px]">
              Try removing some filters or check back soon as we add new
              opportunities regularly.
            </p>
          </section>
        ) : (
          <section className="space-y-3">
            {filteredJobs.map((job: any) => {
              const tenant = job.tenant;
              const client = job.clientCompany;

              const tenantName = tenant?.name ?? null;
              const tenantLogoUrl = tenant?.logoUrl ?? null;
              const clientName = client?.name ?? null;
              const clientLogoUrl = client?.logoUrl ?? null;

              const companyName =
                clientName || tenantName || "Confidential client";
              const location = job.location || "Location flexible";
              const workModeValue =
                (job.workMode as string | null) ||
                (job.locationType as string | null) ||
                null;
              const workModeLabel =
                formatWorkMode(workModeValue) || undefined;
              const employmentLabel =
                formatEmploymentType(job.employmentType) ||
                undefined;
              const posted = formatDate(job.createdAt);
              const snippet =
                job.overview ||
                job.description ||
                "This is a live role with a detailed specification available on the next page.";

              return (
                <article
                  key={job.id}
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-[#172965]/70 hover:shadow-md sm:flex-row sm:items-stretch"
                >
                  {/* Left: brand + meta */}
                  <div className="min-w-0 flex-1">
                    {/* Brand logos (tenant + client) */}
                    <div className="mb-2">
                      <BrandCluster
                        tenantName={tenantName}
                        tenantLogoUrl={tenantLogoUrl}
                        clientName={clientName}
                        clientLogoUrl={clientLogoUrl}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-semibold text-slate-900 group-hover:text-[#172965]">
                        {job.title}
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-[#E9F7EE] px-2 py-0.5 text-[10px] font-medium text-[#306B34]">
                        Actively hiring
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-slate-600">
                      {companyName}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      <span>{location}</span>
                      {workModeLabel && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{workModeLabel}</span>
                        </>
                      )}
                      {employmentLabel && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{employmentLabel}</span>
                        </>
                      )}
                      {job.department && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{job.department}</span>
                        </>
                      )}
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs text-slate-700">
                      {snippet}
                    </p>

                    <p className="mt-2 text-[11px] text-slate-400">
                      Posted {posted}
                    </p>
                  </div>

                  {/* Right: CTA */}
                  <div className="flex w-full flex-col items-stretch justify-between gap-2 sm:w-52 sm:items-end">
                    <div className="flex flex-wrap justify-start gap-1 text-[10px] sm:justify-end">
                      <span className="inline-flex items-center rounded-full bg-[#FFF7DF] px-2 py-0.5 font-medium text-[#9A7300]">
                        Curated by Resourcin
                      </span>
                      {job.internalOnly && (
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-600">
                          Internal only
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                      <Link
                        href={jobPublicUrl(job)}
                        className="inline-flex items-center rounded-full bg-[#172965] px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#12204d]"
                      >
                        View &amp; apply
                        <span className="ml-1.5 text-[10px] opacity-80">
                          ↗
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}

type BrandClusterProps = {
  tenantName: string | null;
  tenantLogoUrl: string | null;
  clientName: string | null;
  clientLogoUrl: string | null;
};

function BrandCluster({
  tenantName,
  tenantLogoUrl,
  clientName,
  clientLogoUrl,
}: BrandClusterProps) {
  const primary = clientName || tenantName || "Confidential client";
  const secondary =
    clientName && tenantName ? `via ${tenantName}` : null;

  const tenantInitial =
    (tenantName?.charAt(0)?.toUpperCase?.() as string) || "T";
  const clientInitial =
    (clientName?.charAt(0)?.toUpperCase?.() as string) || "C";

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        <BrandAvatar
          logoUrl={tenantLogoUrl}
          fallback={tenantInitial}
          tint="blue"
          size="md"
        />
        {clientName && (
          <BrandAvatar
            logoUrl={clientLogoUrl}
            fallback={clientInitial}
            tint="green"
            size="sm"
          />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold text-slate-900">
          {primary}
        </span>
        {secondary && (
          <span className="text-[10px] text-slate-500">{secondary}</span>
        )}
      </div>
    </div>
  );
}

function BrandAvatar({
  logoUrl,
  fallback,
  tint = "blue",
  size = "md",
}: {
  logoUrl: string | null;
  fallback: string;
  tint?: "blue" | "green";
  size?: "md" | "sm";
}) {
  const sizeClasses =
    size === "md" ? "h-8 w-8 text-[11px]" : "h-6 w-6 text-[10px]";
  const bgClass =
    tint === "blue"
      ? "bg-[#172965]/5 text-[#172965]"
      : "bg-[#64C247]/10 text-[#306B34]";

  if (logoUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-md border border-slate-200 bg-white ${sizeClasses}`}
      >
        <Image
          src={logoUrl}
          alt="Logo"
          fill
          sizes={size === "md" ? "32px" : "24px"}
          className="object-contain p-0.5"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-md border border-slate-200 ${bgClass} ${sizeClasses}`}
    >
      {fallback}
    </div>
  );
}
