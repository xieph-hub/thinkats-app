// components/careers/CareersPageRenderer.tsx
import type { CareerSiteSettings, Job, CareerTheme } from "@prisma/client";
import type {
  CareerLayout,
  CareerLayoutSection,
} from "@/lib/careersLayout";

interface CareersPageRendererProps {
  displayName: string;

  // Branding + content sources
  settings?: CareerSiteSettings | null;
  theme?: CareerTheme | null;
  layout?: CareerLayout | null;

  jobs: Job[];

  primaryColor: string;
  accentColor: string;

  /**
   * Optional base URL for careers assets (e.g. CDN).
   * If omitted, we fall back to:
   *   NEXT_PUBLIC_CAREERS_ASSET_BASE_URL || NEXT_PUBLIC_SITE_URL
   */
  assetBaseUrl?: string | null;
}

function formatDate(date: Date | string): string {
  try {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Normalise layout: if nothing is set yet, fall back to
 * [hero, about, featuredRoles] with a sensible default limit.
 */
function getEffectiveSections(layout: CareerLayout | null): CareerLayoutSection[] {
  const defaultSections: CareerLayoutSection[] = [
    { type: "hero" },
    { type: "about" },
    { type: "featuredRoles", props: { limit: 8 } },
  ];

  const raw = Array.isArray(layout?.sections) ? layout!.sections : defaultSections;

  // Respect `visible: false` if/when you start writing that
  return raw.filter((section) => (section as any)?.visible !== false);
}

/**
 * Prefer a banner asset path (CareerTheme.bannerImagePath) and build a URL
 * using assetBaseUrl; otherwise fall back to bannerImageUrl on settings/theme.
 */
function computeBannerImageUrl(
  theme: CareerTheme | null | undefined,
  settings: CareerSiteSettings | null | undefined,
  assetBaseUrl?: string | null,
): string | null {
  const envBase =
    process.env.NEXT_PUBLIC_CAREERS_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "";

  const base =
    (assetBaseUrl ?? envBase ?? "").toString().trim();

  let bannerUrl: string | null = null;

  // Try bannerImagePath from CareerTheme first (path like "banners/acme-hero.jpg")
  const themeAny = theme as any;
  const bannerImagePath: string | undefined =
    themeAny?.bannerImagePath || themeAny?.banner_image_path;

  if (base && bannerImagePath) {
    const baseClean = base.replace(/\/$/, "");
    const pathClean = String(bannerImagePath).replace(/^\//, "");
    bannerUrl = `${baseClean}/${pathClean}`;
  }

  // Fallback to any explicit URL (theme or settings)
  if (!bannerUrl) {
    const themeBannerUrl: string | undefined = themeAny?.bannerImageUrl;
    bannerUrl = themeBannerUrl || settings?.bannerImageUrl || null;
  }

  return bannerUrl;
}

export default function CareersPageRenderer(props: CareersPageRendererProps) {
  const {
    displayName,
    settings,
    theme,
    layout = null,
    jobs,
    primaryColor,
    accentColor,
    assetBaseUrl,
  } = props;

  const hasJobs = jobs.length > 0;
  const sections = getEffectiveSections(layout);

  // Defaults from settings (or sensible hard-coded ones)
  const defaultHeroTitle =
    settings?.heroTitle ||
    `At ${displayName}, we believe in the power of people.`;
  const defaultHeroSubtitle =
    settings?.heroSubtitle ||
    "Explore how you can grow your career and make meaningful impact with us.";

  const defaultAboutHtml =
    settings?.aboutHtml ||
    `<p>${displayName} is building a team of curious, ambitious people who care deeply about their work and the people they work with.</p>`;

  // Social links from settings (for now)
  const linkedinUrl = settings?.linkedinUrl || null;
  const twitterUrl = settings?.twitterUrl || null;
  const instagramUrl = settings?.instagramUrl || null;

  const bannerImageUrl = computeBannerImageUrl(theme ?? null, settings ?? null, assetBaseUrl);

  return (
    <div className="space-y-10">
      {sections.map((section, index) => {
        const key = section.id || `${section.type}-${index}`;
        const propsAny = (section as any).props || {};

        switch (section.type) {
          case "hero": {
            const heroTitle = propsAny.title ?? defaultHeroTitle;
            const heroSubtitle = propsAny.subtitle ?? defaultHeroSubtitle;

            return (
              <HeroSection
                key={key}
                displayName={displayName}
                heroTitle={heroTitle}
                heroSubtitle={heroSubtitle}
                bannerImageUrl={bannerImageUrl}
                linkedinUrl={linkedinUrl}
                twitterUrl={twitterUrl}
                instagramUrl={instagramUrl}
              />
            );
          }

          case "about": {
            const aboutTitle =
              propsAny.title ?? `About ${displayName}`;
            const aboutHtml =
              propsAny.html ?? defaultAboutHtml;

            return (
              <AboutSection
                key={key}
                displayName={displayName}
                aboutTitle={aboutTitle}
                aboutHtml={aboutHtml}
                primaryColor={primaryColor}
                accentColor={accentColor}
                hasJobs={hasJobs}
              />
            );
          }

          case "featuredRoles": {
            let limit: number | undefined;

            if (typeof propsAny.limit === "number") {
              limit = propsAny.limit;
            } else if (typeof propsAny.limit === "string") {
              const parsed = parseInt(propsAny.limit, 10);
              if (!Number.isNaN(parsed)) {
                limit = parsed;
              }
            }

            const safeLimit =
              typeof limit === "number" && limit > 0
                ? Math.min(50, Math.max(1, limit))
                : 8;

            return (
              <FeaturedRolesSection
                key={key}
                displayName={displayName}
                jobs={jobs}
                accentColor={accentColor}
                limit={safeLimit}
              />
            );
          }

          default:
            // Unknown section type – ignore for now (future-proof for experiments)
            return null;
        }
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

interface HeroSectionProps {
  displayName: string;
  heroTitle: string;
  heroSubtitle: string;
  bannerImageUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
}

function HeroSection({
  displayName,
  heroTitle,
  heroSubtitle,
  bannerImageUrl,
  linkedinUrl,
  twitterUrl,
  instagramUrl,
}: HeroSectionProps) {
  const hasSocial =
    Boolean(linkedinUrl) || Boolean(twitterUrl) || Boolean(instagramUrl);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] lg:items-start">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Careers at {displayName}
        </p>
        <h1 className="text-2xl font-semibold leading-snug text-slate-950 lg:text-3xl">
          {heroTitle}
        </h1>
        <p className="text-sm text-slate-600">{heroSubtitle}</p>

        {hasSocial && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              Connect with us
            </span>
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium hover:border-slate-300 hover:text-slate-900"
              >
                LinkedIn
              </a>
            )}
            {twitterUrl && (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium hover:border-slate-300 hover:text-slate-900"
              >
                X / Twitter
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium hover:border-slate-300 hover:text-slate-900"
              >
                Instagram
              </a>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {bannerImageUrl ? (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerImageUrl}
              alt={`${displayName} careers banner`}
              className="h-40 w-full object-cover"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-xs text-slate-500">
            Use your careers theme to upload a banner image that reflects your
            culture and workspace.
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">Why join us</p>
          <p className="mt-1 text-slate-600">
            We&apos;re looking for people who are excited to solve meaningful
            problems, collaborate with kind teammates, and grow their careers
            over the long term.
          </p>
        </div>
      </div>
    </section>
  );
}

interface AboutSectionProps {
  displayName: string;
  aboutTitle: string;
  aboutHtml: string;
  primaryColor: string;
  accentColor: string;
  hasJobs: boolean;
}

function AboutSection({
  displayName,
  aboutTitle,
  aboutHtml,
  primaryColor,
  accentColor,
  hasJobs,
}: AboutSectionProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-700">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {aboutTitle || `About ${displayName}`}
        </p>
        <div
          className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:mb-2 prose-p:text-slate-700 prose-a:text-sky-600"
          dangerouslySetInnerHTML={{ __html: aboutHtml }}
        />
      </div>

      <div className="space-y-3">
        <div
          className="rounded-2xl border px-4 py-4 text-xs text-slate-700"
          style={{ borderColor: primaryColor }}
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Don&apos;t see your role yet?
          </p>
          <p>
            We&apos;re always interested in exceptional people. If you don&apos;t
            see a perfect match today, you can still apply to a general talent
            pool or check back again soon.
          </p>
        </div>

        {hasJobs && (
          <div
            className="rounded-2xl border px-4 py-4 text-xs text-slate-700"
            style={{ borderColor: accentColor }}
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              How our hiring works
            </p>
            <p>
              Our process typically includes an intro conversation, role-fit
              interview, and a practical case or portfolio review. We aim to
              give you clear timelines and feedback along the way.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

interface FeaturedRolesSectionProps {
  displayName: string;
  jobs: Job[];
  accentColor: string;
  limit: number;
}

function FeaturedRolesSection({
  displayName,
  jobs,
  accentColor,
  limit,
}: FeaturedRolesSectionProps) {
  const hasJobs = jobs.length > 0;
  const featuredJobs = hasJobs ? jobs.slice(0, limit) : [];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">
          {hasJobs ? "Open roles" : "No open roles right now"}
        </h2>
        {hasJobs && (
          <p className="text-[11px] text-slate-500">
            Showing {featuredJobs.length} role
            {featuredJobs.length > 1 ? "s" : ""}. See more under{" "}
            <span className="font-medium">Open roles</span>.
          </p>
        )}
      </div>

      {!hasJobs ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
          There are no live openings at the moment. Please check back soon or
          follow {displayName} on social channels for updates.
        </div>
      ) : (
        <div className="space-y-3">
          {featuredJobs.map((job) => {
            const slugOrId = job.slug || job.id;

            return (
              <article
                key={job.id}
                className="group flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 transition hover:border-slate-200 hover:bg-white"
              >
                <div className="flex-1 space-y-1.5">
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:underline">
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <a href={`/jobs/${slugOrId}`}>{job.title}</a>
                  </h3>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                    {job.location && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {job.location}
                      </span>
                    )}
                    {job.department && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {job.department}
                      </span>
                    )}
                    {job.employmentType && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {job.employmentType}
                      </span>
                    )}
                    {(job as any).experienceLevel && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {(job as any).experienceLevel}
                      </span>
                    )}
                  </div>
                  {job.shortDescription && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                      {job.shortDescription}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end justify-between gap-2 text-right">
                  <p className="text-[11px] text-slate-400">
                    Posted {formatDate(job.createdAt)}
                  </p>
                  <a
                    href={`/jobs/${slugOrId}`}
                    className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm"
                    style={{ backgroundColor: accentColor, color: "#0f172a" }}
                  >
                    View role
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
