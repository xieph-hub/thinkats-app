// components/careers/CareersPageRenderer.tsx
import type { CareerSiteSettings, Job } from "@prisma/client";

interface LayoutSection {
  type: string;
  id?: string;
  props?: Record<string, any> | null;
}

interface CareersPageRendererProps {
  displayName: string;
  settings?: CareerSiteSettings | null;
  jobs: Job[];

  // Optional base colors (e.g. from server-resolved theme)
  primaryColor?: string;
  accentColor?: string;

  // Raw theme tokens JSON from CareerTheme.tokens
  themeTokens?: Record<string, any> | null;

  // Layout JSON from CareerPage.layout
  layout?: unknown;
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

// Normalise the layout JSON into an array of sections we can safely map.
function normaliseLayout(rawLayout: unknown): LayoutSection[] {
  if (!rawLayout) return [];

  // Option A: layout is already an array of sections
  if (Array.isArray(rawLayout)) {
    return rawLayout.filter(
      (s): s is LayoutSection =>
        !!s &&
        typeof s === "object" &&
        typeof (s as any).type === "string",
    );
  }

  // Option B: layout is an object with a `sections` array
  if (
    typeof rawLayout === "object" &&
    rawLayout !== null &&
    Array.isArray((rawLayout as any).sections)
  ) {
    return (rawLayout as any).sections.filter(
      (s: any): s is LayoutSection =>
        !!s && typeof s === "object" && typeof s.type === "string",
    );
  }

  return [];
}

// Prefer bannerImagePath → full URL, then fall back to bannerImageUrl
function resolveBannerUrl(settings?: CareerSiteSettings | null): string | null {
  if (!settings) return null;

  if (settings.bannerImagePath) {
    const path = settings.bannerImagePath;
    const base = process.env.NEXT_PUBLIC_CAREERS_BANNER_BASE_URL;

    if (base) {
      return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    }

    // If the path is already a full URL, just return it
    if (/^https?:\/\//.test(path)) {
      return path;
    }

    // Relative path fallback (e.g. same origin)
    return path;
  }

  if (settings.bannerImageUrl) {
    return settings.bannerImageUrl;
  }

  return null;
}

// --------------------------- Section components -----------------------------

type HeroSectionProps = {
  displayName: string;
  heroTitle: string;
  heroSubtitle: string;
  bannerImageUrl: string | null;
  bannerImageAlt: string;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
};

function HeroSection(props: HeroSectionProps) {
  const {
    displayName,
    heroTitle,
    heroSubtitle,
    bannerImageUrl,
    bannerImageAlt,
    linkedinUrl,
    twitterUrl,
    instagramUrl,
  } = props;

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
              alt={bannerImageAlt}
              className="h-40 w-full object-cover"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-xs text-slate-500">
            Use your careers site settings to upload a banner image that
            reflects your culture and workspace.
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

type AboutSectionProps = {
  displayName: string;
  aboutHtml: string;
  primaryColor: string;
  accentColor: string;
  hasJobs: boolean;
};

function AboutSection(props: AboutSectionProps) {
  const { displayName, aboutHtml, primaryColor, accentColor, hasJobs } = props;

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-700">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          About {displayName}
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
            see a perfect match today, you can still apply to a general
            talent pool or check back again soon.
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

type FeaturedRolesSectionProps = {
  displayName: string;
  accentColor: string;
  jobs: Job[];
  limit?: number;
};

function FeaturedRolesSection(props: FeaturedRolesSectionProps) {
  const { displayName, accentColor, jobs, limit } = props;

  const hasJobs = jobs.length > 0;
  const featuredJobs = hasJobs
    ? jobs.slice(0, typeof limit === "number" ? limit : 8)
    : [];

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
                    {job.experienceLevel && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5">
                        {job.experienceLevel}
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

type RichTextSectionProps = {
  title?: string;
  html?: string;
};

function RichTextSection(props: RichTextSectionProps) {
  const { title, html } = props;

  if (!html) return null;

  return (
    <section className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-700">
      {title && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {title}
        </p>
      )}
      <div
        className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:mb-2 prose-p:text-slate-700 prose-a:text-sky-600"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}

// ------------------------------- Main render -------------------------------

export default function CareersPageRenderer(props: CareersPageRendererProps) {
  const {
    displayName,
    settings,
    jobs,
    primaryColor: primaryColorProp,
    accentColor: accentColorProp,
    themeTokens,
    layout,
  } = props;

  // Extract color tokens from theme (if provided)
  const tokenColors =
    themeTokens && typeof themeTokens === "object"
      ? ((themeTokens as any).colors as Record<string, any>) || {}
      : {};

  const resolvedPrimaryColor: string =
    (typeof tokenColors.primary === "string" && tokenColors.primary) ||
    settings?.primaryColorHex ||
    settings?.primaryColor ||
    primaryColorProp ||
    "#172965";

  const resolvedAccentColor: string =
    (typeof tokenColors.accent === "string" && tokenColors.accent) ||
    settings?.accentColorHex ||
    settings?.accentColor ||
    accentColorProp ||
    "#0ea5e9";

  const bannerImageUrl = resolveBannerUrl(settings);
  const bannerImageAlt =
    settings?.bannerImageAlt || `${displayName} careers banner`;

  const defaultHeroTitle =
    settings?.heroTitle ||
    `At ${displayName}, we believe in the power of people.`;
  const defaultHeroSubtitle =
    settings?.heroSubtitle ||
    "Explore how you can grow your career and make meaningful impact with us.";

  const defaultAboutHtml =
    settings?.aboutHtml ||
    `<p>${displayName} is building a team of curious, ambitious people who care deeply about their work and the people they work with.</p>`;

  const linkedinUrl = settings?.linkedinUrl || null;
  const twitterUrl = settings?.twitterUrl || null;
  const instagramUrl = settings?.instagramUrl || null;

  const hasJobs = jobs.length > 0;
  const sections = normaliseLayout(layout);

  // If no layout is configured yet → fall back to the default 3-section layout
  if (sections.length === 0) {
    return (
      <div className="space-y-10">
        <HeroSection
          displayName={displayName}
          heroTitle={defaultHeroTitle}
          heroSubtitle={defaultHeroSubtitle}
          bannerImageUrl={bannerImageUrl}
          bannerImageAlt={bannerImageAlt}
          linkedinUrl={linkedinUrl}
          twitterUrl={twitterUrl}
          instagramUrl={instagramUrl}
        />

        <AboutSection
          displayName={displayName}
          aboutHtml={defaultAboutHtml}
          primaryColor={resolvedPrimaryColor}
          accentColor={resolvedAccentColor}
          hasJobs={hasJobs}
        />

        <FeaturedRolesSection
          displayName={displayName}
          accentColor={resolvedAccentColor}
          jobs={jobs}
        />
      </div>
    );
  }

  // Layout is present → treat it as the source-of-truth for sections
  return (
    <div className="space-y-10">
      {sections.map((section, index) => {
        const key = section.id || `${section.type}-${index}`;
        const props = section.props || {};

        switch (section.type) {
          case "hero": {
            const heroTitle = (props.title as string) || defaultHeroTitle;
            const heroSubtitle =
              (props.subtitle as string) || defaultHeroSubtitle;

            return (
              <HeroSection
                key={key}
                displayName={displayName}
                heroTitle={heroTitle}
                heroSubtitle={heroSubtitle}
                bannerImageUrl={bannerImageUrl}
                bannerImageAlt={bannerImageAlt}
                linkedinUrl={linkedinUrl}
                twitterUrl={twitterUrl}
                instagramUrl={instagramUrl}
              />
            );
          }

          case "about": {
            const aboutHtml =
              (props.html as string | undefined) || defaultAboutHtml;

            return (
              <AboutSection
                key={key}
                displayName={displayName}
                aboutHtml={aboutHtml}
                primaryColor={resolvedPrimaryColor}
                accentColor={resolvedAccentColor}
                hasJobs={hasJobs}
              />
            );
          }

          case "featuredRoles": {
            const limit =
              typeof props.limit === "number" ? (props.limit as number) : undefined;

            return (
              <FeaturedRolesSection
                key={key}
                displayName={displayName}
                accentColor={resolvedAccentColor}
                jobs={jobs}
                limit={limit}
              />
            );
          }

          case "richText": {
            return (
              <RichTextSection
                key={key}
                title={props.title as string | undefined}
                html={props.html as string | undefined}
              />
            );
          }

          default:
            // Unknown section type – safely ignore
            return null;
        }
      })}
    </div>
  );
}
