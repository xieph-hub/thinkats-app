// components/careers/CareersPageRenderer.tsx
import Link from "next/link";
import type {
  Tenant,
  ClientCompany,
  CareerSiteSettings,
} from "@prisma/client";
import CareersShell from "./CareersShell";

type HostContextLike = {
  host: string;
  isAppHost: boolean;
  isTenantHost: boolean;
  isCareersiteHost: boolean;
  tenant: Tenant | null;
  clientCompany: ClientCompany | null;
  careerSiteSettings: CareerSiteSettings | null;
};

type JobForCareers = {
  id: string;
  title: string;
  slug: string | null;
  location: string | null;
  department: string | null;
  employmentType: string | null;
  locationType: string | null;
  shortDescription?: string | null;
  createdAt?: Date | string;
  clientCompany?: {
    name: string | null;
  } | null;
};

type CareersPageRendererProps = {
  hostContext: HostContextLike;
  page: "home" | "careers" | "jobs";
  jobs?: JobForCareers[];
};

function formatDate(value: Date | string | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function JobsGrid({
  jobs,
  accentColor,
  compact,
}: {
  jobs: JobForCareers[];
  accentColor: string;
  compact?: boolean;
}) {
  if (!jobs.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        No open roles right now. Check back soon or follow the company on
        social to stay in the loop.
      </div>
    );
  }

  const displayJobs = compact ? jobs.slice(0, 4) : jobs;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        {displayJobs.map((job) => {
          const href = `/jobs/${encodeURIComponent(job.slug ?? job.id)}`;
          const labelCompany = job.clientCompany?.name ?? null;
          return (
            <article
              key={job.id}
              className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white/90 p-3 text-sm text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    <Link href={href} className="hover:underline">
                      {job.title}
                    </Link>
                  </h3>
                  {labelCompany && (
                    <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                      {labelCompany}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                  {job.location && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                      {job.location}
                    </span>
                  )}
                  {job.locationType && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
                      {job.locationType}
                    </span>
                  )}
                  {job.employmentType && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
                      {job.employmentType}
                    </span>
                  )}
                  {job.department && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5">
                      {job.department}
                    </span>
                  )}
                </div>

                {job.shortDescription && (
                  <p className="mt-1 line-clamp-3 text-[13px] text-slate-600">
                    {job.shortDescription}
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Posted{" "}
                  <span className="font-medium">
                    {formatDate(job.createdAt)}
                  </span>
                </span>
                <Link
                  href={href}
                  className="inline-flex items-center gap-1 text-[11px] font-medium"
                  style={{ color: accentColor }}
                >
                  View role
                  <span aria-hidden>↗</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {compact && jobs.length > displayJobs.length && (
        <p className="text-xs text-slate-500">
          Showing {displayJobs.length} of {jobs.length} roles.
        </p>
      )}
    </div>
  );
}

export default function CareersPageRenderer({
  hostContext,
  page,
  jobs = [],
}: CareersPageRendererProps) {
  const {
    host,
    isAppHost,
    isTenantHost,
    isCareersiteHost,
    tenant,
    clientCompany,
    careerSiteSettings,
  } = hostContext;

  const name =
    clientCompany?.name ??
    tenant?.name ??
    (isAppHost ? "ThinkATS" : host.replace(/^www\./i, ""));

  const primaryColor = careerSiteSettings?.primaryColorHex ?? "#172965";
  const accentColor = careerSiteSettings?.accentColorHex ?? "#FFC000";
  const heroBackground = careerSiteSettings?.heroBackgroundHex ?? "#F4F5FB";

  const heroTitle =
    careerSiteSettings?.heroTitle ??
    (isAppHost
      ? "Careers powered by ThinkATS"
      : `Careers at ${name}`);

  const heroSubtitle =
    careerSiteSettings?.heroSubtitle ??
    (isAppHost
      ? "Explore roles from modern organisations using ThinkATS to hire thoughtfully."
      : "Explore current opportunities and be part of what we’re building.");

  const aboutHtml = careerSiteSettings?.aboutHtml ?? "";
  const hasAbout = !!aboutHtml.trim();

  const isTenantExperience = isTenantHost || isCareersiteHost || !!tenant;

  const jobsCount = jobs.length;

  // Route helpers for nav (tenant subdomain vs main host)
  const jobsHref = isTenantExperience ? "/jobs" : "/careers";
  const allJobsHref = isTenantExperience ? "/jobs" : "/careers";

  return (
    <CareersShell
      tenant={tenant}
      clientCompany={clientCompany}
      settings={careerSiteSettings}
      host={host}
      isAppHost={isAppHost}
      isTenantHost={isTenantHost}
      isCareersiteHost={isCareersiteHost}
    >
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Left: hero + jobs */}
        <section className="space-y-5 border-b border-slate-100 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
          {/* Hero */}
          <div
            className="rounded-xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm"
            style={{ backgroundColor: heroBackground }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {isTenantExperience ? "Careers" : "Marketplace"}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {heroTitle}
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-700">
              {heroSubtitle}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
                {jobsCount > 0
                  ? `${jobsCount} open role${jobsCount === 1 ? "" : "s"}`
                  : "No open roles currently"}
              </span>

              {isTenantExperience && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                  {tenant?.country || "Global"}
                </span>
              )}
            </div>

            {jobsCount > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <Link
                  href={jobsHref}
                  className="inline-flex items-center justify-center rounded-full px-3 py-1 font-medium text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  View all roles
                </Link>
                <a
                  href="#open-roles"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-medium text-slate-700 hover:bg-white"
                >
                  Jump to openings
                </a>
              </div>
            )}
          </div>

          {/* Jobs listing block */}
          <div id="open-roles" className="space-y-2">
            {(page === "jobs" || page === "careers") && (
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  Open roles
                </h2>
                {jobsCount > 0 && (
                  <p className="text-[11px] text-slate-500">
                    Showing {jobsCount} role{jobsCount === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            )}

            {page === "jobs" ? (
              <JobsGrid jobs={jobs} accentColor={accentColor} />
            ) : (
              <JobsGrid jobs={jobs} accentColor={accentColor} compact />
            )}

            {page !== "jobs" && jobsCount > 4 && (
              <div className="mt-2 text-right text-[11px]">
                <Link
                  href={allJobsHref}
                  className="font-medium hover:underline"
                  style={{ color: accentColor }}
                >
                  View all roles
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Right: culture / story / meta */}
        <aside className="space-y-4 lg:pl-2">
          <div className="rounded-xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-700">
            <h2 className="text-sm font-semibold text-slate-900">
              Life at {name}
            </h2>
            {hasAbout ? (
              <div
                className="prose prose-sm mt-2 max-w-none text-slate-700 prose-p:mb-2 prose-p:mt-0"
                dangerouslySetInnerHTML={{ __html: aboutHtml }}
              />
            ) : (
              <p className="mt-2 text-[13px] text-slate-600">
                This space is for culture, values and what it feels like to work
                at {name}. You can manage this content from the careers site
                editor inside your ATS workspace.
              </p>
            )}
          </div>

          {/* Social / meta card from CareerSiteSettings */}
          {(careerSiteSettings?.linkedinUrl ||
            careerSiteSettings?.twitterUrl ||
            careerSiteSettings?.instagramUrl) && (
            <div className="rounded-xl border border-slate-200 bg-white/90 p-4 text-[13px] text-slate-700">
              <h3 className="text-sm font-semibold text-slate-900">
                Stay connected
              </h3>
              <p className="mt-1 text-[12px] text-slate-500">
                Follow {name} to hear about new roles and what the team is up
                to.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
                {careerSiteSettings.linkedinUrl && (
                  <a
                    href={careerSiteSettings.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 hover:bg-slate-50"
                  >
                    <span>LinkedIn</span>
                    <span aria-hidden>↗</span>
                  </a>
                )}
                {careerSiteSettings.twitterUrl && (
                  <a
                    href={careerSiteSettings.twitterUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 hover:bg-slate-50"
                  >
                    <span>X / Twitter</span>
                    <span aria-hidden>↗</span>
                  </a>
                )}
                {careerSiteSettings.instagramUrl && (
                  <a
                    href={careerSiteSettings.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 hover:bg-slate-50"
                  >
                    <span>Instagram</span>
                    <span aria-hidden>↗</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Marketplace hint when on app host */}
          {isAppHost && !isTenantHost && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-[12px] text-slate-600">
              <p>
                This is the global careers entry point for roles managed on
                ThinkATS. Individual client careers sites live on their own
                subdomains, such as{" "}
                <span className="font-mono text-slate-800">
                  acme.thinkats.com/careers
                </span>
                .
              </p>
            </div>
          )}
        </aside>
      </div>
    </CareersShell>
  );
}
