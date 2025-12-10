// app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";

export const dynamic = "force-dynamic";

function normaliseWebsiteUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const hostContext = await getHostContext();
  const { tenant, clientCompany } = hostContext as any;

  const displayName =
    clientCompany?.name || tenant?.name || tenant?.slug || "ThinkATS";

  return {
    title: `${displayName} | Jobs hub`,
    description: `Explore jobs and updates for ${displayName}, powered by ThinkATS.`,
  };
}

export default async function RootPage() {
  const hostContext = await getHostContext();
  const { isAppHost, tenant, clientCompany, careerSiteSettings, host } =
    hostContext as any;

  // Main ThinkATS host or no tenant resolved → show marketing shell
  if (!tenant || isAppHost) {
    return <MarketingHome />;
  }

  const displayName =
    clientCompany?.name || tenant.name || tenant.slug || host;

  const logoUrl =
    (careerSiteSettings as any)?.logoUrl ||
    clientCompany?.logoUrl ||
    tenant.logoUrl ||
    null;

  const websiteRaw =
    (clientCompany as any)?.website || tenant.websiteUrl || null;
  const websiteUrl = normaliseWebsiteUrl(websiteRaw);

  const linkedinUrl = (careerSiteSettings as any)?.linkedinUrl || null;
  const twitterUrl = (careerSiteSettings as any)?.twitterUrl || null;
  const instagramUrl = (careerSiteSettings as any)?.instagramUrl || null;

  const scopeFilter = clientCompany?.id
    ? { tenantId: tenant.id, clientCompanyId: clientCompany.id }
    : { tenantId: tenant.id };

  const [openJobsCount, latestJobs] = await Promise.all([
    prisma.job.count({
      where: {
        ...scopeFilter,
        status: "open",
        visibility: "public",
        OR: [{ internalOnly: false }, { internalOnly: null }],
      },
    }),
    prisma.job.findMany({
      where: {
        ...scopeFilter,
        status: "open",
        visibility: "public",
        OR: [{ internalOnly: false }, { internalOnly: null }],
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        location: true,
        locationType: true,
        employmentType: true,
        createdAt: true,
        slug: true,
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:py-12">
        {/* Sidebar (hub shell) */}
        <aside className="w-full md:w-72 md:flex-none">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt={displayName}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Jobs hub
                </p>
                <h1 className="truncate text-lg font-semibold text-slate-50">
                  {displayName}
                </h1>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-[11px] leading-relaxed text-slate-300">
              {careerSiteSettings?.aboutHtml ? (
                <div
                  className="[&_p]:mt-1.5 [&_p]:text-[11px] [&_p]:leading-relaxed [&_strong]:font-semibold [&_ul]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mt-0.5"
                  dangerouslySetInnerHTML={{
                    __html: careerSiteSettings.aboutHtml,
                  }}
                />
              ) : (
                <p>
                  This hub brings together jobs, links and a simple overview for{" "}
                  {displayName}. Use the button on the right to explore open
                  jobs.
                </p>
              )}
            </div>

            {/* Social + website */}
            <div className="mt-5 border-t border-slate-800 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Online
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-100 hover:border-sky-500 hover:text-sky-400"
                  >
                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Website
                  </a>
                )}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-100 hover:border-sky-500 hover:text-sky-400"
                  >
                    LinkedIn
                  </a>
                )}
                {twitterUrl && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-100 hover:border-sky-500 hover:text-sky-400"
                  >
                    X / Twitter
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-100 hover:border-sky-500 hover:text-sky-400"
                  >
                    Instagram
                  </a>
                )}
                {!websiteUrl &&
                  !linkedinUrl &&
                  !twitterUrl &&
                  !instagramUrl && (
                    <p className="text-[10px] text-slate-500">
                      Add website and social links in the Jobs settings page to
                      show them here.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main hub content */}
        <section className="flex-1">
          <div className="space-y-4">
            {/* Hero + CTA to jobs */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/80 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.65)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Jobs
              </p>
              <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-50">
                    {openJobsCount > 0
                      ? `Open jobs at ${displayName}`
                      : `Jobs at ${displayName}`}
                  </h2>
                  <p className="mt-1 text-[12px] text-slate-300">
                    {openJobsCount > 0 ? (
                      <>
                        {openJobsCount}{" "}
                        {openJobsCount === 1 ? "job is" : "jobs are"} currently
                        open. Browse details and apply in a few clicks.
                      </>
                    ) : (
                      <>
                        There are no open jobs published right now. Check back
                        soon or follow this organisation&apos;s channels.
                      </>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/jobs"
                    className="inline-flex items-center rounded-full bg-sky-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow-sm hover:bg-sky-400"
                  >
                    View all jobs
                  </Link>
                </div>
              </div>
            </div>

            {/* Recently posted jobs */}
            {latestJobs.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-50">
                    Recently posted jobs
                  </h3>
                  <Link
                    href="/jobs"
                    className="text-[11px] font-medium text-sky-400 hover:text-sky-300"
                  >
                    See all jobs
                  </Link>
                </div>
                <div className="mt-4 grid gap-3">
                  {latestJobs.map((job) => {
                    const href = job.slug
                      ? `/jobs/${encodeURIComponent(job.slug)}`
                      : `/jobs/${job.id}`;
                    return (
                      <Link
                        key={job.id}
                        href={href}
                        className="group flex items-start justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 px-4 py-3 hover:border-sky-500/70 hover:bg-slate-900/80"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-slate-50 group-hover:text-sky-100">
                            {job.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                            {job.location && <span>{job.location}</span>}
                            {job.locationType && (
                              <span className="rounded-full border border-slate-700/70 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-300">
                                {job.locationType}
                              </span>
                            )}
                            {job.employmentType && (
                              <span className="rounded-full border border-slate-700/70 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-300">
                                {job.employmentType}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          View job →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MarketingHome() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-16">
        <header className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            ThinkATS
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
            Modern jobs infrastructure for agencies and talent teams.
          </h1>
          <p className="text-sm text-slate-300">
            ThinkATS gives you multi-tenant applicant tracking, client-branded
            jobs pages and simple automation – with candidates and jobs managed
            in one shared workspace.
          </p>
        </header>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-[12px] text-slate-300">
          <p>
            You&apos;re looking at the main ThinkATS home. When you connect a
            subdomain such as{" "}
            <span className="font-mono text-sky-400">acme.thinkats.com</span>,
            that host becomes the jobs hub for that client or tenant.
          </p>
        </div>
      </div>
    </main>
  );
}
