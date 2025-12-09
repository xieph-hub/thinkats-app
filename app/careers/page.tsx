// app/careers/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import type { Tenant } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getHostContext } from "@/lib/host";
import { getResourcinTenant } from "@/lib/tenant";
import TenantLogo from "@/components/ats/tenants/TenantLogo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers | ThinkATS",
  description:
    "Explore careers and open roles powered by ThinkATS tenant workspaces.",
};

// Extend Tenant with optional marketing fields WITHOUT breaking types.
// These fields are safe even if they don't exist in Prisma yet – they'll just be undefined.
type TenantWithMarketing = Tenant & {
  heroHeadline?: string | null;
  heroSubheading?: string | null;
  heroImageUrl?: string | null;
  brandPrimaryColor?: string | null;
  brandAccentColor?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  cultureHeadline?: string | null;
  cultureBody?: string | null;
};

type JobRow = {
  id: string;
  slug: string | null;
  title: string;
  summary: string | null;
  location: string | null;
  employmentType: string | null;
  clientName: string | null;
};

function formatLocation(job: JobRow): string {
  const pieces: string[] = [];
  if (job.location) pieces.push(job.location);
  if (job.employmentType) pieces.push(job.employmentType);
  return pieces.join(" • ");
}

export default async function CareersPage() {
  const { isPrimaryHost, tenantSlugFromHost } = getHostContext();
  const headersList = headers();
  const hostHeader = headersList.get("host") ?? "www.thinkats.com";

  // ---------------------------------------------------------------------------
  // 1) Resolve tenant based on host
  //    - tenantSlug.thinkats.com → that tenant
  //    - primary host (thinkats.com) → default/Resourcin tenant
  // ---------------------------------------------------------------------------
  let tenant: TenantWithMarketing | null = null;

  if (tenantSlugFromHost) {
    tenant = (await prisma.tenant.findUnique({
      where: { slug: tenantSlugFromHost },
    })) as TenantWithMarketing | null;
  } else {
    // On the primary host, fall back to your default tenant (Resourcin) for now.
    const defaultTenant = await getResourcinTenant();
    tenant = defaultTenant as TenantWithMarketing;
  }

  if (!tenant) {
    // Soft failure: tenant host exists in DNS/Vercel but not configured in DB
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16 text-slate-50">
        <div className="max-w-md text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            ThinkATS Careers
          </p>
          <h1 className="mt-2 text-xl font-semibold text-slate-50">
            This careers site isn&apos;t configured yet
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            The subdomain <span className="font-mono">{hostHeader}</span> is
            pointing to ThinkATS, but there isn&apos;t an active workspace
            connected to it. Please contact your recruiter or ThinkATS support
            to get this careers site set up.
          </p>
          <a
            href="https://www.thinkats.com"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-white"
          >
            Go to ThinkATS
          </a>
        </div>
      </main>
    );
  }

  const tenantLabel = tenant.name || tenant.slug || "Company";
  const marketing = tenant;

  // Branding – calm, corporate, but still modern
  const primaryColor = marketing.brandPrimaryColor || "#172965";
  const accentColor = marketing.brandAccentColor || "#4F46E5";

  const heroHeadline =
    marketing.heroHeadline || `Careers at ${tenantLabel}`;
  const heroSubheading =
    marketing.heroSubheading ||
    `Join ${tenantLabel} and help build what comes next.`;

  const cultureHeadline =
    marketing.cultureHeadline || "How we work";
  const cultureBody =
    marketing.cultureBody ||
    `${tenantLabel} is building a team that values ownership, clear thinking and thoughtful collaboration. We care about doing meaningful work, not theatre.`;

  // Canonical URL for this careers page (used for share links)
  const canonicalUrl = `https://${hostHeader}/careers`;

  // Social / follow links – only render if configured
  const socialLinks = [
    {
      key: "linkedin",
      label: "LinkedIn",
      url: marketing.linkedinUrl,
      bg: "#0A66C2",
    },
    {
      key: "twitter",
      label: "X",
      url: marketing.twitterUrl,
      bg: "#111827",
    },
    {
      key: "instagram",
      label: "Instagram",
      url: marketing.instagramUrl,
      bg: "#C13584",
    },
    {
      key: "facebook",
      label: "Facebook",
      url: marketing.facebookUrl,
      bg: "#1877F2",
    },
  ].filter((s) => s.url);

  // ---------------------------------------------------------------------------
  // 2) Load this tenant's published jobs
  //    This ensures tenantslug.thinkats.com/careers lists only THEIR roles.
  // ---------------------------------------------------------------------------
  const jobsRaw = await prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      isPublished: true,
    },
    orderBy: { createdAt: "desc" },
    include: {
      clientCompany: true,
    },
  });

  const jobs: JobRow[] = jobsRaw.map((job) => {
    const summary =
      (job as any).shortDescription ??
      (job as any).summary ??
      (job as any).description ??
      null;

    return {
      id: job.id,
      slug: job.slug,
      title: job.title,
      summary,
      location: job.location,
      employmentType: job.employmentType,
      clientName: job.clientCompany?.name ?? null,
    };
  });

  const hasJobs = jobs.length > 0;

  // ---------------------------------------------------------------------------
  // 3) UI – Tenant mini-site + careers hub
  // ---------------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Hero / banner */}
      <section
        className="border-b border-slate-800/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 px-4 py-10 sm:px-6 lg:px-10"
        style={{
          backgroundImage: `radial-gradient(circle at top, ${accentColor}22, #020617 60%)`,
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: logo + copy */}
            <div className="max-w-xl space-y-5">
              <div className="inline-flex items-center rounded-full bg-slate-900/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300 ring-1 ring-slate-700/80">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                We&apos;re hiring
              </div>

              <div className="flex items-center gap-3">
                <TenantLogo
                  src={tenant.logoUrl || null}
                  label={tenantLabel}
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-slate-400">
                    Powered by ThinkATS
                  </p>
                  <p className="text-sm font-semibold text-slate-50">
                    {tenantLabel}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-semibold leading-tight text-slate-50 sm:text-3xl">
                  {heroHeadline}
                </h1>
                <p className="max-w-lg text-sm text-slate-300">
                  {heroSubheading}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#open-roles"
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  View open roles
                </a>
                {hasJobs && (
                  <span className="text-[11px] text-slate-400">
                    {jobs.length}{" "}
                    {jobs.length === 1 ? "role available" : "roles available"}
                  </span>
                )}
              </div>

              {socialLinks.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className="mr-1 text-slate-500">
                    Connect with us:
                  </span>
                  {socialLinks.map((s) => (
                    <a
                      key={s.key}
                      href={s.url!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium text-white shadow-sm"
                      style={{ backgroundColor: s.bg as string }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Right: simple “culture” card to keep it calm + corporate */}
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-200 shadow-xl shadow-slate-950/60">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {cultureHeadline}
              </p>
              <p className="mt-2 text-xs text-slate-200">{cultureBody}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-900/80 p-3">
                  <p className="text-[11px] font-semibold text-slate-100">
                    Clear problems
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    We scope work carefully so you&apos;re not guessing what
                    success looks like.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-3">
                  <p className="text-[11px] font-semibold text-slate-100">
                    Thoughtful people
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    You&apos;ll work with people who care about quality, not
                    theatre.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-3">
                  <p className="text-[11px] font-semibold text-slate-100">
                    Healthy pace
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Ambitious, but sustainable. No heroics as a process.
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-3">
                  <p className="text-[11px] font-semibold text-slate-100">
                    Real ownership
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    You ship, measure impact, and improve—end to end.
                  </p>
                </div>
              </div>

              {tenant.websiteUrl && (
                <a
                  href={tenant.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center text-[11px] font-medium text-slate-100 underline-offset-2 hover:underline"
                >
                  Visit corporate site
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section
        id="open-roles"
        className="border-t border-slate-900 bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Open roles
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                Join the team
              </h2>
            </div>
            {hasJobs && (
              <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold text-slate-50">
                {jobs.length} {jobs.length === 1 ? "role" : "roles"} open
              </span>
            )}
          </div>

          {!hasJobs ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
              <p className="font-medium text-slate-700">
                No active roles right now
              </p>
              <p className="mt-1 text-[13px] text-slate-500">
                {tenantLabel} isn&apos;t hiring for any public roles at the
                moment. You can still reach out to share your profile for
                future opportunities.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {jobs.map((job) => {
                const href = `/jobs/${encodeURIComponent(
                  job.slug || job.id,
                )}`;

                return (
                  <article
                    key={job.id}
                    className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          <Link href={href} className="hover:underline">
                            {job.title}
                          </Link>
                        </h3>
                        {job.clientName && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                            {job.clientName}
                          </span>
                        )}
                      </div>

                      {job.summary && (
                        <p className="line-clamp-3 text-xs text-slate-600">
                          {job.summary}
                        </p>
                      )}

                      <p className="mt-1 text-[11px] text-slate-500">
                        {formatLocation(job)}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 text-[11px]">
                      <Link
                        href={href}
                        className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-50 hover:bg-slate-800"
                      >
                        View role
                      </Link>
                      <span className="text-slate-400">
                        Powered by{" "}
                        <span className="font-semibold text-slate-600">
                          ThinkATS
                        </span>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer strip */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-4 text-[11px] text-slate-500 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} {tenantLabel}. All rights reserved.
          </span>
          <span>
            Careers site powered by{" "}
            <a
              href="https://www.thinkats.com"
              className="font-semibold text-slate-200 hover:underline"
            >
              ThinkATS
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
