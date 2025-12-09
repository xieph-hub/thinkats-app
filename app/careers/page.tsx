// app/careers/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers | ThinkATS",
  description:
    "Branded careers pages powered by ThinkATS, showing open roles for each client workspace.",
};

type JobRow = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  employmentType: string | null;
  seniority: string | null;
  workMode: string | null;
  shortDescription: string | null;
};

function normaliseStatus(status: string | null | undefined): string {
  return (status || "").toLowerCase();
}

function humanizeToken(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(
      (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join(" ");
}

function formatEmploymentType(value?: string | null) {
  if (!value) return "";
  return humanizeToken(value);
}

function formatSeniority(value?: string | null) {
  if (!value) return "";
  return humanizeToken(value);
}

function formatWorkMode(value?: string | null) {
  if (!value) return "";
  return humanizeToken(value);
}

export default async function CareersPage() {
  // --- Host awareness: figure out if we're on root or a tenant subdomain ----
  const h = headers();
  const hostHeader = h.get("host") || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thinkats.com";

  // Base/primary hostname from env, e.g. "thinkats.com" or "www.thinkats.com"
  let primaryHostname = "thinkats.com";
  try {
    primaryHostname = new URL(siteUrl).hostname.replace(/^www\./i, "");
  } catch {
    // ignore, fall back to default
  }

  const rawHostname = hostHeader.split(":")[0] || primaryHostname;
  const hostname = rawHostname.toLowerCase().replace(/^www\./i, "");

  const isPrimaryHost = hostname === primaryHostname;
  const isTenantHost =
    !isPrimaryHost && hostname.endsWith(`.${primaryHostname}`);

  // On root/marketing or unknown hosts → soft message, no redirect / no 404
  if (!isTenantHost) {
    const rootJobsHref = "/jobs";

    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Careers
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            Careers page not configured
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            This careers URL isn&apos;t linked to an active ThinkATS workspace
            yet. It may be part of a future client setup or a testing
            environment.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={rootJobsHref}
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Browse jobs on ThinkATS
            </Link>
            <Link
              href="https://www.thinkats.com"
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Visit ThinkATS
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // We are on something like "tenantSlug.thinkats.com"
  const tenantSlug = hostname.replace(`.${primaryHostname}`, "");

  // Look up the tenant by slug
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  });

  if (!tenant) {
    // Host resolves but we don't have a tenant row for this slug
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Careers
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            Workspace not found
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            We couldn&apos;t find an active ThinkATS workspace connected to this
            careers URL. It might have been deactivated or is still being set
            up.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="https://www.thinkats.com"
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Contact ThinkATS
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Careers settings + open jobs for this tenant
  const [settings, jobsRaw] = await Promise.all([
    prisma.careerSiteSettings.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.job.findMany({
      where: {
        tenantId: tenant.id,
        status: "open",
        visibility: "public",
        OR: [{ internalOnly: false }, { internalOnly: null }],
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
        workMode: true,
        shortDescription: true,
      },
    }),
  ]);

  const tenantStatus = normaliseStatus(tenant.status);
  const isActive = tenantStatus === "active";

  const isPublic = settings?.isPublic ?? true;
  const primaryColor = settings?.primaryColorHex || "#172965";
  const accentColor = settings?.accentColorHex || "#FFC000";
  const heroBackground = settings?.heroBackgroundHex || "#F5F6FA";
  const logoUrl = settings?.logoUrl || null;
  const heroTitle =
    settings?.heroTitle ||
    `Careers at ${tenant.name || tenant.slug || "our company"}`;
  const heroSubtitle =
    settings?.heroSubtitle ||
    "Join a team that cares about meaningful work and thoughtful hiring.";
  const aboutHtml = settings?.aboutHtml ?? "";

  const jobs = jobsRaw as JobRow[];
  const jobsCount = jobs.length;

  const careersUrl = `https://${hostname}/careers`;

  // Inactive tenant or careers switched off → clear message
  if (!isActive || !isPublic) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Careers · {tenant.name || tenant.slug || "Workspace"}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            Careers page is not public
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            This employer&apos;s careers page is currently not visible to the
            public. They may be in a stealth hiring phase or have paused
            recruitment.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            If you received this link from a recruiter, please reach out to them
            directly for the latest status.
          </p>
        </div>
      </main>
    );
  }

  // ------------------------- Render careers page -----------------------------
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HERO */}
      <section
        className="border-b border-slate-200"
        style={{ backgroundColor: heroBackground }}
      >
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={tenant.name || "Company logo"}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span
                    className="text-lg font-semibold"
                    style={{ color: primaryColor }}
                  >
                    {(tenant.name || tenant.slug || "T")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: accentColor }}
                >
                  Careers
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  {heroTitle}
                </h1>
                <p className="max-w-xl text-sm text-slate-700">
                  {heroSubtitle}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                    Powered by ThinkATS
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] text-slate-600">
                    {jobsCount > 0
                      ? `${jobsCount} open role${jobsCount === 1 ? "" : "s"}`
                      : "No open roles right now"}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] text-slate-600">
                    {careersUrl}
                  </span>
                </div>
              </div>
            </div>

            {jobsCount > 0 && (
              <div className="flex flex-col items-stretch gap-2 sm:w-56">
                <a
                  href="#open-roles"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                  style={{ backgroundColor: primaryColor }}
                >
                  View open roles
                </a>
                <p className="text-[11px] text-slate-500">
                  Browse live opportunities and submit your application directly
                  from this page.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] lg:gap-10">
          {/* LEFT: About + roles */}
          <div className="space-y-8">
            {/* About section */}
            {aboutHtml && aboutHtml.trim().length > 0 && (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                  About the organisation
                </h2>
                <div
                  className="prose prose-sm mt-3 max-w-none text-slate-700 prose-p:mb-2 prose-p:mt-0 prose-ul:mt-1 prose-li:mt-0.5"
                  dangerouslySetInnerHTML={{ __html: aboutHtml }}
                />
              </article>
            )}

            {/* Open roles */}
            <section id="open-roles" className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Open roles
                </h2>
                {jobsCount > 0 && (
                  <p className="text-[11px] text-slate-500">
                    Showing {jobsCount} role{jobsCount === 1 ? "" : "s"}
                  </p>
                )}
              </div>

              {jobsCount === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-600">
                  <p>
                    There are currently no open roles listed for this
                    organisation.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Check back later or follow this employer on LinkedIn or
                    their website for future opportunities.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => {
                    const employmentType = formatEmploymentType(
                      job.employmentType,
                    );
                    const seniority = formatSeniority(job.seniority);
                    const workMode = formatWorkMode(job.workMode);
                    const href = `/jobs/${encodeURIComponent(
                      job.slug || job.id,
                    )}`;

                    return (
                      <Link
                        key={job.id}
                        href={href}
                        className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-slate-900">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                              {job.location && (
                                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
                                  {job.location}
                                </span>
                              )}
                              {workMode && (
                                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
                                  {workMode}
                                </span>
                              )}
                              {employmentType && (
                                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
                                  {employmentType}
                                </span>
                              )}
                              {seniority && (
                                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5">
                                  {seniority}
                                </span>
                              )}
                            </div>
                            {job.shortDescription && (
                              <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">
                                {job.shortDescription}
                              </p>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-700 sm:mt-0">
                            <span>View role</span>
                            <span aria-hidden="true">↗</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT: Info card */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Careers page
              </h2>
              <p className="mt-2 text-xs text-slate-600">
                This page is managed by{" "}
                <span className="font-medium">
                  {tenant.name || tenant.slug || "this organisation"}
                </span>{" "}
                and powered by ThinkATS.
              </p>
              <dl className="mt-3 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Workspace status</dt>
                  <dd className="text-right font-medium text-emerald-700">
                    Active
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Careers URL</dt>
                  <dd className="truncate text-right text-[10px] text-slate-700">
                    {careersUrl}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Jobs listed here</dt>
                  <dd className="text-right font-medium text-slate-800">
                    {jobsCount}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-[10px] text-slate-500">
                If you&apos;re an admin for this workspace, you can change the
                branding and copy from the ATS under{" "}
                <span className="font-medium">
                  Tenant settings → Career site
                </span>
                .
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
