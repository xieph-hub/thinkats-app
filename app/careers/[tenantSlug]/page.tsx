// app/careers/[tenantSlug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers | ThinkATS",
  description: "Explore roles at companies hiring on ThinkATS.",
};

type TenantCareersPageProps = {
  params: {
    tenantSlug: string;
  };
};

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

export default async function TenantCareersPage({
  params,
}: TenantCareersPageProps) {
  const slug = decodeURIComponent(params.tenantSlug);

  // 1) Resolve tenant by slug
  const tenant = await prisma.tenant.findFirst({
    where: { slug },
  });

  if (!tenant) {
    notFound();
  }

  // 2) Load careersite settings (branding, copy, marketplace flag, etc.)
  const settings = await prisma.careerSiteSettings.findFirst({
    where: { tenantId: tenant.id },
  });

  // Respect the "Careers page is public" toggle from /ats/tenants/[id]/careersite
  const isPublic = settings?.isPublic ?? true;
  if (!isPublic) {
    notFound();
  }

  // 3) Brand customisation — safe even if these fields don't exist yet.
  const settingsAny = settings as any;

  const primaryColor: string =
    settingsAny?.primaryColorHex || "#172965"; // ThinkATS deep blue
  const accentColor: string =
    settingsAny?.accentColorHex || "#FFC000"; // ThinkATS yellow
  const heroBackground: string =
    settingsAny?.heroBackgroundHex || "#ffffff";

  // Prefer a careersite-specific logo, then tenant-level logo, then an initial
  const logoUrl: string | null =
    (settingsAny?.logoUrl as string | undefined) ||
    (tenant.logoUrl as string | null) ||
    null;

  // 4) Load this tenant's public, open jobs (careers site always shows them
  //    if they are public + open, regardless of marketplace flag)
  const jobs = await prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      status: "open",
      visibility: "public",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalJobs = jobs.length;

  const heroTitle =
    settings?.heroTitle ||
    `Careers at ${tenant.name || tenant.slug || "our company"}`;
  const heroSubtitle =
    settings?.heroSubtitle ||
    "Explore open roles and opportunities to join the team.";

  const aboutHtml =
    settings?.aboutHtml ||
    `<p>We use ThinkATS to manage our hiring process. Every application is reviewed by a real hiring team member, and you can expect a structured, respectful interview experience.</p>`;

  // Tracking source for job detail (so /jobs/[id] knows it came from this careers page)
  const trackingSource = `CAREERS_${(tenant.slug || tenant.id).toUpperCase()}`;

  function jobPublicUrl(job: any) {
    const basePath = job.slug
      ? `/jobs/${encodeURIComponent(job.slug)}`
      : `/jobs/${job.id}`;

    const connector = basePath.includes("?") ? "&" : "?";
    return `${basePath}${connector}src=${encodeURIComponent(trackingSource)}`;
  }

  const companyLabel = tenant.name || tenant.slug || "Company";

  return (
    <div
      className="min-h-screen bg-[#F5F6FA]"
      style={{ backgroundColor: "#F5F6FA" }}
    >
      <div className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:px-6 lg:px-0">
        {/* Hero */}
        <section
          className="mb-8 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur-sm sm:p-8"
          style={{ backgroundColor: heroBackground }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              {/* Logo / avatar */}
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={`${companyLabel} logo`}
                    width={64}
                    height={64}
                    sizes="64px"
                    className="h-14 w-14 object-contain"
                    priority
                  />
                ) : (
                  <span
                    className="text-2xl font-semibold"
                    style={{ color: primaryColor }}
                  >
                    {companyLabel.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="max-w-xl">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: accentColor }}
                >
                  Careers
                </p>
                <h1
                  className="mt-1 text-2xl font-semibold sm:text-3xl"
                  style={{ color: primaryColor }}
                >
                  {heroTitle}
                </h1>
                {tenant.name && (
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    {tenant.name}
                  </p>
                )}
                <p className="mt-3 text-sm text-slate-700">
                  {heroSubtitle}
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  {totalJobs === 0
                    ? "No open roles at the moment."
                    : `${totalJobs} open ${
                        totalJobs === 1 ? "role" : "roles"
                      } currently accepting applications.`}
                </p>
              </div>
            </div>

            <div
              className="space-y-3 rounded-2xl px-4 py-3 text-xs text-slate-100 sm:w-64"
              style={{ backgroundColor: "#172965" }} // Keep ThinkATS brand here
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FFC000]">
                Powered by ThinkATS
              </p>
              <p className="text-xs">
                This careers site is powered by ThinkATS. Applications go
                directly into the company&apos;s ATS workspace with structured
                pipelines and clear interview stages.
              </p>
              <p className="text-[11px] text-slate-200">
                You&apos;ll create a simple candidate profile once, then can be
                considered for multiple suitable roles.
              </p>
              <Link
                href="/jobs"
                className="inline-flex items-center text-[11px] font-medium text-[#FFC000] hover:text-white"
              >
                Browse all jobs on ThinkATS
                <span className="ml-1 text-[10px]">↗</span>
              </Link>
            </div>
          </div>
        </section>

        {/* About section */}
        <section className="mb-8 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Working here
            </h2>
            <div
              className="prose prose-sm max-w-none text-slate-700 prose-p:mb-2 prose-ul:mt-1 prose-ul:list-disc prose-ul:pl-4"
              dangerouslySetInnerHTML={{ __html: aboutHtml }}
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-600 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Hiring process at a glance
            </h3>
            <ol className="mt-2 space-y-1.5 list-decimal pl-4">
              <li>Submit your application via the relevant role.</li>
              <li>Screening by the hiring team using ThinkATS pipelines.</li>
              <li>Interviews and assessments where relevant.</li>
              <li>Decision and feedback shared as soon as possible.</li>
            </ol>
            <p className="mt-2 text-[11px] text-slate-500">
              Specific steps may vary by role, but you can expect clear
              communication and structured interviews.
            </p>
          </div>
        </section>

        {/* Jobs list */}
        {totalJobs === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            <p>No open roles are currently listed on this careers site.</p>
            <p className="mt-1 text-[11px]">
              You can still{" "}
              <Link
                href="/jobs"
                className="font-medium text-[#172965] hover:underline"
              >
                explore other roles on ThinkATS
              </Link>{" "}
              or check back soon.
            </p>
          </section>
        ) : (
          <section className="space-y-3">
            {jobs.map((job: any) => {
              const location = job.location || "Location flexible";
              const workModeValue =
                (job.workMode as string | null) ||
                (job.locationType as string | null) ||
                null;
              const workModeLabel =
                formatWorkMode(workModeValue) || undefined;
              const employmentLabel =
                formatEmploymentType(job.employmentType) || undefined;
              const posted = formatDate(job.createdAt);
              const snippet =
                job.shortDescription ||
                job.overview ||
                job.description ||
                "This is a live role with a detailed specification available on the next page.";

              return (
                <article
                  key={job.id}
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-xs text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-stretch"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-semibold text-slate-900 group-hover:text-slate-900">
                        {job.title}
                      </h2>
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: accentColor,
                          color: "#111827",
                        }}
                      >
                        Actively hiring
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
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

                  <div className="flex w-full flex-col items-stretch justify-between gap-2 sm:w-52 sm:items-end">
                    <div className="flex flex-wrap justify-start gap-1 text-[10px] sm:justify-end">
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-600">
                        Careers site
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                      <Link
                        href={jobPublicUrl(job)}
                        className="inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:opacity-90"
                        style={{ backgroundColor: primaryColor }}
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
