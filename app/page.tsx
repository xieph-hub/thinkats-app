// app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS",
  description: "Modern ATS and jobs infrastructure for teams and agencies.",
};

function normaliseWebsiteUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function getPublicJobsForTenant(args: {
  tenantId: string;
  clientCompanyId?: string | null;
  limit?: number;
}) {
  const where: any = {
    tenantId: args.tenantId,
    status: "open",
    visibility: "public",
    OR: [{ internalOnly: false }, { internalOnly: null }],
  };

  if (args.clientCompanyId) {
    where.clientCompanyId = args.clientCompanyId;
  }

  return prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      clientCompany: true,
    },
    take: args.limit ?? 5,
  });
}

export default async function RootPage() {
  const hostContext = await getHostContext();
  const {
    isAppHost,
    tenant,
    clientCompany,
    careerSiteSettings,
    host,
  } = hostContext as any;

  // ------------------------------------------------------
  // Main app host (no tenant resolved) → marketing home
  // ------------------------------------------------------
  if (isAppHost && !tenant) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Applicant tracking · Multi-tenant
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Jobs infrastructure for agencies, in-house teams &amp; platforms.
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              ThinkATS powers white-label jobs hubs and pipelines for your
              clients. Every tenant gets a clean jobs hub, jobs listing and a
              shared ATS workspace.
            </p>
          </header>
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
            <p>
              You&apos;re on the main ThinkATS site. Tenant hubs live on their
              own subdomains, such as{" "}
              <span className="font-mono text-sky-400">
                resourcin.thinkats.com
              </span>{" "}
              or{" "}
              <span className="font-mono text-sky-400">
                yourclient.thinkats.com
              </span>
              .
            </p>
          </section>
          <footer className="mt-4 text-[10px] text-slate-500">
            © {new Date().getFullYear()} ThinkATS.
          </footer>
        </div>
      </main>
    );
  }

  // ------------------------------------------------------
  // Any other host with no tenant → soft error
  // ------------------------------------------------------
  if (!tenant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <h1 className="text-lg font-semibold">Jobs hub not configured</h1>
          <p className="mt-3 text-sm text-slate-400">
            We couldn&apos;t resolve a tenant for{" "}
            <span className="font-mono text-slate-200">{host}</span>. If you
            expected to see a jobs hub here, please contact ThinkATS support.
          </p>
        </div>
      </main>
    );
  }

  // ------------------------------------------------------
  // Tenant / client host → jobs hub (WHITE SKELETON)
  // ------------------------------------------------------
  const settingsAny = careerSiteSettings as any;

  const displayName =
    clientCompany?.name || tenant.name || (tenant as any).slug || host;

  const websiteRaw =
    (clientCompany as any)?.website || (tenant as any).websiteUrl || null;
  const websiteUrl = normaliseWebsiteUrl(websiteRaw);

  const careersAssetBase =
    process.env.NEXT_PUBLIC_CAREERS_ASSET_BASE_URL || "";

  const bannerImageUrl =
    settingsAny?.bannerImageUrl ||
    (careersAssetBase && settingsAny?.bannerImagePath
      ? `${careersAssetBase.replace(
          /\/$/,
          "",
        )}/${settingsAny.bannerImagePath}`
      : null);

  const primaryColor =
    settingsAny?.primaryColorHex || settingsAny?.primaryColor || "#172965";
  const accentColor =
    settingsAny?.accentColorHex || settingsAny?.accentColor || "#0ea5e9";
  const heroBackground =
    settingsAny?.heroBackgroundHex || "#F9FAFB"; // light default

  const heroTitle =
    settingsAny?.heroTitle || `Jobs at ${displayName || "this organisation"}`;
  const heroSubtitle =
    settingsAny?.heroSubtitle ||
    "Join the team and work on meaningful problems.";

  const aboutHtml =
    settingsAny?.aboutHtml ||
    "<p>Use this space to describe what it&apos;s like to work here: your culture, values and how you make decisions.</p>";

  const linkedinUrl = settingsAny?.linkedinUrl;
  const twitterUrl = settingsAny?.twitterUrl;
  const instagramUrl = settingsAny?.instagramUrl;

  const jobs = await getPublicJobsForTenant({
    tenantId: tenant.id,
    clientCompanyId: clientCompany?.id ?? null,
    limit: 4,
  });

  const hasJobs = jobs.length > 0;
  const jobsHref = "/jobs";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[240px,minmax(0,1fr)]">
          {/* SIDE RAIL / HUB NAV */}
          <aside className="space-y-4">
            {/* Identity card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {settingsAny?.logoUrl && (
                <div className="mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settingsAny.logoUrl}
                    alt={`${displayName} logo`}
                    className="h-8 w-auto"
                  />
                </div>
              )}
              <h1 className="text-sm font-semibold text-slate-900">
                {displayName}
              </h1>
              {websiteUrl && (
                <p className="mt-1 text-xs">
                  <Link
                    href={websiteUrl}
                    target="_blank"
                    className="text-sky-700 hover:underline"
                  >
                    Visit website
                  </Link>
                </p>
              )}
            </div>

            {/* Hub nav */}
            <nav className="rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Hub
              </p>
              <ul className="space-y-1">
                <li>
                  <span className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-slate-50">
                    <span>Overview</span>
                    <span className="text-[10px] text-slate-200">
                      You&apos;re here
                    </span>
                  </span>
                </li>
                <li>
                  <Link
                    href={jobsHref}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    <span>Jobs</span>
                    {hasJobs && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                        {jobs.length}
                      </span>
                    )}
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Social links */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Social
              </p>
              <div className="space-y-1">
                {websiteUrl && (
                  <p>
                    <Link
                      href={websiteUrl}
                      target="_blank"
                      className="text-slate-700 hover:underline"
                    >
                      Website
                    </Link>
                  </p>
                )}
                {linkedinUrl && (
                  <p>
                    <Link
                      href={linkedinUrl}
                      target="_blank"
                      className="text-slate-700 hover:underline"
                    >
                      LinkedIn
                    </Link>
                  </p>
                )}
                {twitterUrl && (
                  <p>
                    <Link
                      href={twitterUrl}
                      target="_blank"
                      className="text-slate-700 hover:underline"
                    >
                      X / Twitter
                    </Link>
                  </p>
                )}
                {instagramUrl && (
                  <p>
                    <Link
                      href={instagramUrl}
                      target="_blank"
                      className="text-slate-700 hover:underline"
                    >
                      Instagram
                    </Link>
                  </p>
                )}
                {!websiteUrl && !linkedinUrl && !twitterUrl && !instagramUrl && (
                  <p className="text-[11px] text-slate-500">
                    No social links have been added yet.
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* MAIN COLUMN */}
          <section className="space-y-6">
            {/* Hero */}
            <div
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              style={{ borderColor: primaryColor }}
            >
              {bannerImageUrl && (
                <div className="relative h-40 w-full overflow-hidden border-b border-slate-200 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bannerImageUrl}
                    alt={`${displayName} banner`}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div
                className="p-6 sm:p-8"
                style={
                  !bannerImageUrl ? { backgroundColor: heroBackground } : {}
                }
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Jobs hub
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
                  {heroTitle}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  {heroSubtitle}
                </p>
                {hasJobs && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span>
                      Showing{" "}
                      <span className="font-semibold text-slate-900">
                        {Math.min(jobs.length, 4)}
                      </span>{" "}
                      {jobs.length === 1 ? "open role" : "open roles"}.
                    </span>
                    <Link
                      href={jobsHref}
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
                      style={{
                        borderColor: accentColor,
                        color: accentColor,
                      }}
                    >
                      View all jobs
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* About / working here */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Working here
              </h3>
              <div
                className="prose prose-sm mt-3 max-w-none text-slate-700"
                dangerouslySetInnerHTML={{ __html: aboutHtml }}
              />
            </div>

            {/* Jobs list preview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Open jobs
                </h3>
                {hasJobs && (
                  <Link
                    href={jobsHref}
                    className="text-xs font-medium text-sky-700 hover:underline"
                  >
                    View all jobs
                  </Link>
                )}
              </div>
              {!hasJobs ? (
                <p className="mt-3 text-xs text-slate-500">
                  There are no open public roles at the moment. Check back
                  soon.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {jobs.map((job) => (
                    <li
                      key={job.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900">
                            {job.title}
                          </p>
                          {job.clientCompany && (
                            <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                              {job.clientCompany.name}
                            </p>
                          )}
                        </div>
                        {job.location && (
                          <p className="text-[11px] text-slate-500">
                            {job.location}
                          </p>
                        )}
                      </div>
                      {job.shortDescription && (
                        <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                          {job.shortDescription}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span>
                          {job.employmentType && <span>{job.employmentType}</span>}
                          {job.locationType && job.employmentType && " · "}
                          {job.locationType && <span>{job.locationType}</span>}
                        </span>
                        <Link
                          href={`/jobs/${encodeURIComponent(
                            job.slug || job.id,
                          )}`}
                          className="font-medium"
                          style={{ color: accentColor }}
                        >
                          View job
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer: minimal ThinkATS stamp */}
            <p className="mt-2 text-[10px] text-slate-500">
              Powered by{" "}
              <span className="font-semibold text-slate-800">ThinkATS</span>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
