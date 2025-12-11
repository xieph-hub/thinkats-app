// app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ThinkATS",
  description: "Multi-tenant ATS and jobs infrastructure for modern teams.",
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
  // MAIN MARKETING LANDING: thinkats.com (no tenant)
  // ------------------------------------------------------
  if (isAppHost && !tenant) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-6xl space-y-20 px-4 py-16">
          {/* HERO */}
          <section className="grid items-center gap-10 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-[11px] font-medium text-slate-300">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] text-emerald-300">
                  ●
                </span>
                Multi-tenant ATS for agencies, in-house teams &amp; platforms
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                One ATS to run{" "}
                <span className="text-sky-300">every client&apos;s jobs hub</span>.
              </h1>
              <p className="max-w-xl text-sm text-slate-300">
                ThinkATS lets you publish roles, screen candidates and manage
                pipelines across multiple organisations. Each client gets a
                branded jobs hub on its own subdomain, all powered by a shared
                ATS with built-in screening and ranking.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full bg-sky-500 px-5 py-2 text-[12px] font-semibold text-slate-950 shadow-sm hover:bg-sky-400"
                >
                  Book a product walkthrough
                </Link>
                <Link
                  href="/product"
                  className="inline-flex items-center rounded-full border border-slate-700 bg-transparent px-5 py-2 text-[12px] font-semibold text-slate-100 hover:bg-slate-900/60"
                >
                  Explore product overview
                </Link>
                <p className="text-[11px] text-slate-400">
                  ATS, career sites and scoring in one stack.
                </p>
              </div>
            </div>

            {/* Right: anonymised client + scoring snapshot */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-200 shadow-xl">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Example client workspace
              </p>

              <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                {/* Client header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-[11px] font-semibold text-sky-300">
                      AC
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-50">
                        Acme Collective
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Jobs hub · 6 open roles
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    Live hub
                  </span>
                </div>

                {/* Featured roles */}
                <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-900/80 p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Featured roles
                  </p>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-50">
                        Head of Commercial Operations
                      </span>
                      <span className="text-slate-500">
                        Lagos · Full-time
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-50">
                        Senior Product Manager
                      </span>
                      <span className="text-slate-500">Remote</span>
                    </div>
                  </div>
                </div>

                {/* Scoring snapshot */}
                <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Screened &amp; ranked automatically
                  </p>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200">Adaobi O.</span>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        92 · Strong match
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200">Tolu A.</span>
                      <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                        78 · Good fit
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200">Chioma K.</span>
                      <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] font-medium text-slate-200">
                        64 · Needs review
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-800 bg-slate-950/40 px-3 py-2 text-[11px]">
                  <span className="text-slate-400">
                    Each client gets a branded jobs hub, ATS workspace and
                    built-in scoring on their own subdomain.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* VALUE PILLARS */}
          <section className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Why teams choose ThinkATS
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Multi-tenant by design
                </p>
                <p className="mt-2 text-[12px] text-slate-300">
                  Run roles for your own organisation and for clients from one
                  workspace. Each tenant remains isolated; your team stays on a
                  single platform.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Branded jobs hubs
                </p>
                <p className="mt-2 text-[12px] text-slate-300">
                  Give each organisation a clean jobs hub and role pages on
                  subdomains like{" "}
                  <span className="font-mono text-sky-300">
                    client.thinkats.com
                  </span>{" "}
                  — no extra websites or plugins.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Screening &amp; scoring
                </p>
                <p className="mt-2 text-[12px] text-slate-300">
                  Every application is scored and ranked against the role, so
                  shortlists and “who to review first” are always one click
                  away.
                </p>
              </div>
            </div>
          </section>

          {/* WHO IT'S FOR */}
          <section className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Who ThinkATS is for
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-[12px] text-slate-200">
                <p className="mb-1 text-[11px] font-semibold text-slate-200">
                  Recruitment agencies
                </p>
                <p>
                  Own the full hiring experience for every client. Publish roles
                  to client hubs, manage pipelines centrally and send scored
                  shortlists.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-[12px] text-slate-200">
                <p className="mb-1 text-[11px] font-semibold text-slate-200">
                  In-house HR &amp; People teams
                </p>
                <p>
                  Give different business units or subsidiaries their own jobs
                  hub while keeping approvals, analytics and candidate history
                  in one system.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-[12px] text-slate-200">
                <p className="mb-1 text-[11px] font-semibold text-slate-200">
                  Talent platforms &amp; networks
                </p>
                <p>
                  Power a network of roles across multiple organisations, with
                  shared infrastructure and flexible branding per partner.
                </p>
              </div>
            </div>
          </section>

          {/* WHAT YOU CENTRALISE */}
          <section className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              What you run on ThinkATS
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-[12px] text-slate-200">
                <ul className="space-y-2">
                  <li>
                    <span className="font-semibold text-slate-100">
                      Jobs hubs &amp; listings
                    </span>
                    <br />
                    Public jobs hubs, listings and role pages for each tenant,
                    wired into the same ATS your team uses every day.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-100">
                      Multi-client pipelines
                    </span>
                    <br />
                    Per-role pipelines with clear stages, notes and status for
                    every candidate, separated cleanly by tenant and client.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-100">
                      Hiring collaboration
                    </span>
                    <br />
                    Bring hiring managers into the right roles, not the whole
                    system. Capture feedback, move candidates and document
                    decisions.
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-[12px] text-slate-200">
                <ul className="space-y-2">
                  <li>
                    <span className="font-semibold text-slate-100">
                      Screening &amp; ranking
                    </span>
                    <br />
                    Score applications as they land, surface the strongest
                    profiles and keep a clear record of why someone was
                    shortlisted.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-100">
                      Central reporting
                    </span>
                    <br />
                    See open roles, funnel health and candidate volume across
                    tenants from one place – without jumping between tools.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-100">
                      Branding &amp; employer story
                    </span>
                    <br />
                    Let each organisation control their copy, colours, banners
                    and social links on their jobs hub while you keep the
                    infrastructure consistent.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA (no copyright so it doesn’t clash with global footer) */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 text-sm text-slate-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Next step
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  Use ThinkATS for your own mandates, then extend it to clients,
                  business units or partners as a shared hiring backbone.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full bg-sky-500 px-5 py-2 text-[12px] font-semibold text-slate-950 shadow-sm hover:bg-sky-400"
                >
                  Book a demo
                </Link>
                <Link
                  href="/product"
                  className="inline-flex items-center rounded-full border border-slate-700 px-5 py-2 text-[12px] font-semibold text-slate-100 hover:bg-slate-900"
                >
                  View product details
                </Link>
              </div>
            </div>
          </section>
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
  // TENANT / CLIENT HOST → MINI ATS HOME (white theme)
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

  const totalJobs = jobs.length;
  const primaryLocation =
    jobs.find((j) => j.location)?.location || "Multiple locations";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 lg:py-12">
        {/* HERO: client mini ATS home */}
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
            className="flex flex-col gap-4 p-6 sm:p-8 md:flex-row md:items-center md:justify-between"
            style={!bannerImageUrl ? { backgroundColor: heroBackground } : {}}
          >
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
                Jobs hub
              </p>
              <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                {heroTitle}
              </h2>
              <p className="max-w-2xl text-sm text-slate-600">
                {heroSubtitle}
              </p>
            </div>

            <div className="space-y-3 text-sm md:text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Open roles
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {totalJobs}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Primary location
                  </p>
                  <p className="mt-1 text-xs text-slate-700">
                    {primaryLocation}
                  </p>
                </div>
              </div>
              {hasJobs && (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={jobsHref}
                    className="inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:opacity-90"
                    style={{ backgroundColor: accentColor }}
                  >
                    View all jobs
                  </Link>
                  <p className="text-[11px] text-slate-500">
                    Top roles below are already{" "}
                    <span className="font-semibold text-slate-900">
                      screened &amp; ranked
                    </span>{" "}
                    against this organisation&apos;s needs.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GRID: side rail + main content */}
        <div className="grid gap-8 lg:grid-cols-[240px,minmax(0,1fr)]">
          {/* SIDE RAIL */}
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
                  <span
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-50"
                    style={{ backgroundColor: accentColor }}
                  >
                    <span>Overview</span>
                    <span className="text-[10px] text-slate-100">
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
                        {totalJobs}
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

            {/* Subtle stamp */}
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
