// components/careers/CareersPageRenderer.tsx
import Link from "next/link";
import Image from "next/image";
import type {
  CareerSiteSettings,
  Job,
  CareerTheme,
  ClientCompany,
} from "@prisma/client";

// For now we keep this loose – it’s just JSON coming from CareerPage.layout.
// Later, if you stabilise the schema (sections, blocks, etc.), we can
// introduce a stricter shared type here.
type CareerLayout = unknown;

// Extend Job with the included clientCompany relation
type JobWithCompany = Job & {
  clientCompany?: ClientCompany | null;
};

type Props = {
  displayName: string;
  settings: CareerSiteSettings | null;
  theme: CareerTheme | null;
  layout: CareerLayout | null;
  jobs: JobWithCompany[];
  primaryColor: string;
  accentColor: string;
  assetBaseUrl: string | null;
};

function formatJobLocation(job: JobWithCompany) {
  const parts: string[] = [];
  if (job.location) parts.push(job.location);
  if (job.locationType) parts.push(job.locationType);
  return parts.join(" • ") || "Location flexible";
}

function formatEmployment(job: JobWithCompany) {
  const parts: string[] = [];
  if (job.employmentType) parts.push(job.employmentType);
  if (job.seniority) parts.push(job.seniority);
  return parts.join(" • ") || "Role";
}

function buildLogoUrl(
  explicitLogo: string | null,
  assetBaseUrl: string | null,
): string | null {
  if (explicitLogo) return explicitLogo;
  if (!assetBaseUrl) return null;
  // In future you can add per-tenant default logos here, e.g.
  // `${assetBaseUrl}/tenants/default-logo.png`
  return null;
}

export default function CareersPageRenderer({
  displayName,
  settings,
  theme,
  layout, // reserved for future use (JSON-driven layout)
  jobs,
  primaryColor,
  accentColor,
  assetBaseUrl,
}: Props) {
  const heroTitle =
    settings?.heroTitle || `Careers at ${displayName}`;
  const heroSubtitle =
    settings?.heroSubtitle ||
    "Join a team that is building, scaling, and transforming ambitious ideas into reality.";

  const aboutHtml = settings?.aboutHtml || null;

  const logoUrl = buildLogoUrl(settings?.logoUrl || null, assetBaseUrl);

  const hasJobs = jobs.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top shell / nav */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
                <Image
                  src={logoUrl}
                  alt={`${displayName} logo`}
                  fill
                  sizes="36px"
                  className="object-contain p-1.5"
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-xs font-semibold">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-sm font-semibold leading-tight">
                {displayName}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">
                Careers
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Reserved for social links or website */}
            {settings?.linkedinUrl && (
              <Link
                href={settings.linkedinUrl}
                target="_blank"
                className="text-slate-400 hover:text-slate-100"
              >
                LinkedIn
              </Link>
            )}
            {settings?.twitterUrl && (
              <Link
                href={settings.twitterUrl}
                target="_blank"
                className="text-slate-400 hover:text-slate-100"
              >
                X
              </Link>
            )}
            {settings?.instagramUrl && (
              <Link
                href={settings.instagramUrl}
                target="_blank"
                className="text-slate-400 hover:text-slate-100"
              >
                Instagram
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
        {/* Hero section */}
        <section className="grid gap-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:p-8">
          <div className="space-y-5">
            <p
              className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-300"
              style={{ borderColor: accentColor }}
            >
              We&apos;re hiring
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              {heroTitle}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-300">
              {heroSubtitle}
            </p>

            {aboutHtml && (
              <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-sm">
                {/* eslint-disable-next-line react/no-danger */}
                <div dangerouslySetInnerHTML={{ __html: aboutHtml }} />
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="#open-roles"
                className="inline-flex items-center rounded-full px-4 py-2 text-xs font-medium shadow-sm"
                style={{
                  backgroundColor: primaryColor,
                  color: "#f9fafb",
                }}
              >
                View open roles
              </a>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Applications reviewed by humans, not just algorithms.</span>
              </div>
            </div>
          </div>

          {/* Right side: highlight card */}
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Why join {displayName}?
            </h2>
            <ul className="space-y-2 text-[12px] text-slate-300">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                <span>Work on meaningful problems with real customer impact.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" />
                <span>Collaborate with a small, high-ownership team.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400" />
                <span>Grow your career in a modern, remote-friendly environment.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Jobs section */}
        <section id="open-roles" className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                Open roles
              </h2>
              <p className="text-xs text-slate-400">
                {hasJobs
                  ? "Browse active openings and apply in a few minutes."
                  : "There are no open roles right now. You can still share your profile for future opportunities."}
              </p>
            </div>
          </div>

          {hasJobs ? (
            <div className="space-y-3">
              {jobs.map((job) => {
                const href = job.slug
                  ? `/jobs/${job.slug}`
                  : `/jobs/${job.id}`;

                return (
                  <Link
                    key={job.id}
                    href={href}
                    className="block rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-sky-500/70 hover:bg-slate-900"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-50">
                            {job.title}
                          </h3>
                          {job.clientCompany && (
                            <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300">
                              {job.clientCompany.name}
                            </span>
                          )}
                        </div>
                        {job.shortDescription && (
                          <p className="text-xs text-slate-300 line-clamp-2">
                            {job.shortDescription}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                          <span className="inline-flex items-center rounded-full bg-slate-900/80 px-2 py-0.5">
                            {formatJobLocation(job)}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-900/80 px-2 py-0.5">
                            {formatEmployment(job)}
                          </span>
                          {job.workMode && (
                            <span className="inline-flex items-center rounded-full bg-slate-900/80 px-2 py-0.5">
                              {job.workMode}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row items-center gap-3 text-[11px] text-slate-300 sm:flex-col sm:items-end">
                        {job.salaryVisible &&
                          job.salaryCurrency &&
                          job.salaryMin &&
                          job.salaryMax && (
                            <div className="rounded-xl border border-slate-700/70 bg-slate-900/80 px-3 py-1.5 text-right">
                              <div className="font-medium">
                                {job.salaryCurrency} {job.salaryMin.toString()} –{" "}
                                {job.salaryCurrency} {job.salaryMax.toString()}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Estimated range
                              </div>
                            </div>
                          )}
                        <span
                          className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium"
                          style={{
                            backgroundColor: accentColor,
                            color: "#020617",
                          }}
                        >
                          View role
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-sm text-slate-300">
              There are no open roles at the moment. You can check back later or
              follow our social channels for updates.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
